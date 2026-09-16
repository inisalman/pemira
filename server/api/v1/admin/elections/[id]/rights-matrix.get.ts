import type { H3Event } from 'h3'
import { z } from 'zod'
import { requireAdmin } from '#server/utils/session'
import { apiError, sendApiError } from '#server/utils/errors'
import { getPool } from '~~/database/db'

const querySchema = z.object({ search: z.string().max(120).optional(), voterType: z.enum(['STUDENT', 'LECTURER']).optional(), departmentCode: z.string().max(32).optional(), page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(50) })

export default defineEventHandler(async (event: H3Event) => {
  try {
    await requireAdmin(event)
    const electionId = getRouterParam(event, 'id')
    if (!electionId) throw new Error('ID periode wajib ada.')
    const q = querySchema.parse(getQuery(event)); const pool = getPool()
    const { rows: elections } = await pool.query('SELECT config_version AS "configVersion" FROM elections WHERE id = $1', [electionId])
    if (!elections[0]) apiError('NOT_FOUND', 'Periode tidak ditemukan.')
    const params: unknown[] = [electionId]; const where = ['r.election_id = $1']
    if (q.search) { params.push(`%${q.search}%`); where.push(`(v.name ILIKE $${params.length} OR v.identifier_value LIKE $${params.length})`) }
    if (q.voterType) { params.push(q.voterType); where.push(`v.voter_type = $${params.length}`) }
    if (q.departmentCode) { params.push(q.departmentCode); where.push(`d.code = $${params.length}`) }
    const offset = (q.page - 1) * q.pageSize; params.push(q.pageSize, offset)
    const voters = await pool.query(`SELECT v.id, v.name, v.identifier_value AS "identifierValue", v.voter_type AS "voterType", d.code AS "departmentCode", count(*) OVER()::text AS total FROM voter_roll_entries r JOIN voters v ON v.id = r.voter_id LEFT JOIN departments d ON d.id = v.department_id WHERE ${where.join(' AND ')} ORDER BY v.name, v.identifier_value LIMIT $${params.length - 1} OFFSET $${params.length}` , params)
    const contests = await pool.query(`SELECT c.id, c.code, c.title FROM contests c WHERE c.election_id = $1 ORDER BY c.code`, [electionId])
    const voterIds = voters.rows.map(row => row.id)
    const rights = voterIds.length ? await pool.query(`SELECT r.voter_id AS "voterId", vr.contest_id AS "contestId" FROM voter_roll_entries r JOIN voting_rights vr ON vr.roll_entry_id = r.id WHERE r.election_id = $1 AND r.voter_id = ANY($2::text[])`, [electionId, voterIds]) : { rows: [] }
    const rightSet = new Set(rights.rows.map(row => `${row.voterId}:${row.contestId}`))
    return { configVersion: elections[0].configVersion, contests: contests.rows, voters: voters.rows.map(({ total, ...voter }) => ({ ...voter, rights: contests.rows.filter(contest => rightSet.has(`${voter.id}:${contest.id}`)).map(contest => contest.id) })), total: Number(voters.rows[0]?.total ?? 0), page: q.page, pageSize: q.pageSize }
  } catch (err) { return sendApiError(event, err) }
})
