import { createHmac } from 'crypto';

/**
 * Generates a one-way hash for vote uniqueness verification.
 * The hash is derived from userId + organizationId using HMAC-SHA256.
 * This ensures:
 * 1. Same voter + same org always produces same hash (duplicate detection)
 * 2. Hash cannot be reversed to identify the voter
 * 3. Without the secret, hash cannot be computed externally
 */
export function generateVoterHash(userId: string, organizationId: string): string {
  const secret = process.env.VOTE_HASH_SECRET;
  if (!secret) {
    throw new Error('VOTE_HASH_SECRET environment variable is not set');
  }
  return createHmac('sha256', secret)
    .update(`${userId}:${organizationId}`)
    .digest('hex');
}
