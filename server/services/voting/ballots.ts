import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { apiError } from '../../utils/errors'
import { getPool } from '../../../database/db'
import { recordAuditEvent } from '../audit/audit'

/**
 * Voting transaction per SDD section 7 (TASKLIST P5-03..P5-05, T-19).
 * Everything runs on ONE pooled connection inside one transaction:
 *   1. lock election row (serializes against PAUSE/CLOSE/state flips)
 *   2. lock the voting right row (serializes double voting per contest)
 *   3. verify: election OPEN, database clock inside [starts_at, ends_at],
 *      right belongs to voter + contest, option belongs to same contest
 *   4. INSERT ballot (identity-free) + participation (receipt) atomically
 *   5. COMMIT — only then is the vote "tercatat"; any error before commit
 *      rolls the whole thing back (idempotency: participation PK on right)
 * Ballots carry no voter/right/time columns by design — privacy invariant.
 */

export const voteRequestSchema = z.object({
  contestId: z.string().min(1).max(64),
  optionId: z.string().min(1).max(64),
})

export type VoteReceipt = {
  receiptCode: string
  contestId: string
  committedAt: string
}

function receiptCode(): string {
  // Opaque, unguessable, no identity content (random 96-bit hex).
  return randomUUID().replace(/-/g, '')
}

export async function castVote(opts: {
  voterId: string
  contestId: string
  optionId: string
}): Promise<VoteReceipt> {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Serialize state changes: lock the election the contest belongs to.
    const { rows: electionRows } = await client.query<{
      id: string
      status: string
      starts_at: Date | null
      ends_at: Date | null
    }>(
      `SELECT e.id, e.status, e.starts_at, e.ends_at
       FROM contests c JOIN elections e ON e.id = c.election_id
       WHERE c.id = $1 FOR UPDATE OF e`, [opts.contestId],
    )
    const election = electionRows[0]
    if (!election) apiError('NOT_FOUND', 'Kontes tidak ditemukan.')
    if (election.status !== 'OPEN') {
      apiError('STATE_INVALID', 'Pemilihan tidak sedang dibuka (belum mulai, jeda, atau sudah ditutup).')
    }
    // 2. Database clock, not client time (SDD T-04).
    const { rows: clock } = await client.query<{ now: Date }>('SELECT clock_timestamp() AS now')
    const now = clock[0]?.now
    if (now) {
      if (election.starts_at && now < election.starts_at) {
        apiError('STATE_INVALID', 'Pemilihan belum dimulai.')
      }
      if (election.ends_at && now > election.ends_at) {
        apiError('STATE_INVALID', 'Pemilihan sudah berakhir.')
      }
    }

    // 3. Lock THIS voter's right row for the contest.
    const { rows: rightRows } = await client.query<{ right_id: string }>(
      `SELECT vr.id AS right_id
       FROM voting_rights vr
       JOIN voter_roll_entries r ON r.id = vr.roll_entry_id
       WHERE r.voter_id = $1 AND vr.contest_id = $2
       FOR UPDATE OF vr`, [opts.voterId, opts.contestId],
    )
    const rightId = rightRows[0]?.right_id
    if (!rightId) apiError('FORBIDDEN', 'Tidak memiliki hak pilih untuk kontes ini.')

    // 4. Eligibility + idempotency check inside the lock.
    const { rows: existing } = await client.query<{ voting_right_id: string }>(
      'SELECT voting_right_id FROM participations WHERE voting_right_id = $1', [rightId],
    )
    if (existing[0]) {
      apiError('CONFLICT', 'Anda sudah memberikan suara untuk kontes ini.')
    }

    // 5. Option must belong to the same contest (composite FK also guards).
    const { rows: optionRows } = await client.query<{ id: string; active: boolean }>(
      'SELECT id, active FROM candidate_options WHERE id = $1 AND contest_id = $2',
      [opts.optionId, opts.contestId],
    )
    if (!optionRows[0] || !optionRows[0].active) {
      apiError('OPTION_INVALID', 'Opsi calon tidak valid untuk kontes ini.')
    }

    // 6. Insert ballot (no identity) + participation (receipt, right-bound).
    const receipt = receiptCode()
    await client.query(
      'INSERT INTO ballots (id, contest_id, option_id) VALUES ($1, $2, $3)',
      [randomUUID(), opts.contestId, opts.optionId],
    )
    await client.query(
      `INSERT INTO participations (voting_right_id, contest_id, receipt_code)
       VALUES ($1, $2, $3)`, [rightId, opts.contestId, receipt],
    )

    await recordAuditEvent(client, {
      action: 'VOTE_CAST',
      target: receipt,
      changes: { contestId: opts.contestId }, // never option id (privacy)
    })
    await client.query('COMMIT') // durable; only now is it "tercatat"

    return { receiptCode: receipt, contestId: opts.contestId, committedAt: new Date().toISOString() }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

/** Verify a receipt exists without revealing any choice (P5-04/P5-05). */
export async function verifyReceipt(voterId: string, code: string) {
  const pool = getPool()
  const { rows } = await pool.query<{ contest_id: string }>(
    `SELECT p.contest_id
     FROM participations p
     JOIN voting_rights vr ON vr.id = p.voting_right_id
     JOIN voter_roll_entries r ON r.id = vr.roll_entry_id
     WHERE p.receipt_code = $1 AND r.voter_id = $2`, [code, voterId],
  )
  if (!rows[0]) apiError('NOT_FOUND', 'Tanda terima tidak ditemukan.')
  return { contestId: rows[0].contest_id, verified: true }
}

/** Per-contest status for a voter's own dashboard (P5-01/P5-04): which of the
 * period's contests the voter has a right for, and which already voted. */
export async function myParticipations(voterId: string, electionId: string) {
  const pool = getPool()
  const { rows } = await pool.query<{ contest_id: string; has_voted: boolean }>(
    `SELECT vr.contest_id,
            (p.voting_right_id IS NOT NULL) AS has_voted
     FROM voting_rights vr
     JOIN voter_roll_entries r ON r.id = vr.roll_entry_id
     JOIN contests c ON c.id = vr.contest_id
     LEFT JOIN participations p ON p.voting_right_id = vr.id
     WHERE r.voter_id = $1 AND c.election_id = $2
     ORDER BY c.code`,
    [voterId, electionId],
  )
  return rows
}
