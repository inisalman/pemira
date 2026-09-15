import { getPool } from '~~/database/db'
import { requireSession } from '#server/utils/session'
import { sendApiError } from '#server/utils/errors'

/** GET /api/v1/me — minimal profile and roles for the logged-in user. */
export default defineEventHandler(async (event) => {
  try {
    const user = await requireSession(event)
    const { rows } = await getPool().query<{ role: string; election_id: string | null }>(
      'SELECT role, election_id FROM role_assignments WHERE user_id = $1', [user.userId],
    )
    return {
      userId: user.userId,
      loginKind: user.loginKind,
      voterId: user.voterId,
      roles: rows.map((r: { role: string; election_id: string | null }) => ({ role: r.role, electionId: r.election_id })),
    }
  } catch (err) {
    return sendApiError(event, err)
  }
})
