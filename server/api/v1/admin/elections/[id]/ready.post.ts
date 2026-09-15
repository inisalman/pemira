import { requireAdmin, requireCsrf } from '#server/utils/session'
import { sendApiError } from '#server/utils/errors'
import { setReady } from '#server/services/elections/readiness'

/** POST /api/v1/admin/elections/:id/ready — validate + freeze config (P3-05). */
export default defineEventHandler(async (event) => {
  try {
    const admin = await requireAdmin(event)
    requireCsrf(event)
    const id = getRouterParam(event, 'id')
    if (!id) apiError('VALIDATION_ERROR', 'ID periode wajib ada.')
    const result = await setReady({ actorId: admin.userId, electionId: id })
    return result
  } catch (err) {
    return sendApiError(event, err)
  }
})
