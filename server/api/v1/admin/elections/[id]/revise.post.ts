import { z } from 'zod'
import { requireAdmin, requireCsrf } from '#server/utils/session'
import { parseBody, sendApiError } from '#server/utils/errors'
import { reviseToDraft } from '#server/services/elections/readiness'

const bodySchema = z.object({ reason: z.string().min(3).max(500) })

/** POST /api/v1/admin/elections/:id/revise — READY back to DRAFT, cancels approvals (P3-05). */
export default defineEventHandler(async (event) => {
  try {
    const admin = await requireAdmin(event)
    requireCsrf(event)
    const id = getRouterParam(event, 'id')
    if (!id) apiError('VALIDATION_ERROR', 'ID periode wajib ada.')
    const body = await parseBody(event, bodySchema)
    const result = await reviseToDraft({ actorId: admin.userId, electionId: id, reason: body.reason })
    return result
  } catch (err) {
    return sendApiError(event, err)
  }
})
