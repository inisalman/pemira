import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to define mocks that can be referenced in vi.mock factories
const mockPrisma = vi.hoisted(() => ({
  voterAccess: {
    findUnique: vi.fn(),
  },
  candidate: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  vote: {
    findUnique: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
  organization: {
    findMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

// Mock hash utility
vi.mock('@/lib/hash', () => ({
  generateVoterHash: vi.fn(
    (userId: string, orgId: string) => `hash_${userId}_${orgId}`
  ),
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

import {
  castVote,
  hasVoted,
  getVoteCounts,
  getAllVoteCounts,
  resetVotes,
} from './vote.service';

describe('Vote Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup $transaction to execute the callback with mockPrisma
    mockPrisma.$transaction.mockImplementation(
      (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma)
    );
  });

  describe('castVote', () => {
    it('should successfully cast a vote when all conditions are met', async () => {
      mockPrisma.voterAccess.findUnique.mockResolvedValue({
        id: 'va-1',
        userId: 'user-1',
        organizationId: 'org-1',
      });
      mockPrisma.candidate.findFirst.mockResolvedValue({
        id: 'cand-1',
        organizationId: 'org-1',
        nameKetua: 'Ketua',
        nameWakil: 'Wakil',
      });
      mockPrisma.vote.findUnique.mockResolvedValue(null);
      mockPrisma.vote.create.mockResolvedValue({
        id: 'vote-1',
        organizationId: 'org-1',
        candidateId: 'cand-1',
        encryptedVoterHash: 'hash_user-1_org-1',
      });
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-1' });

      const result = await castVote('user-1', 'org-1', 'cand-1');

      expect(result).toEqual({ success: true });
      expect(mockPrisma.voterAccess.findUnique).toHaveBeenCalledWith({
        where: { userId_organizationId: { userId: 'user-1', organizationId: 'org-1' } },
      });
      expect(mockPrisma.candidate.findFirst).toHaveBeenCalledWith({
        where: { id: 'cand-1', organizationId: 'org-1' },
      });
      expect(mockPrisma.vote.findUnique).toHaveBeenCalledWith({
        where: { encryptedVoterHash: 'hash_user-1_org-1' },
      });
      expect(mockPrisma.vote.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-1',
          candidateId: 'cand-1',
          encryptedVoterHash: 'hash_user-1_org-1',
        },
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 'user-1',
          actionType: 'VOTE_CAST',
          details: 'Vote cast for organization org-1',
        },
      });
    });

    it('should return INVALID_ACCESS when voter has no access to the organization', async () => {
      mockPrisma.voterAccess.findUnique.mockResolvedValue(null);

      const result = await castVote('user-1', 'org-1', 'cand-1');

      expect(result).toEqual({ success: false, error: 'INVALID_ACCESS' });
      expect(mockPrisma.candidate.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.vote.create).not.toHaveBeenCalled();
    });

    it('should return INVALID_CANDIDATE when candidate does not belong to the organization', async () => {
      mockPrisma.voterAccess.findUnique.mockResolvedValue({
        id: 'va-1',
        userId: 'user-1',
        organizationId: 'org-1',
      });
      mockPrisma.candidate.findFirst.mockResolvedValue(null);

      const result = await castVote('user-1', 'org-1', 'cand-wrong');

      expect(result).toEqual({ success: false, error: 'INVALID_CANDIDATE' });
      expect(mockPrisma.vote.create).not.toHaveBeenCalled();
    });

    it('should return ALREADY_VOTED when voter has already voted for the organization', async () => {
      mockPrisma.voterAccess.findUnique.mockResolvedValue({
        id: 'va-1',
        userId: 'user-1',
        organizationId: 'org-1',
      });
      mockPrisma.candidate.findFirst.mockResolvedValue({
        id: 'cand-1',
        organizationId: 'org-1',
      });
      mockPrisma.vote.findUnique.mockResolvedValue({
        id: 'existing-vote',
        encryptedVoterHash: 'hash_user-1_org-1',
      });

      const result = await castVote('user-1', 'org-1', 'cand-1');

      expect(result).toEqual({ success: false, error: 'ALREADY_VOTED' });
      expect(mockPrisma.vote.create).not.toHaveBeenCalled();
    });

    it('should return TRANSACTION_FAILED on unexpected errors', async () => {
      mockPrisma.$transaction.mockRejectedValue(new Error('DB connection lost'));

      const result = await castVote('user-1', 'org-1', 'cand-1');

      expect(result).toEqual({ success: false, error: 'TRANSACTION_FAILED' });
    });
  });

  describe('hasVoted', () => {
    it('should return true when a vote exists for the voter-org pair', async () => {
      mockPrisma.vote.findUnique.mockResolvedValue({
        id: 'vote-1',
        encryptedVoterHash: 'hash_user-1_org-1',
      });

      const result = await hasVoted('user-1', 'org-1');

      expect(result).toBe(true);
      expect(mockPrisma.vote.findUnique).toHaveBeenCalledWith({
        where: { encryptedVoterHash: 'hash_user-1_org-1' },
      });
    });

    it('should return false when no vote exists for the voter-org pair', async () => {
      mockPrisma.vote.findUnique.mockResolvedValue(null);

      const result = await hasVoted('user-1', 'org-1');

      expect(result).toBe(false);
    });
  });

  describe('getVoteCounts', () => {
    it('should return vote counts per candidate for an organization', async () => {
      mockPrisma.candidate.findMany.mockResolvedValue([
        {
          id: 'cand-1',
          nameKetua: 'Alice',
          nameWakil: 'Bob',
          _count: { votes: 10 },
        },
        {
          id: 'cand-2',
          nameKetua: 'Charlie',
          nameWakil: 'Diana',
          _count: { votes: 7 },
        },
      ]);

      const result = await getVoteCounts('org-1');

      expect(result).toEqual([
        { candidateId: 'cand-1', candidateName: 'Alice & Bob', count: 10 },
        { candidateId: 'cand-2', candidateName: 'Charlie & Diana', count: 7 },
      ]);
      expect(mockPrisma.candidate.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        select: {
          id: true,
          nameKetua: true,
          nameWakil: true,
          _count: { select: { votes: true } },
        },
      });
    });

    it('should return empty array when no candidates exist for the organization', async () => {
      mockPrisma.candidate.findMany.mockResolvedValue([]);

      const result = await getVoteCounts('org-nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('getAllVoteCounts', () => {
    it('should return aggregated vote counts for all organizations', async () => {
      mockPrisma.organization.findMany.mockResolvedValue([
        {
          id: 'org-1',
          name: 'BEM',
          candidates: [
            {
              id: 'cand-1',
              nameKetua: 'Alice',
              nameWakil: 'Bob',
              _count: { votes: 10 },
            },
          ],
          _count: { voterAccess: 50, votes: 10 },
        },
        {
          id: 'org-2',
          name: 'MPM',
          candidates: [
            {
              id: 'cand-2',
              nameKetua: 'Charlie',
              nameWakil: 'Diana',
              _count: { votes: 5 },
            },
            {
              id: 'cand-3',
              nameKetua: 'Eve',
              nameWakil: 'Frank',
              _count: { votes: 3 },
            },
          ],
          _count: { voterAccess: 30, votes: 8 },
        },
      ]);

      const result = await getAllVoteCounts();

      expect(result).toEqual([
        {
          orgId: 'org-1',
          orgName: 'BEM',
          totalEligible: 50,
          totalVoted: 10,
          candidates: [
            { candidateId: 'cand-1', candidateName: 'Alice & Bob', count: 10 },
          ],
        },
        {
          orgId: 'org-2',
          orgName: 'MPM',
          totalEligible: 30,
          totalVoted: 8,
          candidates: [
            { candidateId: 'cand-2', candidateName: 'Charlie & Diana', count: 5 },
            { candidateId: 'cand-3', candidateName: 'Eve & Frank', count: 3 },
          ],
        },
      ]);
    });

    it('should return empty array when no organizations exist', async () => {
      mockPrisma.organization.findMany.mockResolvedValue([]);

      const result = await getAllVoteCounts();

      expect(result).toEqual([]);
    });
  });

  describe('resetVotes', () => {
    it('should delete votes for a specific organization', async () => {
      mockPrisma.vote.deleteMany.mockResolvedValue({ count: 12 });

      const result = await resetVotes('org-1');

      expect(result).toBe(12);
      expect(mockPrisma.vote.deleteMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
      });
    });

    it('should delete all votes when organization is not provided', async () => {
      mockPrisma.vote.deleteMany.mockResolvedValue({ count: 42 });

      const result = await resetVotes();

      expect(result).toBe(42);
      expect(mockPrisma.vote.deleteMany).toHaveBeenCalledWith({
        where: undefined,
      });
    });
  });
});
