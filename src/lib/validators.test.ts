import { describe, it, expect } from 'vitest';
import {
  createUserSchema,
  updateUserSchema,
  createCandidateSchema,
  updateCandidateSchema,
  voteSubmissionSchema,
  csvRowSchema,
} from './validators';

describe('createUserSchema', () => {
  it('validates a correct user input', () => {
    const input = {
      nim: '12345678',
      name: 'John Doe',
      password: 'secret123',
      role: 'VOTER' as const,
      organizationIds: ['org-1', 'org-2'],
    };
    const result = createUserSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('rejects empty NIM', () => {
    const input = {
      nim: '',
      name: 'John Doe',
      password: 'secret123',
      role: 'VOTER' as const,
    };
    const result = createUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 6 characters', () => {
    const input = {
      nim: '12345678',
      name: 'John Doe',
      password: '12345',
      role: 'VOTER' as const,
    };
    const result = createUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects invalid role', () => {
    const input = {
      nim: '12345678',
      name: 'John Doe',
      password: 'secret123',
      role: 'SUPERADMIN',
    };
    const result = createUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('allows missing organizationIds', () => {
    const input = {
      nim: '12345678',
      name: 'John Doe',
      password: 'secret123',
      role: 'ADMIN' as const,
    };
    const result = createUserSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});

describe('updateUserSchema', () => {
  it('allows all fields to be optional', () => {
    const result = updateUserSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('validates provided fields', () => {
    const result = updateUserSchema.safeParse({ password: '123' });
    expect(result.success).toBe(false);
  });
});

describe('createCandidateSchema', () => {
  it('validates a correct candidate input', () => {
    const input = {
      organizationId: 'org-1',
      nameKetua: 'Alice',
      nameWakil: 'Bob',
      vision: 'A better campus',
      mission: 'Improve facilities',
      photo: 'https://example.com/photo.jpg',
      photoWakil: 'https://example.com/photo-wakil.jpg',
    };
    const result = createCandidateSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const input = {
      organizationId: 'org-1',
      nameKetua: 'Alice',
    };
    const result = createCandidateSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe('updateCandidateSchema', () => {
  it('allows partial updates', () => {
    const result = updateCandidateSchema.safeParse({ nameKetua: 'New Name' });
    expect(result.success).toBe(true);
  });

  it('rejects empty string for provided fields', () => {
    const result = updateCandidateSchema.safeParse({ nameKetua: '' });
    expect(result.success).toBe(false);
  });
});

describe('voteSubmissionSchema', () => {
  it('validates correct vote submission', () => {
    const input = { orgId: 'org-1', candidateId: 'cand-1' };
    const result = voteSubmissionSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('rejects empty orgId', () => {
    const input = { orgId: '', candidateId: 'cand-1' };
    const result = voteSubmissionSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects empty candidateId', () => {
    const input = { orgId: 'org-1', candidateId: '' };
    const result = voteSubmissionSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe('csvRowSchema', () => {
  it('validates a correct CSV row', () => {
    const input = {
      nim: '12345678',
      name: 'John Doe',
      password: 'secret123',
      role: 'VOTER',
      organizations: 'BEM,MPM',
    };
    const result = csvRowSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('rejects missing organizations', () => {
    const input = {
      nim: '12345678',
      name: 'John Doe',
      password: 'secret123',
      organizations: '',
    };
    const result = csvRowSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('allows admin rows without organizations', () => {
    const input = {
      nim: 'admin2',
      name: 'Admin Dua',
      password: 'secret123',
      role: 'ADMIN',
      organizations: '',
    };
    const result = csvRowSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});
