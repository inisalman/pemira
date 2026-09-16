import { requireSession } from '#server/utils/session'
import { getPool } from '~~/database/db'
import { verifyPassword } from '#server/utils/password'
import { createSession } from '#server/utils/session'
import { checkLoginRateLimit, recordLoginAttempt, clientIp } from '#server/utils/rate-limit'
import { parseBody, sendApiError, apiError } from '#server/utils/errors'
import { voterLoginSchema } from '#server/utils/schemas'

/** POST /api/v1/auth/login-voter. One login door for STUDENT and LECTURER. */
export default defineEventHandler(async (event) => {
  try {
    const body = await parseBody(event, voterLoginSchema)
    const ip = clientIp(event)
    await checkLoginRateLimit('VOTER', body.identifier, ip)
    const { rows } = await getPool().query<{
      id: string; login_kind: 'STUDENT' | 'LECTURER'; password_hash: string; active: boolean
      voter_id: string | null; credential_version: number
    }>(
      `SELECT id, login_kind, password_hash, active, voter_id, credential_version
       FROM users WHERE login_kind IN ('STUDENT', 'LECTURER') AND login_identifier = $1`,
      [body.identifier],
    )
    const user = rows[0]
    const ok = user ? await verifyPassword(user.password_hash, body.password) : false
    if (!ok || !user || !user.active || !user.voter_id) {
      await recordLoginAttempt('VOTER', body.identifier, ip, false)
      apiError('UNAUTHORIZED', 'Nomor identitas atau password salah.')
    }
    await recordLoginAttempt(user.login_kind, body.identifier, ip, true)
    await createSession(event, {
      userId: user.id,
      loginKind: user.login_kind,
      loginIdentifier: body.identifier,
      voterId: user.voter_id,
      credentialVersion: user.credential_version,
    })
    return { status: 'OK' }
  } catch (error) { return sendApiError(event, error) }
})
