import type { H3Event } from 'h3'
import { requireSession, requireCsrf } from '#server/utils/session'
import { parseBody, sendApiError, apiError } from '#server/utils/errors'
import { voteRequestSchema, castVote } from '#server/services/voting/ballots'

/** POST /api/v1/voting/ballots — record a vote for one contest (P5-02..P5-05).
 * Response includes an identity-free receipt; the API never returns which
 * option was recorded (privacy invariant, P5-07). */
export default defineEventHandler(async (event: H3Event) => {
  try {
    const session = await requireSession(event)
    requireCsrf(event)
    if (session.loginKind === 'ADMIN') {
      apiError('FORBIDDEN', 'Panitia tidak memilih.')
    }
    if (!session.voterId) {
      apiError('FORBIDDEN', 'Akun tidak terhubung dengan pemilih.')
    }
    const body = await parseBody(event, voteRequestSchema)
    const receipt = await castVote({
      voterId: session.voterId,
      contestId: body.contestId,
      optionId: body.optionId,
    })
    return { ...receipt, status: 'COMMITTED' } // "COMMITTED" only after server commit
  } catch (err) {
    return sendApiError(event, err)
  }
})
