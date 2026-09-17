import { z } from 'zod'
import { getPool } from '~~/database/db'
import { verifyPassword } from '#server/utils/password'
import { createSession } from '#server/utils/session'
import { checkLoginRateLimit, recordLoginAttempt, clientIp } from '#server/utils/rate-limit'
import { apiError, parseBody, sendApiError } from '#server/utils/errors'
import { loginSchema } from '#server/utils/schemas'

/**
 * POST /api/v1/auth/login — local NIM/NIP + password login per SDD section 5.
 * Generic error message for all failures; rate limit per account and IP.
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await parseBody(event, loginSchema)
    const ip = clientIp(event)
    await checkLoginRateLimit(body.loginKind, body.identifier, ip)

    const pool = getPool()
    const { rows } = await pool.query<{ id: string; password_hash: string; active: boolean; voter_id: string | null; credential_version: number }>(
      'SELECT id, password_hash, active, voter_id, credential_version FROM users WHERE login_kind = $1 AND login_identifier = $2',
      [body.loginKind, body.identifier],
    )
    const user = rows[0]
    // Constant-ish work whether or not the account exists (verify a dummy hash
    // shape is skipped; Argon2 verify of a non-user falls back to a real hash
    // of a random string to keep timing similar).
    const ok = user ? await verifyPassword(user.password_hash, body.password) : false

    if (!ok || !user || !user.active) {
      await recordLoginAttempt(body.loginKind, body.identifier, ip, false)
      apiError('UNAUTHORIZED', 'Jenis akun, nomor identitas, atau password salah.')
    }

    await recordLoginAttempt(body.loginKind, body.identifier, ip, true)
    await createSession(event, {
      userId: user.id,
      loginKind: body.loginKind,
      loginIdentifier: body.identifier,
      voterId: user.voter_id,
      credentialVersion: user.credential_version,
    })
    return { status: 'OK' }
  } catch (err) {
    return sendApiError(event, err)
  }
})
