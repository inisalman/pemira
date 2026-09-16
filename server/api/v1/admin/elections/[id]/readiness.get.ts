import type { H3Event } from 'h3'
import { requireAdmin } from '#server/utils/session'
import { sendApiError } from '#server/utils/errors'
import { checkReadiness } from '#server/services/elections/readiness'

export default defineEventHandler(async (event: H3Event) => {
  try {
    await requireAdmin(event)
    const electionId = getRouterParam(event, 'id')
    if (!electionId) throw new Error('ID periode wajib ada.')
    return await checkReadiness(electionId)
  } catch (err) { return sendApiError(event, err) }
})
