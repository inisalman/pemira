import { requireSession } from '#server/utils/session'
import { apiError, sendApiError } from '#server/utils/errors'
import { voterBallot } from '#server/services/voting/dashboard'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireSession(event)
    if (user.loginKind === 'ADMIN' || !user.voterId) apiError('FORBIDDEN', 'Akses khusus pemilih.')
    const id = getRouterParam(event, 'id')
    if (!id) apiError('VALIDATION_ERROR', 'Kontes wajib dipilih.')
    setResponseHeader(event, 'cache-control', 'no-store')
    return await voterBallot(user.voterId, id)
  } catch (error) { return sendApiError(event, error) }
})
