import { z } from 'zod'
import { requireAdmin, requireCsrf } from '#server/utils/session'
import { parseBody, sendApiError } from '#server/utils/errors'
import { proposeAction, emergencyPause, type ActionKind } from '#server/services/elections/approvals'

const bodySchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.enum(['OPEN', 'RECOVER', 'CLOSE_EARLY', 'PUBLISH', 'ARCHIVE']) }),
  z.object({ kind: z.literal('PAUSE'), reason: z.string().min(3).max(500) }),
])

/** POST /api/v1/admin/elections/:id/actions — propose/pause actions (P3-06). */
export default defineEventHandler(async (event) => {
  try {
    const admin = await requireAdmin(event)
    requireCsrf(event)
    const electionId = getRouterParam(event, 'id')
    if (!electionId) apiError('VALIDATION_ERROR', 'ID periode wajib ada.')
    const body = await parseBody(event, bodySchema)

    if (body.kind === 'PAUSE') {
      const result = await emergencyPause({ actorId: admin.userId, electionId, reason: body.reason })
      return { ...result, status: 'OK' }
    }
    const result = await proposeAction({
      actorId: admin.userId,
      electionId,
      kind: body.kind as ActionKind,
    })
    return { ...result, status: 'OK' }
  } catch (err) {
    return sendApiError(event, err)
  }
})
