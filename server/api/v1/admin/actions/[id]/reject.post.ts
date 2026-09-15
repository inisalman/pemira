import { requireAdmin, requireCsrf } from '#server/utils/session'
import { sendApiError } from '#server/utils/errors'
import { rejectAction } from '#server/services/elections/approvals'

/** POST /api/v1/admin/actions/:id/reject — reject a pending action. */
export default defineEventHandler(async (event) => {
  try {
    const approver = await requireAdmin(event)
    requireCsrf(event)
    const id = getRouterParam(event, 'id')
    if (!id) apiError('VALIDATION_ERROR', 'ID aksi wajib ada.')
    const result = await rejectAction({ approverId: approver.userId, actionId: id })
    return { ...result, status: 'OK' }
  } catch (err) {
    return sendApiError(event, err)
  }
})
