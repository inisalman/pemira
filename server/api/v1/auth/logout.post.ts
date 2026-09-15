import { destroySession, requireSession, requireCsrf } from '#server/utils/session'
import { sendApiError } from '#server/utils/errors'

/** POST /api/v1/auth/logout — revoke the current session (CSRF-protected). */
export default defineEventHandler(async (event) => {
  try {
    await requireSession(event)
    requireCsrf(event)
    await destroySession(event)
    return { status: 'OK' }
  } catch (err) {
    return sendApiError(event, err)
  }
})
