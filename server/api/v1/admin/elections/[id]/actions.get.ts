import type { H3Event } from 'h3'
import { requireAdmin } from '#server/utils/session'
import { apiError, sendApiError } from '#server/utils/errors'
import { getPool } from '~~/database/db'

export default defineEventHandler(async (event: H3Event) => {
  try {
    await requireAdmin(event)
    const electionId = getRouterParam(event, 'id')
    if (!electionId) apiError('VALIDATION_ERROR', 'ID periode wajib ada.')
    const { rows } = await getPool().query(`SELECT id, type, status, proposer_id AS "proposerId", approver_id AS "approverId", created_at AS "createdAt", decided_at AS "decidedAt" FROM admin_actions WHERE election_id = $1 ORDER BY created_at DESC LIMIT 20`, [electionId])
    return { actions: rows }
  } catch (err) { return sendApiError(event, err) }
})
