import { createHash } from 'node:crypto'
import { getPool } from '../../../database/db'
import { apiError } from '../../utils/errors'
import { recordAuditEvent } from '../audit/audit'

/**
 * Results aggregation per SDD section 9 (TASKLIST P6-01, P6-04, P6-05).
 * Snapshot per contest includes zero-vote candidates, participation counts,
 * and percentage formulas that never divide by zero. Official snapshots are
 * versioned with SHA-256 checksums; publishing and finalising are separate
 * officer actions. Quick-count payload is identity-free (P6-07).
 */

export type ContestResult = {
  contestId: string
  code: string
  title: string
  totalBallots: number
  eligible: number
  participation: number // percent, rounded 2dp, 0 when eligible = 0
  options: { optionId: string; number: number; label: string; votes: number; percent: number }[]
}

type AggRow = {
  contest_id: string
  code: string
  title: string
  option_order: string
  option_id: string
  label: string
  ballots: string
  eligible: string
  participating: string
}

/**
 * P6-01: one consistent aggregate query per election — every option of every
 * contest, zero-vote options included, eligible = rolled entries that match
 * the contest scope, participation = ballots / max(eligible, 1) so the
 * formula never divides by zero.
 */
export async function aggregateElection(electionId: string): Promise<ContestResult[]> {
  const pool = getPool()
  const { rows } = await pool.query<AggRow>(
    `SELECT c.id AS contest_id, c.code, c.title, o.number::text AS option_order, o.id AS option_id,
            coalesce(o.motto, 'Opsi ' || o.number) AS label,
            (SELECT count(*) FROM ballots b WHERE b.contest_id = o.contest_id AND b.option_id = o.id)::text AS ballots,
            (SELECT count(*) FROM voting_rights vr
              WHERE vr.contest_id = c.id)::text AS eligible,
            (SELECT count(DISTINCT p.voting_right_id) FROM participations p
              WHERE p.contest_id = c.id)::text AS participating
     FROM contests c
     LEFT JOIN candidate_options o ON o.contest_id = c.id AND o.active = TRUE
     WHERE c.election_id = $1
     ORDER BY c.code, o.number`,
    [electionId],
  )
  const byContest = new Map<string, ContestResult>()
  for (const r of rows) {
    let result = byContest.get(r.contest_id)
    if (!result) {
      result = { contestId: r.contest_id, code: r.code, title: r.title, totalBallots: 0, eligible: Number(r.eligible), participation: 0, options: [] }
      byContest.set(r.contest_id, result)
    }
    const votes = Number(r.ballots)
    result.totalBallots += votes
    result.options.push({ optionId: r.option_id, number: Number(r.option_order), label: r.label, votes, percent: 0 })
  }
  for (const result of byContest.values()) {
    const participating = result.eligible > 0 ? Math.min(result.totalBallots, result.eligible) : 0
    result.participation = result.eligible > 0 ? round2((participating / result.eligible) * 100) : 0
    for (const opt of result.options) {
      opt.percent = result.totalBallots > 0 ? round2((opt.votes / result.totalBallots) * 100) : 0
    }
  }
  return [...byContest.values()].sort((a, b) => a.code.localeCompare(b.code))
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** P6-04: reconcile ballots vs participations before a snapshot is locked. */
export async function reconcileElection(electionId: string): Promise<{ anomalies: string[] }> {
  const pool = getPool()
  const anomalies: string[] = []
  const { rows: contests } = await pool.query<{ id: string; code: string }>(
    'SELECT id, code FROM contests WHERE election_id = $1', [electionId],
  )
  for (const c of contests) {
    const { rows } = await pool.query<{ b: string; p: string; rights: string }>(
      `SELECT (SELECT count(*) FROM ballots b WHERE b.contest_id = $1)::text b,
              (SELECT count(*) FROM participations p WHERE p.contest_id = $1)::text p,
              (SELECT count(*) FROM voting_rights vr WHERE vr.contest_id = $1)::text rights`,
      [c.id],
    )
    const ballots = Number(rows[0]?.b ?? 0)
    const parts = Number(rows[0]?.p ?? 0)
    const rights = Number(rows[0]?.rights ?? 0)
    if (ballots !== parts) anomalies.push(`${c.code}: ballot ${ballots} ≠ partisipasi ${parts}`)
    if (ballots > rights) anomalies.push(`${c.code}: suara ${String(ballots)} melebihi hak ${rights}`)
  }
  return { anomalies }
}


/** P6-04: official versioned snapshot — blocked when reconciliation fails. */
export async function createOfficialSnapshot(opts: { actorId: string; electionId: string }) {
  const pool = getPool()
  const { rows } = await pool.query<{ status: string }>(
    'SELECT status FROM elections WHERE id = $1 FOR UPDATE', [opts.electionId],
  )
  if (rows[0]?.status !== 'CLOSED') {
    apiError('STATE_INVALID', 'Snapshot resmi hanya dapat dibuat saat status CLOSED.')
  }
  const { anomalies } = await reconcileElection(opts.electionId)
  if (anomalies.length > 0) {
    apiError('STATE_INVALID', `Rekonsiliasi gagal: ${anomalies.join('; ')}`)
  }
  const results = await aggregateElection(opts.electionId)
  const { rows: versions } = await pool.query<{ v: string }>(
    'SELECT coalesce(max(version), 0)::text v FROM result_snapshots WHERE election_id = $1', [opts.electionId],
  )
  const nextVersion = Number(versions[0]?.v ?? 0) + 1
  const payload = { electionId: opts.electionId, version: nextVersion, results }
  const checksum = sha256Json(payload)
  await pool.query(
    'INSERT INTO result_snapshots (id, election_id, version, totals, checksum) VALUES ($1,$2,$3,$4,$5)',
    [rnd(), opts.electionId, nextVersion, payload, checksum],
  )
  await recordAuditEvent(pool, { actorId: opts.actorId, electionId: opts.electionId, action: 'ADMIN_SNAPSHOT_CREATE', target: checksum, changes: { version: nextVersion } })
  return { version: nextVersion, checksum }
}

function rnd(): string {
  return Array.from({ length: 24 }, () => '0123456789abcdef'[Math.floor(cryptoRandom() * 16)]).join('')
}
function cryptoRandom(): number {
  // eslint-disable-next-line no-undef
  return Math.random() // snapshot id only; no security role
}

export function sha256Json(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

/** P6-05: export payload (interim or official) + audit the export itself. */
export async function exportResults(opts: { actorId: string; electionId: string; official: boolean }) {
  const pool = getPool()
  let payload: unknown
  if (opts.official) {
    const { rows } = await pool.query<{ totals: unknown; checksum: string; version: number; published_at: Date | null }>(
      'SELECT totals AS payload, checksum, version, published_at FROM result_snapshots WHERE election_id = $1 ORDER BY version DESC LIMIT 1',
      [opts.electionId],
    )
    if (!rows[0]) apiError('NOT_FOUND', 'Belum ada snapshot resmi.')
    payload = { ...rows[0], kind: 'OFFICIAL', exportedAt: new Date().toISOString() }
  } else {
    const results = await aggregateElection(opts.electionId)
    payload = { kind: 'QUICK_COUNT', results, exportedAt: new Date().toISOString() }
  }
  await recordAuditEvent(pool, {
    actorId: opts.actorId,
    electionId: opts.electionId,
    action: 'ADMIN_RESULTS_EXPORT',
    target: opts.electionId,
    changes: { official: opts.official },
  })
  return payload
}

/** P6-06: quick count aggregate — blocked before OPEN and after CLOSED
 * until PUBLISHED replaces it with the official snapshot. */
export async function quickCountPayload(electionId: string) {
  const pool = getPool()
  const { rows } = await pool.query<{ status: string }>(
    'SELECT status FROM elections WHERE id = $1', [electionId],
  )
  const status = rows[0]?.status
  if (!status) apiError('NOT_FOUND', 'Periode tidak ditemukan.')
  if (status === 'PUBLISHED') {
    // once published, serve the official snapshot instead
    const { rows: snap } = await pool.query<{ totals: unknown }>(
      'SELECT totals FROM result_snapshots WHERE election_id = $1 ORDER BY version DESC LIMIT 1',
      [electionId],
    )
    return { source: 'OFFICIAL', snapshot: snap[0] ?? null }
  }
  if (status !== 'OPEN' && status !== 'PAUSED' && status !== 'CLOSED') {
    apiError('STATE_INVALID', 'Hasil sementara belum tersedia.')
  }
  const results = await aggregateElection(electionId)
  return { source: 'QUICK_COUNT', results, updatedAt: new Date().toISOString() }
}
