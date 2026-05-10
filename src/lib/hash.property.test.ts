import { describe, beforeEach, vi } from 'vitest';
import { fc, test as fcTest } from '@fast-check/vitest';

/**
 * Feature: pemira-evoting, Property 5: Vote secrecy via deterministic one-way hash
 *
 * For any voter and organization, generateVoterHash(userId, orgId) should always
 * produce the same output (deterministic), and the resulting hash should contain
 * no direct reference to the voter's identity (no userId or orgId in plaintext).
 *
 * Validates: Requirements 7.3, 13.1, 13.2, 13.3, 13.4
 */
describe('Feature: pemira-evoting, Property 5: Vote secrecy via deterministic one-way hash', () => {
  beforeEach(() => {
    vi.stubEnv('VOTE_HASH_SECRET', 'test-secret-key-for-property-tests');
  });

  async function getHash() {
    const { generateVoterHash } = await import('@/lib/hash');
    return generateVoterHash;
  }

  // For determinism test, any non-empty string works
  const userIdArb = fc.string({ minLength: 1, maxLength: 100 });
  const orgIdArb = fc.string({ minLength: 1, maxLength: 100 });

  // For plaintext leakage test, use strings that contain at least one
  // non-hex character (outside 0-9, a-f) so they cannot accidentally
  // appear as a substring of a hex-encoded SHA-256 hash.
  const nonHexUserIdArb = fc
    .string({ minLength: 3, maxLength: 100 })
    .filter((s) => /[^0-9a-f]/i.test(s));
  const nonHexOrgIdArb = fc
    .string({ minLength: 3, maxLength: 100 })
    .filter((s) => /[^0-9a-f]/i.test(s));

  fcTest.prop([userIdArb, orgIdArb], { numRuns: 100 })(
    'same userId+orgId always produces same hash (deterministic)',
    async (userId, orgId) => {
      const generateVoterHash = await getHash();
      const hash1 = generateVoterHash(userId, orgId);
      const hash2 = generateVoterHash(userId, orgId);
      expect(hash1).toBe(hash2);
    }
  );

  fcTest.prop([nonHexUserIdArb, nonHexOrgIdArb], { numRuns: 100 })(
    'hash does not contain userId or orgId in plaintext',
    async (userId, orgId) => {
      const generateVoterHash = await getHash();
      const hash = generateVoterHash(userId, orgId);
      // The hash is a 64-char hex string (0-9, a-f only).
      // Since userId and orgId contain non-hex characters, they cannot
      // appear as substrings of the hash output.
      expect(hash).not.toContain(userId);
      expect(hash).not.toContain(orgId);
    }
  );
});
