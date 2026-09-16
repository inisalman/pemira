import { requireSession } from '#server/utils/session'
import { apiError, sendApiError } from '#server/utils/errors'
import { voterElections, voterContests } from '#server/services/voting/dashboard'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireSession(event)
    if (user.loginKind === 'ADMIN' || !user.voterId) apiError('FORBIDDEN', 'Akses khusus pemilih.')
    setResponseHeader(event, 'cache-control', 'no-store')
    const elections = await voterElections(user.voterId)
    return { elections: await Promise.all(elections.map(async (election) => ({
      ...election, contests: await voterContests(user.voterId!, election.id),
    }))) }
  } catch (error) { return sendApiError(event, error) }
})
