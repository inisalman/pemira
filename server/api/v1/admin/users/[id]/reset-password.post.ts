import { z } from 'zod'
import { requireAdmin, requireCsrf } from '#server/utils/session'
import { parseBody, sendApiError } from '#server/utils/errors'
import { resetUserPassword } from '#server/services/identity/password-admin'

const bodySchema = z.object({
  newPassword: z.string().min(12).max(256).optional(),
  reason: z.string().min(3).max(500),
})

/** POST /api/v1/admin/users/:id/reset-password — officer password reset (P2-04). */
export default defineEventHandler(async (event) => {
  try {
    const admin = await requireAdmin(event)
    requireCsrf(event)
    const targetId = getRouterParam(event, 'id')
    if (!targetId) apiError('VALIDATION_ERROR', 'ID akun wajib ada.')
    const body = await parseBody(event, bodySchema)
    const result = await resetUserPassword({
      actorId: admin.userId,
      targetUserId: targetId,
      newPassword: body.newPassword,
      reason: body.reason,
    })
    // Generated password returned once in this response; never stored or logged.
    return { status: 'OK', generatedPassword: result.generatedPassword }
  } catch (err) {
    return sendApiError(event, err)
  }
})
