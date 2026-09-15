import { requireAdmin, requireCsrf } from '#server/utils/session'
import { sendApiError } from '#server/utils/errors'
import { approveAction } from '#server/services/elections/approvals'

/** POST /api/v1/admin/actions/:id/approve — approve with a DIFFERENT account (P3-06, D-10). */
export default defineEventHandler(async (event) => {
  try {
    const approver = await requireAdmin(event)
    requireCsrf(event)
    const id = getRouterParam(event, 'id')
    if (!id) apiError('VALIDATION_ERROR', 'ID aksi wajib ada.')
    const result = await approveAction({ approverId: approver.userId, actionId: id })
    return { ...result, status: 'OK' }
  } catch (err) {
    return sendApiError(event, err)
  }
})
