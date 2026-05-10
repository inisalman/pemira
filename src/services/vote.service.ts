import { prisma } from '@/lib/prisma';
import { generateVoterHash } from '@/lib/hash';
import type { VoteResult, VoteCount, OrgVoteCount } from '@/types';

/**
 * Casts a vote for a candidate in an organization.
 * Uses a Prisma transaction to ensure atomicity:
 * 1. Verify voter has access to the organization
 * 2. Verify candidate belongs to the organization
 * 3. Check for existing vote via hash (duplicate detection)
 * 4. Create vote record
 * 5. Create audit log entry
 */
export async function castVote(
  userId: string,
  orgId: string,
  candidateId: string
): Promise<VoteResult> {
  const hash = generateVoterHash(userId, orgId);

  try {
    await prisma.$transaction(async (tx) => {
      // Verify voter access
      const access = await tx.voterAccess.findUnique({
        where: { userId_organizationId: { userId, organizationId: orgId } },
      });
      if (!access) throw new Error('INVALID_ACCESS');

      // Verify candidate belongs to org
      const candidate = await tx.candidate.findFirst({
        where: { id: candidateId, organizationId: orgId },
      });
      if (!candidate) throw new Error('INVALID_CANDIDATE');

      // Check for existing vote (via unique hash)
      const existing = await tx.vote.findUnique({
        where: { encryptedVoterHash: hash },
      });
      if (existing) throw new Error('ALREADY_VOTED');

      // Record vote
      await tx.vote.create({
        data: { organizationId: orgId, candidateId, encryptedVoterHash: hash },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: userId,
          actionType: 'VOTE_CAST',
          details: `Vote cast for organization ${orgId}`,
        },
      });
    });

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'ALREADY_VOTED') return { success: false, error: 'ALREADY_VOTED' };
    if (message === 'INVALID_ACCESS') return { success: false, error: 'INVALID_ACCESS' };
    if (message === 'INVALID_CANDIDATE') return { success: false, error: 'INVALID_CANDIDATE' };
    return { success: false, error: 'TRANSACTION_FAILED' };
  }
}

/**
 * Checks if a voter has already voted for a specific organization.
 * Uses the voter hash for lookup without exposing voter identity.
 */
export async function hasVoted(userId: string, orgId: string): Promise<boolean> {
  const hash = generateVoterHash(userId, orgId);
  const vote = await prisma.vote.findUnique({
    where: { encryptedVoterHash: hash },
  });
  return vote !== null;
}

/**
 * Gets vote counts per candidate for a specific organization.
 */
export async function getVoteCounts(orgId: string): Promise<VoteCount[]> {
  const candidates = await prisma.candidate.findMany({
    where: { organizationId: orgId },
    select: {
      id: true,
      nameKetua: true,
      nameWakil: true,
      _count: {
        select: { votes: true },
      },
    },
  });

  return candidates.map((candidate) => ({
    candidateId: candidate.id,
    candidateName: `${candidate.nameKetua} & ${candidate.nameWakil}`,
    count: candidate._count.votes,
  }));
}

/**
 * Gets aggregated vote counts for all organizations with participation stats.
 */
export async function getAllVoteCounts(): Promise<OrgVoteCount[]> {
  const organizations = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      candidates: {
        select: {
          id: true,
          nameKetua: true,
          nameWakil: true,
          _count: {
            select: { votes: true },
          },
        },
      },
      _count: {
        select: {
          voterAccess: true,
          votes: true,
        },
      },
    },
  });

  return organizations.map((org) => ({
    orgId: org.id,
    orgName: org.name,
    totalEligible: org._count.voterAccess,
    totalVoted: org._count.votes,
    candidates: org.candidates.map((candidate) => ({
      candidateId: candidate.id,
      candidateName: `${candidate.nameKetua} & ${candidate.nameWakil}`,
      count: candidate._count.votes,
    })),
  }));
}
