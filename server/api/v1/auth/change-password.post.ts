import { z } from 'zod'
import { getPool } from '~~/database/db'
import { hashPassword, verifyPassword } from '#server/utils/password'
import { requireSession, requireCsrf, revokeUserSessions } from '#server/utils/session'
import { parseBody, sendApiError } from '#server/utils/errors'
import { changePasswordSchema } from '#server/utils/schemas'
import { recordAuditEvent } from '#server/services/audit/audit'

/**
 * POST /api/v1/auth/change-password — self-service change per SDD section 5.
 * Verifies current password, stores the new hash, bumps credential_version,
 * and revokes all sessions. Never touches DPT, rights, participation, ballots.
 */
export default defineEventHandler(async (event) => {
  try {
    const user = await requireSession(event)
    requireCsrf(event)
    const body = await parseBody(event, changePasswordSchema)

    const pool = getPool()
    const { rows } = await pool.query<{ password_hash: string }>(
      'SELECT password_hash FROM users WHERE id = $1', [user.userId],
    )
    const current = rows[0]
    if (!current || !(await verifyPassword(current.password_hash, body.currentPassword))) {
      apiError('UNAUTHORIZED', 'Password saat ini salah.')
    }

    const newHash = await hashPassword(body.newPassword)
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        'UPDATE users SET password_hash = $1, credential_version = credential_version + 1 WHERE id = $2',
        [newHash, user.userId],
      )
      await recordAuditEvent(client, {
        actorId: user.userId,
        action: 'AUTH_CHANGE_PASSWORD',
        target: user.userId,
      })
      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
    // Sessions are revoked AFTER commit so the new credential_version invalidates them.
    await revokeUserSessions(user.userId)
    return { status: 'OK' }
  } catch (err) {
    return sendApiError(event, err)
  }
})
