import type { H3Event } from 'h3'
import { requireAdmin } from '#server/utils/session'
import { apiError, sendApiError } from '#server/utils/errors'
import { aggregateElection, reconcileElection } from '#server/services/results/results'
import { getPool } from '~~/database/db'

export default defineEventHandler(async (event: H3Event) => {
  try {
    await requireAdmin(event)
    const electionId = getRouterParam(event, 'id')
    if (!electionId) apiError('VALIDATION_ERROR', 'ID periode wajib ada.')
    const pool = getPool(); const { rows } = await pool.query<{ status: string }>('SELECT status FROM elections WHERE id = $1', [electionId])
    if (!rows[0]) apiError('NOT_FOUND', 'Periode tidak ditemukan.')
    const results = await aggregateElection(electionId); const { anomalies } = await reconcileElection(electionId)
    const totals = await pool.query(`SELECT (SELECT count(*) FROM voter_roll_entries WHERE election_id = $1)::int AS eligible, (SELECT count(DISTINCT voting_right_id) FROM participations WHERE contest_id IN (SELECT id FROM contests WHERE election_id = $1))::int AS participating, (SELECT count(*) FROM ballots WHERE contest_id IN (SELECT id FROM contests WHERE election_id = $1))::int AS ballots`, [electionId])
    return { status: rows[0].status, results, totals: totals.rows[0], anomalies }
  } catch (err) { return sendApiError(event, err) }
})
