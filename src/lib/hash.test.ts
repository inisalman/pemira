import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('generateVoterHash', () => {
  const userId = 'user-123';
  const orgId = 'org-456';

  beforeEach(() => {
    vi.stubEnv('VOTE_HASH_SECRET', 'test-secret-key-for-unit-tests');
  });

  // Dynamic import to avoid module-level caching issues
  async function getHash() {
    const { generateVoterHash } = await import('@/lib/hash');
    return generateVoterHash;
  }

  it('should produce the same hash for the same inputs (deterministic)', async () => {
    const generateVoterHash = await getHash();
    const hash1 = generateVoterHash(userId, orgId);
    const hash2 = generateVoterHash(userId, orgId);
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different inputs', async () => {
    const generateVoterHash = await getHash();
    const hash1 = generateVoterHash(userId, orgId);
    const hash2 = generateVoterHash('user-789', orgId);
    const hash3 = generateVoterHash(userId, 'org-999');
    expect(hash1).not.toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash2).not.toBe(hash3);
  });

  it('should return a valid hex string of 64 characters (SHA-256)', async () => {
    const generateVoterHash = await getHash();
    const hash = generateVoterHash(userId, orgId);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should not contain the userId or orgId in plaintext', async () => {
    const generateVoterHash = await getHash();
    const hash = generateVoterHash(userId, orgId);
    expect(hash).not.toContain(userId);
    expect(hash).not.toContain(orgId);
  });
});
