import { apiError } from '../../utils/errors'

import { getPool } from '../../../database/db'
import { hashPassword, generatePassword } from '../../utils/password'
import { revokeUserSessions } from '../../utils/session'
import { recordAuditEvent } from '../audit/audit'

/**
 * Admin password provisioning/reset per SDD section 5 (TASKLIST P2-04/P2-05):
 * - Output (generated or set password) is returned ONCE, never stored in
 *   plaintext, never logged, never archived.
 * - Reset bumps credential_version and revokes all sessions.
 * - Never modifies DPT, voting rights, participation, or ballots.
 */

export interface ResetResult {
  userId: string
  generatedPassword?: string // present only when the system generated it
}

export async function resetUserPassword(opts: {
  actorId: string
  targetUserId: string
  newPassword?: string // officer-provided; omit to generate
  reason: string
}): Promise<ResetResult> {
  const pool = getPool()
  const { rows } = await pool.query<{ id: string; active: boolean }>(
    'SELECT id, active FROM users WHERE id = $1', [opts.targetUserId],
  )
  const target = rows[0]
  if (!target) apiError('NOT_FOUND', 'Akun tidak ditemukan.')
  if (!target.active) apiError('CONFLICT', 'Akun nonaktif.')

  const generated = opts.newPassword ? undefined : generatePassword()
  const finalPassword = opts.newPassword ?? generated!
  if (finalPassword.length < 12) {
    apiError('VALIDATION_ERROR', 'Password minimal 12 karakter.')
  }

  const passwordHash = await hashPassword(finalPassword)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      'UPDATE users SET password_hash = $1, credential_version = credential_version + 1 WHERE id = $2',
      [passwordHash, opts.targetUserId],
    )
    // Audit records the action and reason, never the password.
    await recordAuditEvent(client, {
      actorId: opts.actorId,
      action: 'ADMIN_RESET_PASSWORD',
      target: opts.targetUserId,
      changes: { reason: opts.reason, generated: generated !== undefined },
    })
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
  await revokeUserSessions(opts.targetUserId)
  return { userId: opts.targetUserId, generatedPassword: generated }
}
