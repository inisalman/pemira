import { createHash, randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'
import { getPool } from '../../database/db'

/**
 * Session management per SDD section 5:
 * - Random opaque token in a Secure/HttpOnly/SameSite cookie; only the token
 *   hash is stored (sessions.id_hash).
 * - Absolute expiry 8 hours; rotation on login; revocation on logout, password
 *   reset, or account deactivation (credential_version bump).
 * - CSRF protection: double-submit token for state-changing requests.
 */

export const SESSION_COOKIE = 'pemira_session'
export const CSRF_COOKIE = 'pemira_csrf'
const SESSION_TTL_MS = 8 * 60 * 60 * 1000

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export interface SessionUser {
  userId: string
  loginKind: 'STUDENT' | 'LECTURER' | 'ADMIN'
  loginIdentifier: string
  voterId: string | null
  credentialVersion: number
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  }
}

/** Create a new session (used after login). Rotates any existing session. */
export async function createSession(event: H3Event, user: SessionUser): Promise<void> {
  const token = randomBytes(32).toString('base64url')
  const pool = getPool()
  await pool.query(
    'INSERT INTO sessions (id_hash, user_id, credential_version, expires_at) VALUES ($1, $2, $3, $4)',
    [hashToken(token), user.userId, user.credentialVersion, new Date(Date.now() + SESSION_TTL_MS)],
  )
  setCookie(event, SESSION_COOKIE, token, cookieOptions())
  // CSRF token: readable by the app script (not httpOnly) for double-submit.
  setCookie(event, CSRF_COOKIE, randomBytes(32).toString('base64url'), {
    ...cookieOptions(),
    httpOnly: false,
  })
}

/** Read and validate the current session; returns null when absent/expired/revoked. */
export async function getSessionUser(event: H3Event): Promise<SessionUser | null> {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) return null
  const pool = getPool()
  const { rows } = await pool.query<{
    user_id: string
    credential_version: number
    login_kind: SessionUser['loginKind']
    login_identifier: string
    voter_id: string | null
    active: boolean
  }>(
    `SELECT s.user_id, s.credential_version, u.login_kind, u.login_identifier, u.voter_id, u.active
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id_hash = $1 AND s.expires_at > clock_timestamp()`,
    [hashToken(token)],
  )
  const row = rows[0]
  if (!row || !row.active) return null
  // Session is invalid when the account's credential_version moved (reset/deactivation).
  if (row.credential_version !== (await pool.query<{ credential_version: number }>(
    'SELECT credential_version FROM users WHERE id = $1', [row.user_id],
  )).rows[0]?.credential_version) {
    return null
  }
  return {
    userId: row.user_id,
    loginKind: row.login_kind,
    loginIdentifier: row.login_identifier,
    voterId: row.voter_id,
    credentialVersion: row.credential_version,
  }
}

/** Require a session or throw 401. */
export async function requireSession(event: H3Event): Promise<SessionUser> {
  const user = await getSessionUser(event)
  if (!user) apiError('UNAUTHORIZED', 'Sesi tidak sah atau kedaluwarsa.')
  return user
}

/** Require an admin session or throw 403. */
export async function requireAdmin(event: H3Event): Promise<SessionUser> {
  const user = await requireSession(event)
  if (user.loginKind !== 'ADMIN') apiError('FORBIDDEN', 'Akses khusus panitia.')
  return user
}

/** Revoke the current session (logout). */
export async function destroySession(event: H3Event): Promise<void> {
  const token = getCookie(event, SESSION_COOKIE)
  if (token) {
    await getPool().query('DELETE FROM sessions WHERE id_hash = $1', [hashToken(token)])
  }
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
  deleteCookie(event, CSRF_COOKIE, { path: '/' })
}

/** Revoke all sessions of a user (password reset / deactivation). */
export async function revokeUserSessions(userId: string): Promise<void> {
  await getPool().query('DELETE FROM sessions WHERE user_id = $1', [userId])
}

/**
 * CSRF protection for state-changing requests (double-submit cookie):
 * the request must carry the CSRF cookie value in the X-CSRF-Token header.
 */
export function requireCsrf(event: H3Event): void {
  const cookieToken = getCookie(event, CSRF_COOKIE)
  const headerToken = getHeader(event, 'x-csrf-token')
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    apiError('FORBIDDEN', 'Token CSRF tidak valid.')
  }
}
