import type { Pool, PoolClient } from 'pg'

/**
 * Append-only admin audit per SDD section 3 (audit_events) and TASKLIST P0-06.
 * - Records are inserted via the application only; no update/delete paths exist.
 * - Never stores credentials, vote payloads, or full DPT file contents.
 * - Sensitive fields are redacted before persistence (see redactSensitive).
 */

export interface AuditEventInput {
  actorId?: string | null
  electionId?: string | null
  action: string
  target?: string | null
  changes?: Record<string, unknown>
}

/** Keys whose values must never reach the audit log. */
const SENSITIVE_KEY_PATTERN = /password|secret|token|hash|credential|identifier|initial_password/i

/** Recursively mask sensitive values; keeps key presence for traceability. */
export function redactSensitive(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item))
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        out[key] = '[REDACTED]'
      } else {
        out[key] = redactSensitive(val)
      }
    }
    return out
  }
  return value
}

/** Insert an audit event using an existing transaction client (atomic with the mutation). */
export async function recordAuditEvent(client: PoolClient | Pool, input: AuditEventInput): Promise<void> {
  await client.query(
    `INSERT INTO audit_events (id, actor_id, election_id, action, target, redacted_changes)
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5)`,
    [
      input.actorId ?? null,
      input.electionId ?? null,
      input.action,
      input.target ?? null,
      input.changes === undefined ? null : JSON.stringify(redactSensitive(input.changes)),
    ],
  )
}
