/**
 * Log redaction helpers per SDD section 5/10:
 * - Passwords, tokens, and identifiers must never appear in application logs.
 * - Vote request bodies are never logged (no option_id with identity/time).
 */

const REDACTED = '[REDACTED]'

const SENSITIVE_KEY_PATTERN = /password|secret|token|hash|credential|identifier|initial_password|option_id|voter/i

/** Mask sensitive fields in an object tree for safe logging. */
export function redactForLog(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactForLog(item))
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      out[key] = SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : redactForLog(val)
    }
    return out
  }
  return value
}

/** Safe structured log line. Use this instead of console.log with raw payloads. */
export function logSafe(event: string, data?: Record<string, unknown>): void {
  if (data === undefined) {
    console.log(`[${event}]`)
    return
  }
  console.log(`[${event}]`, JSON.stringify(redactForLog(data)))
}
