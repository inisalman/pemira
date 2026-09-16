import { getPool } from '../../../database/db'
import { apiError } from '../../utils/errors'
import type { VoterElection, VoterContest, VoterBallot, CandidateOption } from '../../../shared/types/voter'

export async function voterElections(voterId: string): Promise<VoterElection[]> {
  const { rows } = await getPool().query<VoterElection>(
    `SELECT e.id, e.name, e.status, e.starts_at AS "startsAt", e.ends_at AS "endsAt"
     FROM elections e JOIN voter_roll_entries r ON r.election_id = e.id
     WHERE r.voter_id = $1 AND e.status NOT IN ('DRAFT', 'ARCHIVED')
     ORDER BY e.created_at DESC, e.id`, [voterId],
  )
  return rows
}

export async function voterContests(voterId: string, electionId: string): Promise<VoterContest[]> {
  const { rows } = await getPool().query<VoterContest>(
    `SELECT c.id, c.title, p.voting_right_id IS NOT NULL AS "hasVoted", p.receipt_code AS "receiptCode"
     FROM voting_rights vr JOIN voter_roll_entries r ON r.id = vr.roll_entry_id
     JOIN contests c ON c.id = vr.contest_id
     JOIN elections e ON e.id = c.election_id
     LEFT JOIN participations p ON p.voting_right_id = vr.id
     WHERE r.voter_id = $1 AND e.id = $2 AND e.status NOT IN ('DRAFT', 'ARCHIVED')
     ORDER BY c.code`, [voterId, electionId],
  )
  return rows
}

export async function voterBallot(voterId: string, contestId: string): Promise<VoterBallot> {
  const { rows } = await getPool().query<Omit<VoterBallot, 'options'>>(
    `SELECT json_build_object('id', e.id, 'name', e.name, 'status', e.status,
       'startsAt', e.starts_at, 'endsAt', e.ends_at) AS election,
       json_build_object('id', c.id, 'title', c.title, 'hasVoted', p.voting_right_id IS NOT NULL,
       'receiptCode', p.receipt_code) AS contest,
       (e.status = 'OPEN' AND p.voting_right_id IS NULL
         AND (e.starts_at IS NULL OR clock_timestamp() >= e.starts_at)
         AND (e.ends_at IS NULL OR clock_timestamp() <= e.ends_at)) AS "canVote"
     FROM contests c JOIN elections e ON e.id = c.election_id
     JOIN voting_rights vr ON vr.contest_id = c.id
     JOIN voter_roll_entries r ON r.id = vr.roll_entry_id
     LEFT JOIN participations p ON p.voting_right_id = vr.id
     WHERE c.id = $1 AND r.voter_id = $2 AND e.status NOT IN ('DRAFT', 'ARCHIVED')`,
    [contestId, voterId],
  )
  const ballot = rows[0]
  if (!ballot) apiError('FORBIDDEN', 'Surat suara tidak tersedia untuk akun ini.')
  const { rows: options } = await getPool().query<CandidateOption>(
    `SELECT o.id, o.number, o.motto, o.vision, o.mission, o.programs,
       COALESCE((SELECT json_agg(json_build_object('name', m.name, 'position', m.position)
         ORDER BY m.position) FROM candidate_members m WHERE m.option_id = o.id), '[]') AS members
     FROM candidate_options o WHERE o.contest_id = $1 AND o.active = TRUE ORDER BY o.number`, [contestId],
  )
  return { ...ballot, options }
}
