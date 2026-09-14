import { z } from 'zod'

/** Shared request schemas per SDD sections 5/6. Kept in one place for reuse. */

export const loginKindSchema = z.enum(['STUDENT', 'LECTURER', 'ADMIN'])

export const voterTypeSchema = z.enum(['STUDENT', 'LECTURER'])

export const identifierTypeSchema = z.enum(['NIM', 'NIP_LOCAL'])

export const loginSchema = z.object({
  loginKind: loginKindSchema,
  identifier: z.string().min(1).max(64),
  password: z.string().min(1).max(256),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(256),
  newPassword: z.string().min(12).max(256),
})

export const voteSchema = z.object({
  optionId: z.string().min(1).max(64),
})

export const uuidLikeSchema = z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/)

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
