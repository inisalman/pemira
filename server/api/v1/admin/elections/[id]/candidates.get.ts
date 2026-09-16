import type { H3Event } from 'h3'
import { requireAdmin } from '#server/utils/session'
import { sendApiError } from '#server/utils/errors'
import { getPool } from '~~/database/db'

/** GET /api/v1/admin/elections/:id/candidates — contests with candidate options. */
export default defineEventHandler(async (event: H3Event) => {
  try {
    await requireAdmin(event)
    const electionId = getRouterParam(event, 'id')
    if (!electionId) throw new Error('ID periode wajib ada.')
    const pool = getPool()
    const { rows: contests } = await pool.query(`
      SELECT c.id, c.code, c.title, c.office, c.option_type AS "optionType",
             d.code AS "departmentCode", d.name AS "departmentName"
      FROM contests c
      LEFT JOIN departments d ON d.id = c.scope_department_id
      WHERE c.election_id = $1 ORDER BY c.code`, [electionId])
    const { rows: options } = await pool.query(`
      SELECT o.id, o.contest_id AS "contestId", o.number, o.photo_key AS "photoKey",
             o.motto, o.vision, o.mission, o.programs,
             COALESCE(json_agg(json_build_object('name', m.name, 'position', m.position)
               ORDER BY m.position) FILTER (WHERE m.id IS NOT NULL), '[]') AS members
      FROM candidate_options o
      LEFT JOIN candidate_members m ON m.option_id = o.id
      WHERE o.contest_id IN (SELECT id FROM contests WHERE election_id = $1)
      GROUP BY o.id ORDER BY o.contest_id, o.number`, [electionId])
    return { contests: contests.map((contest) => ({ ...contest, options: options.filter(option => option.contestId === contest.id) })) }
  } catch (err) {
    return sendApiError(event, err)
  }
})
