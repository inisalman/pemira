import { describe, expect, it } from 'vitest'
import { redactSensitive } from '../../server/services/audit/audit'
import { redactForLog } from '../../server/utils/log-redaction'
import { ApiError } from '../../server/utils/errors'
import { loginSchema, voteSchema } from '../../server/utils/schemas'

describe('audit redaction', () => {
  it('masks password fields', () => {
    const out = redactSensitive({ name: 'A', password: 'secret123', initial_password: 'x' }) as Record<string, unknown>
    expect(out.name).toBe('A')
    expect(out.password).toBe('[REDACTED]')
    expect(out.initial_password).toBe('[REDACTED]')
  })

  it('masks nested and array values', () => {
    const out = redactSensitive({ rows: [{ identifier_value: '123', password_hash: 'h' }] }) as any
    expect(out.rows[0].identifier_value).toBe('[REDACTED]')
    expect(out.rows[0].password_hash).toBe('[REDACTED]')
  })

  it('keeps non-sensitive values intact', () => {
    const out = redactSensitive({ department_code: 'KEP', count: 5 }) as Record<string, unknown>
    expect(out.department_code).toBe('KEP')
    expect(out.count).toBe(5)
  })
})

describe('log redaction', () => {
  it('never leaks option_id or identifiers', () => {
    const out = redactForLog({ voter: 'N000001', option_id: 'abc', sessionToken: 't' }) as Record<string, unknown>
    expect(out.voter).toBe('[REDACTED]')
    expect(out.option_id).toBe('[REDACTED]')
    expect(out.sessionToken).toBe('[REDACTED]')
  })
})

describe('error envelope', () => {
  it('maps error codes to SDD status codes', () => {
    expect(new ApiError('VALIDATION_ERROR', 'x').statusCode).toBe(400)
    expect(new ApiError('UNAUTHORIZED', 'x').statusCode).toBe(401)
    expect(new ApiError('FORBIDDEN', 'x').statusCode).toBe(403)
    expect(new ApiError('NOT_ELIGIBLE', 'x').statusCode).toBe(403)
    expect(new ApiError('OPTION_INVALID', 'x').statusCode).toBe(422)
    expect(new ApiError('RATE_LIMITED', 'x').statusCode).toBe(429)
    expect(new ApiError('SERVICE_UNAVAILABLE', 'x').statusCode).toBe(503)
  })
})

describe('request schemas', () => {
  it('vote body accepts only optionId', () => {
    expect(voteSchema.safeParse({ optionId: 'abc' }).success).toBe(true)
    expect(voteSchema.safeParse({}).success).toBe(false)
  })

  it('login requires kind, identifier, password', () => {
    expect(loginSchema.safeParse({ loginKind: 'STUDENT', identifier: 'N000001', password: 'x' }).success).toBe(true)
    expect(loginSchema.safeParse({ loginKind: 'TEACHER', identifier: 'x', password: 'x' }).success).toBe(false)
  })
})
