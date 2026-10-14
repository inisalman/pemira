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

/**
 * Resolve the client IP for rate-limiting in a spoof-resistant way.
 *
 * X-Forwarded-For is client-controllable, so trusting it blindly lets an
 * attacker rotate the header to dodge the per-IP ceiling. We only read it when
 * the operator declares how many trusted proxy hops sit in front of the app
 * via NUXT_TRUSTED_PROXY_COUNT (e.g. 1 behind EasyPanel/nginx).
 *
 * - count = 0 (default): ignore XFF entirely, use the direct socket peer.
 *   Safe default for a directly-exposed app.
 * - count = N (N >= 1): take the Nth entry from the RIGHT of the XFF chain —
 *   the address the outermost trusted proxy observed. Everything further left
 *   is attacker-supplied and never trusted. Falls back to the socket peer when
 *   the chain is shorter than expected.
 */
function trustedProxyCount(): number {
  const raw = Number(process.env.NUXT_TRUSTED_PROXY_COUNT ?? '0')
  return Number.isInteger(raw) && raw >= 0 ? raw : 0
}

export function clientIp(event: import('h3').H3Event): string {
  const hops = trustedProxyCount()
  const peer = getRequestIP(event) ?? 'unknown'
  if (hops === 0) return peer

  const xff = getHeader(event, 'x-forwarded-for')
  if (!xff) return peer
  const chain = xff.split(',').map((part) => part.trim()).filter(Boolean)
  // The rightmost `hops` entries were appended by trusted proxies; the client
  // IP we want is the one just beyond the outermost trusted hop.
  const idx = chain.length - hops
  return (idx >= 0 ? chain[idx] : chain[0]) || peer
}
