import type { H3Event } from 'h3'
import { z } from 'zod'

/**
 * Error response shape per SDD section 6:
 * { "error": { "code": "...", "message": "..." } }
 * Never returns stack traces, credentials, or vote payloads.
 */

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'NOT_ELIGIBLE'
  | 'OPTION_INVALID'
  | 'RATE_LIMITED'
  | 'STATE_INVALID'
  | 'VERSION_STALE'
  | 'SERVICE_UNAVAILABLE'

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  NOT_ELIGIBLE: 403,
  OPTION_INVALID: 422,
  RATE_LIMITED: 429,
  STATE_INVALID: 409,
  VERSION_STALE: 409,
  SERVICE_UNAVAILABLE: 503,
}

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly statusCode: number

  constructor(code: ApiErrorCode, message: string) {
    super(message)
    this.code = code
    this.statusCode = STATUS_BY_CODE[code]
  }
}

export function apiError(code: ApiErrorCode, message: string): never {
  throw new ApiError(code, message)
}

/** Send a consistent error response; internal details are logged, not returned. */
export function sendApiError(event: H3Event, error: unknown): never {
  if (error instanceof ApiError) {
    throw createError({ statusCode: error.statusCode, data: { error: { code: error.code, message: error.message } } })
  }
  // Unexpected errors: log server-side, return generic message without stack trace.
  console.error('[api] unexpected error:', error instanceof Error ? error.message : error)
  throw createError({
    statusCode: 500,
    data: { error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan internal.' } },
  })
}

/** Parse and validate a JSON body with zod; maps failures to VALIDATION_ERROR. */
export async function parseBody<T extends z.ZodType>(event: H3Event, schema: T): Promise<z.output<T>> {
  let raw: unknown
  try {
    raw = await readBody(event)
  } catch {
    apiError('VALIDATION_ERROR', 'Body JSON tidak valid.')
  }
  const result = schema.safeParse(raw)
  if (!result.success) {
    const first = result.error.issues[0]
    apiError('VALIDATION_ERROR', first ? `${first.path.join('.')}: ${first.message}` : 'Payload tidak valid.')
  }
  return result.data
}

/** Validate route/query params with zod. */
export function parseParams<T extends z.ZodType>(data: unknown, schema: T): z.output<T> {
  const result = schema.safeParse(data)
  if (!result.success) {
    const first = result.error.issues[0]
    apiError('VALIDATION_ERROR', first ? `${first.path.join('.')}: ${first.message}` : 'Parameter tidak valid.')
  }
  return result.data
}
