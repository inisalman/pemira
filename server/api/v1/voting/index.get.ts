import type { H3Event } from 'h3'
import { z } from 'zod'
import { requireSession } from '#server/utils/session'
import { sendApiError, apiError } from '#server/utils/errors'
import { myParticipations } from '#server/services/voting/ballots'
import { getPool } from '#server/../database/db'

const querySchema = z.object({ electionId: z.string().min(1).max(64) })

/** GET /api/v1/voting?electionId=… — voter's own per-contest dashboard (P5-01). */
export default defineEventHandler(async (event: H3Event) => {
  try {
    const session = await requireSession(event)
    const q = querySchema.parse(getQuery(event))
    let voterId: string | undefined = undefined
    if (session.loginKind === 'STUDENT' || session.loginKind === 'LECTURER') {
      voterId = session.voterId ?? undefined
    }
    if (!voterId) apiError('FORBIDDEN', 'Dashboard hanya untuk pemilih.')
    const parts = await myParticipations(voterId, q.electionId)
    const pool = getPool()
    const { rows: elections } = await pool.query<{ status: string; starts_at: Date | null; ends_at: Date | null }>(
      'SELECT status, starts_at, ends_at FROM elections WHERE id = $1', [q.electionId],
    )
    return { election: elections[0] ?? null, contests: parts }
  } catch (err) {
    return sendApiError(event, err)
  }
})
