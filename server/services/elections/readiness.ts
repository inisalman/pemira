import { apiError } from '../../utils/errors'
import { getPool } from '../../../database/db'
import { recordAuditEvent } from '../audit/audit'
import { lockElection, requireTransition } from './state'

/**
 * Readiness validation and config freeze (TASKLIST P3-05):
 * READY requires: 10 contests, all with ≥ 1 option, complete candidate data
 * (members, motto, vision, mission), valid schedule.
 * Revisi (READY → DRAFT) membatalkan persetujuan.
 */

export async function checkReadiness(electionId: string): Promise<{ ready: boolean; problems: string[] }> {
  const pool = getPool()
  const problems: string[] = []

  const { rows: electionRows } = await pool.query<{ status: string; starts_at: Date | null; ends_at: Date | null }>(
    'SELECT status, starts_at, ends_at FROM elections WHERE id = $1', [electionId],
  )
  const election = electionRows[0]
  if (!election) apiError('NOT_FOUND', 'Periode tidak ditemukan.')

  const { rows: contestRows } = await pool.query<{ id: string; code: string }>(
    'SELECT id, code FROM contests WHERE election_id = $1', [electionId],
  )
  if (contestRows.length !== 10) {
    problems.push(`Kontes berjumlah ${contestRows.length}, harus 10.`)
  }

  for (const contest of contestRows) {
    const { rows: opts } = await pool.query<{ option_count: string; complete: string }>(
      `SELECT count(DISTINCT o.id)::text AS option_count,
              count(*) FILTER (WHERE o.motto IS NOT NULL AND o.vision IS NOT NULL AND o.mission IS NOT NULL
                               AND (SELECT count(*) FROM candidate_members m WHERE m.option_id = o.id) >= 1
                               AND o.photo_key IS NOT NULL)::text AS complete
       FROM candidate_options o WHERE o.contest_id = $1 AND o.active = TRUE`,
      [contest.id],
    )
    if (Number(opts[0]?.option_count ?? 0) === 0) {
      problems.push(`Kontes ${contest.code} belum memiliki calon.`)
    } else if (opts[0] && opts[0].complete !== opts[0].option_count) {
      problems.push(`Kontes ${contest.code}: ada calon dengan data belum lengkap (foto/moto/visi/misi).`)
    }
  }

  if (!election.starts_at || !election.ends_at) {
    problems.push('Jadwal mulai dan selesai belum ditetapkan.')
  } else if (election.ends_at <= election.starts_at) {
    problems.push('Jadwal selesai harus setelah mulai.')
  }

  if (election.status !== 'DRAFT' && election.status !== 'READY') {
    problems.push('Pemeriksaan kesiapan hanya untuk DRAFT/READY.')
  }

  return { ready: problems.length === 0, problems }
}

export async function setReady(opts: { actorId: string; electionId: string }) {
  const pool = getPool()
  const { ready, problems } = await checkReadiness(opts.electionId)
  if (!ready) {
    apiError('STATE_INVALID', `Kesiapan belum terpenuhi: ${problems.join(' ')}`)
  }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const current = await lockElection(client, opts.electionId)
    requireTransition(current.status, 'READY')
    await client.query("UPDATE elections SET status = 'READY' WHERE id = $1", [opts.electionId])
    await recordAuditEvent(client, {
      actorId: opts.actorId,
      electionId: opts.electionId,
      action: 'ADMIN_ELECTION_READY',
      target: opts.electionId,
    })
    await client.query('COMMIT')
    return { status: 'READY' }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function reviseToDraft(opts: { actorId: string; electionId: string; reason: string }) {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const current = await lockElection(client, opts.electionId)
    requireTransition(current.status, 'DRAFT')
    await client.query("UPDATE elections SET status = 'DRAFT' WHERE id = $1", [opts.electionId])
    await recordAuditEvent(client, {
      actorId: opts.actorId,
      electionId: opts.electionId,
      action: 'ADMIN_ELECTION_REVISE',
      target: opts.electionId,
      changes: { reason: opts.reason },
    })
    await client.query('COMMIT')
    return { status: 'DRAFT' }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
