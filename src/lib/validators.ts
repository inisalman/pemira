import { z } from 'zod';

// User creation schema
export const createUserSchema = z.object({
  nim: z.string().min(1, 'NIM is required'),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'VOTER']),
  organizationIds: z.array(z.string()).optional(),
});

// User update schema (all fields optional)
export const updateUserSchema = z.object({
  nim: z.string().min(1, 'NIM is required').optional(),
  name: z.string().min(1, 'Name is required').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['ADMIN', 'VOTER']).optional(),
  organizationIds: z.array(z.string()).optional(),
});

// Candidate creation schema
export const createCandidateSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  nameKetua: z.string().min(1, 'Nama ketua is required'),
  nameWakil: z.string().min(1, 'Nama wakil is required'),
  vision: z.string().min(1, 'Vision is required'),
  mission: z.string().min(1, 'Mission is required'),
  photo: z.string().min(1, 'Photo is required'),
});

// Candidate update schema (all fields optional)
export const updateCandidateSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required').optional(),
  nameKetua: z.string().min(1, 'Nama ketua is required').optional(),
  nameWakil: z.string().min(1, 'Nama wakil is required').optional(),
  vision: z.string().min(1, 'Vision is required').optional(),
  mission: z.string().min(1, 'Mission is required').optional(),
  photo: z.string().min(1, 'Photo is required').optional(),
});

// Vote submission schema
export const voteSubmissionSchema = z.object({
  orgId: z.string().min(1, 'Organization ID is required'),
  candidateId: z.string().min(1, 'Candidate ID is required'),
});

// CSV row validation schema for bulk import
export const csvRowSchema = z.object({
  nim: z.string().min(1, 'NIM is required'),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(1, 'Password is required'),
  organizations: z.string().min(1, 'Organizations is required'),
});

// Inferred types from schemas
export type CreateUserSchema = z.infer<typeof createUserSchema>;
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;
export type CreateCandidateSchema = z.infer<typeof createCandidateSchema>;
export type UpdateCandidateSchema = z.infer<typeof updateCandidateSchema>;
export type VoteSubmissionSchema = z.infer<typeof voteSubmissionSchema>;
export type CsvRowSchema = z.infer<typeof csvRowSchema>;
