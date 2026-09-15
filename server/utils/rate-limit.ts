import { getPool } from '../../database/db'

/**
 * Login rate limiting per SDD section 5:
 * - per account (login_kind + identifier): small burst, longer window
 * - per IP: generous ceiling that tolerates a shared campus NAT where many
 *   voters share one public address
 *
 * Counters live in the database (not process memory) so they survive restarts
 * and remain correct if the app is ever scaled out.
 */

const ACCOUNT_MAX = 10
const ACCOUNT_WINDOW_S = 900 // 15 minutes
const IP_MAX = 120
const IP_WINDOW_S = 600 // 10 minutes — enough for a classroom behind one NAT

export async function checkLoginRateLimit(kind: string, identifier: string, ip: string): Promise<void> {
  const pool = getPool()
  const account = await pool.query<{ failures: string }>(
    `SELECT count(*)::text AS failures FROM login_attempts
     WHERE kind = $1 AND identifier = $2 AND success = FALSE AND occurred_at > clock_timestamp() - interval '${ACCOUNT_WINDOW_S} seconds'`,
    [kind, identifier],
  )
  if (Number(account.rows[0]?.failures ?? 0) >= ACCOUNT_MAX) {
    apiError('RATE_LIMITED', 'Terlalu banyak percobaan gagal. Coba lagi nanti.')
  }
  const ipHits = await pool.query<{ attempts: string }>(
    `SELECT count(*)::text AS attempts FROM login_attempts
     WHERE ip_hash = $1 AND occurred_at > clock_timestamp() - interval '${IP_WINDOW_S} seconds'`,
    [ip],
  )
  if (Number(ipHits.rows[0]?.attempts ?? 0) >= IP_MAX) {
    apiError('RATE_LIMITED', 'Terlalu banyak permintaan dari jaringan ini. Coba lagi nanti.')
  }
}

export async function recordLoginAttempt(kind: string, identifier: string, ip: string, success: boolean): Promise<void> {
  await getPool().query(
    'INSERT INTO login_attempts (kind, identifier, ip_hash, success) VALUES ($1, $2, $3, $4)',
    [kind, identifier, ip, success],
  )
}

export function clientIp(event: import('h3').H3Event): string {
  // Campus NAT: do not trust arbitrary X-Forwarded-For chains blindly; use the
  // immediate peer unless a trusted proxy header exists.
  return getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
}
