import type { H3Event } from 'h3'
import { requireAdmin } from '#server/utils/session'
import { sendApiError } from '#server/utils/errors'
import { rightsDashboard } from '#server/services/elections/rights'
import { apiError } from '#server/utils/errors'

/** GET /api/v1/admin/elections/:id/rights — per-contest rights dashboard (P4-06). */
export default defineEventHandler(async (event: H3Event) => {
  try {
    await requireAdmin(event)
    const electionId = getRouterParam(event, 'id')
    if (!electionId) apiError('VALIDATION_ERROR', 'ID periode wajib ada.')
    return await rightsDashboard(electionId)
  } catch (err) {
    return sendApiError(event, err)
  }
})
