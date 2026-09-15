import type { H3Event } from 'h3'
import { z } from 'zod'
import { requireSession } from '#server/utils/session'
import { sendApiError, apiError } from '#server/utils/errors'
import { verifyReceipt } from '#server/services/voting/ballots'

const querySchema = z.object({ receiptCode: z.string().min(8).max(64) })

/** GET /api/v1/voting/status?receiptCode=… — re-check commit state after
 * disconnect/refresh/retry (P5-04/P5-05). Searchable only by the owner. */
export default defineEventHandler(async (event: H3Event) => {
  try {
    const session = await requireSession(event)
    const q = querySchema.parse(getQuery(event))
    if (session.loginKind === 'ADMIN' || !session.voterId) {
      apiError('FORBIDDEN', 'Pemeriksaan tanda terima hanya untuk pemilih.')
    }
    const result = await verifyReceipt(session.voterId, q.receiptCode)
    return result
  } catch (err) {
    return sendApiError(event, err)
  }
})
