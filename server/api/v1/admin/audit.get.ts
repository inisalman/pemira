import type { H3Event } from 'h3'
import { z } from 'zod'
import { requireAdmin } from '#server/utils/session'
import { sendApiError } from '#server/utils/errors'
import { getPool } from '~~/database/db'
const querySchema = z.object({ electionId: z.string().optional(), page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(50) })
export default defineEventHandler(async (event: H3Event) => { try { await requireAdmin(event); const q = querySchema.parse(getQuery(event)); const params: unknown[] = []; const where: string[] = []; if (q.electionId) { params.push(q.electionId); where.push(`election_id = $${params.length}`) } const offset = (q.page - 1) * q.pageSize; params.push(q.pageSize, offset); const { rows } = await getPool().query(`SELECT id, actor_id AS "actorId", election_id AS "electionId", action, target, occurred_at AS "occurredAt", redacted_changes AS "changes", count(*) OVER()::int AS total FROM audit_events ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY occurred_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params); return { items: rows.map(({ total, ...row }) => row), total: rows[0]?.total ?? 0, page: q.page, pageSize: q.pageSize } } catch (err) { return sendApiError(event, err) } })
