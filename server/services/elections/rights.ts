import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { apiError } from '../../utils/errors'
import { getPool } from '../../../database/db'
import { recordAuditEvent } from '../audit/audit'

/**
 * Voting rights per SDD sections 3/5 (TASKLIST P4-06/P4-07/P4-08).
 * Default rights: four per student voters matching their department scope —
 * BEM pair, MPM pair, chair Hima, vice chair Hima. Grants/revokes are
 * targeted (never retargetable), audited with a reason, and rejected when
 * the election config_version changed since the admin loaded the page
 * (VERSION_STALE per T-08). All rights ops are DRAFT/READY-only: after OPEN
 * the DPT is frozen (P4-08), members must go through the revise flow instead.
 */

export const rightsChangeSchema = z.object({
  electionId: z.string().min(1),
  expectConfigVersion: z.number().int().min(1),
  changes: z.array(z.object({
    voterId: z.string().min(1),
    contestId: z.string().min(1),
    grant: z.boolean(),
  })).min(1).max(5_000),
  reason: z.string().min(3).max(500),
})

export type RightsChange = z.infer<typeof rightsChangeSchema>

const OPENER_STATUSES = ['DRAFT', 'READY'] as const

/** Build the four default rights per voter from their department's contests. */
export async function buildDefaultRights(opts: { actorId: string; electionId: string }) {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows: elections } = await client.query<{ status: string }>(
      'SELECT status FROM elections WHERE id = $1 FOR UPDATE', [opts.electionId],
    )
    const election = elections[0]
    if (!election) apiError('NOT_FOUND', 'Periode tidak ditemukan.')
    if (!OPENER_STATUSES.includes(election.status as typeof OPENER_STATUSES[number])) {
      apiError('STATE_INVALID', 'Hak dasar hanya dibentuk saat DRAFT/READY.')
    }

    // Roll: every active voter of a mapped department; lecturers vote only
    // in university-wide contests (BEM/MPM pairs).
    const { rowCount: rollCount } = await client.query(
      `INSERT INTO voter_roll_entries (id, election_id, voter_id, voter_type_snapshot, department_id_snapshot)
       SELECT $1 || v.id, $1, v.id, v.voter_type, v.department_id
       FROM voters v
       WHERE v.active_status = TRUE AND v.department_id IS NOT NULL
       ON CONFLICT (election_id, voter_id) DO NOTHING`,
      [opts.electionId],
    )

    // Defaults: PAIR BEM + PAIR MPM (scope NULL = university) for everyone;
    // chair and vice-chair SINGLE contests scoped to the voter's department.
    const { rowCount: rightsCount } = await client.query(
      `INSERT INTO voting_rights (id, roll_entry_id, contest_id, election_id, source)
       SELECT r.id || ':' || c.id, r.id, c.id, $1,
             'DEFAULT'
       FROM voter_roll_entries r
       JOIN voters v ON v.id = r.voter_id
       JOIN contests c ON c.election_id = r.election_id
          AND (c.scope_department_id IS NULL OR c.scope_department_id = r.department_id_snapshot)
       WHERE r.election_id = $1 AND v.active_status = TRUE
       ON CONFLICT (roll_entry_id, contest_id) DO NOTHING`,
      [opts.electionId],
    )
    await recordAuditEvent(client, {
      actorId: opts.actorId,
      electionId: opts.electionId,
      action: 'ADMIN_BUILD_DEFAULT_RIGHTS',
      target: opts.electionId,
      changes: { rolled: rollCount ?? 0, rights: rightsCount ?? 0 },
    })
    await client.query('COMMIT')
    return { rolled: rollCount ?? 0, rights: rightsCount ?? 0 }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

/** Compact per-contest rights dashboard for a period (P4-06). */
export async function rightsDashboard(electionId: string) {
  const pool = getPool()
  const { rows } = await pool.query<{ code: string; title: string; office: string; granted: string; rolled: string; refused: string }>(
    `SELECT c.code, c.title || ' (' || c.office || ')' AS title,
            count(vr.id)::text AS granted,
            (SELECT count(*) FROM voter_roll_entries x WHERE x.election_id = c.election_id)::text AS rolled,
            ((SELECT count(*) FROM voter_roll_entries x WHERE x.election_id = c.election_id
                AND x.department_id_snapshot IS NOT DISTINCT FROM c.scope_department_id)
             - count(vr.id))::text AS refused
     FROM contests c
     LEFT JOIN voting_rights vr ON vr.contest_id = c.id
     WHERE c.election_id = $1
     GROUP BY c.id
     ORDER BY c.code`,
    [electionId],
  )
  return rows
}

/**
 * Grant/revoke batch (P4-07): targets fixed per item (contest+voter, never a
 * movable list reason), every change audited with the reason, VERSION_STALE
 * when expectConfigVersion does not match, DRAFT/READY-only.
 */
export async function applyRightsChanges(opts: { actorId: string; input: z.infer<typeof rightsChangeSchema> }) {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows: elections } = await client.query<{ status: string; config_version: number }>(
      'SELECT status, config_version FROM elections WHERE id = $1 FOR UPDATE', [opts.input.electionId],
    )
    const election = elections[0]
    if (!election) apiError('NOT_FOUND', 'Periode tidak ditemukan.')
    if (!OPENER_STATUSES.includes(election.status as typeof OPENER_STATUSES[number])) {
      apiError('STATE_INVALID', 'Hak pilih dapat diubah hanya saat DRAFT/READY (DPT terkunci setelah OPEN).')
    }
    if (election.config_version !== opts.input.expectConfigVersion) {
      apiError('VERSION_STALE', 'Konfigurasi berubah sejak data dimuat; muat ulang sebelum menyimpan.')
    }

    const applied: string[] = []
    for (const ch of opts.input.changes) {
      let res: { rows: { id: string }[] }
      if (ch.grant) {
        // $1 generated id, $2 election, $3 contest, $4 voter
        res = await client.query<{ id: string }>(
          `WITH roll AS (
             SELECT id FROM voter_roll_entries WHERE election_id = $2 AND voter_id = $4
           )
           INSERT INTO voting_rights (id, roll_entry_id, contest_id, election_id, source)
           SELECT $1::text, roll.id, $3::text, $2::text, 'ADMIN' FROM roll
           ON CONFLICT (roll_entry_id, contest_id) DO NOTHING
           RETURNING id`,
          [randomUUID(), opts.input.electionId, ch.contestId, ch.voterId],
        )
      } else {
        // $1 voter, $2 election, $3 contest
        res = await client.query<{ id: string }>(
          `DELETE FROM voting_rights vr USING voter_roll_entries r
           WHERE vr.roll_entry_id = r.id AND r.voter_id = $1 AND vr.contest_id = $3
             AND r.election_id = $2
           RETURNING vr.id`,
          [ch.voterId, opts.input.electionId, ch.contestId],
        )
      }
      if (res.rows[0]) {
        applied.push(ch.voterId + ':' + ch.contestId)
        await recordAuditEvent(client, {
          actorId: opts.actorId,
          electionId: opts.input.electionId,
          action: ch.grant ? 'ADMIN_GRANT_RIGHT' : 'ADMIN_REVOKE_RIGHT',
          target: ch.voterId + '/' + ch.contestId,
          changes: { reason: opts.input.reason },
        })
      }
    }
    await client.query('COMMIT')
    return { applied: applied.length, reverted: opts.input.changes.length - applied.length }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
