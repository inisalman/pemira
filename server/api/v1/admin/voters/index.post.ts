import { H3Event } from 'h3'
import { requireAdmin, requireCsrf } from '#server/utils/session'
import { parseBody, sendApiError } from '#server/utils/errors'
import { voterUpsertSchema, upsertVoter } from '#server/services/identity/voters'

/** POST /api/v1/admin/voters — create/update a single voter (P4-01). */
export default defineEventHandler(async (event: H3Event) => {
  try {
    const admin = await requireAdmin(event)
    requireCsrf(event)
    const input = await parseBody(event, voterUpsertSchema)
    const result = await upsertVoter({ actorId: admin.userId, input })
    return { ...result, status: 'OK' }
  } catch (err) {
    return sendApiError(event, err)
  }
})
