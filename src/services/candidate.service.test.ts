import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to define mocks that can be referenced in vi.mock factories
const mockPrisma = vi.hoisted(() => ({
  candidate: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  vote: {
    count: vi.fn(),
  },
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

import {
  createCandidate,
  getCandidatesByOrg,
  getAllCandidatesGrouped,
  updateCandidate,
  deleteCandidate,
} from './candidate.service';

describe('Candidate Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCandidate', () => {
    it('should create a candidate with all fields', async () => {
      const input = {
        organizationId: 'org-1',
        nameKetua: 'Alice',
        nameWakil: 'Bob',
        vision: 'A better campus',
        mission: 'Improve facilities',
        photo: 'https://example.com/photo.jpg',
      };

      const mockCandidate = {
        id: 'cand-1',
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
        organization: { id: 'org-1', name: 'BEM', createdAt: new Date() },
      };

      mockPrisma.candidate.create.mockResolvedValue(mockCandidate);

      const result = await createCandidate(input);

      expect(result).toEqual(mockCandidate);
      expect(mockPrisma.candidate.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-1',
          nameKetua: 'Alice',
          nameWakil: 'Bob',
          vision: 'A better campus',
          mission: 'Improve facilities',
          photo: 'https://example.com/photo.jpg',
        },
        include: { organization: true },
      });
    });
  });

  describe('getCandidatesByOrg', () => {
    it('should return all candidates for a specific organization', async () => {
      const mockCandidates = [
        {
          id: 'cand-1',
          organizationId: 'org-1',
          nameKetua: 'Alice',
          nameWakil: 'Bob',
          vision: 'Vision 1',
          mission: 'Mission 1',
          photo: 'photo1.jpg',
          createdAt: new Date(),
          updatedAt: new Date(),
          organization: { id: 'org-1', name: 'BEM', createdAt: new Date() },
        },
        {
          id: 'cand-2',
          organizationId: 'org-1',
          nameKetua: 'Charlie',
          nameWakil: 'Diana',
          vision: 'Vision 2',
          mission: 'Mission 2',
          photo: 'photo2.jpg',
          createdAt: new Date(),
          updatedAt: new Date(),
          organization: { id: 'org-1', name: 'BEM', createdAt: new Date() },
        },
      ];

      mockPrisma.candidate.findMany.mockResolvedValue(mockCandidates);

      const result = await getCandidatesByOrg('org-1');

      expect(result).toEqual(mockCandidates);
      expect(mockPrisma.candidate.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        include: { organization: true },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should return empty array when no candidates exist for the organization', async () => {
      mockPrisma.candidate.findMany.mockResolvedValue([]);

      const result = await getCandidatesByOrg('org-nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('getAllCandidatesGrouped', () => {
    it('should return candidates grouped by organization ID', async () => {
      const mockCandidates = [
        {
          id: 'cand-1',
          organizationId: 'org-1',
          nameKetua: 'Alice',
          nameWakil: 'Bob',
          vision: 'Vision 1',
          mission: 'Mission 1',
          photo: 'photo1.jpg',
          createdAt: new Date(),
          updatedAt: new Date(),
          organization: { id: 'org-1', name: 'BEM', createdAt: new Date() },
        },
        {
          id: 'cand-2',
          organizationId: 'org-1',
          nameKetua: 'Charlie',
          nameWakil: 'Diana',
          vision: 'Vision 2',
          mission: 'Mission 2',
          photo: 'photo2.jpg',
          createdAt: new Date(),
          updatedAt: new Date(),
          organization: { id: 'org-1', name: 'BEM', createdAt: new Date() },
        },
        {
          id: 'cand-3',
          organizationId: 'org-2',
          nameKetua: 'Eve',
          nameWakil: 'Frank',
          vision: 'Vision 3',
          mission: 'Mission 3',
          photo: 'photo3.jpg',
          createdAt: new Date(),
          updatedAt: new Date(),
          organization: { id: 'org-2', name: 'MPM', createdAt: new Date() },
        },
      ];

      mockPrisma.candidate.findMany.mockResolvedValue(mockCandidates);

      const result = await getAllCandidatesGrouped();

      expect(Object.keys(result)).toHaveLength(2);
      expect(result['org-1']).toHaveLength(2);
      expect(result['org-2']).toHaveLength(1);
      expect(result['org-1'][0].id).toBe('cand-1');
      expect(result['org-1'][1].id).toBe('cand-2');
      expect(result['org-2'][0].id).toBe('cand-3');
      expect(mockPrisma.candidate.findMany).toHaveBeenCalledWith({
        include: { organization: true },
        orderBy: [{ organizationId: 'asc' }, { createdAt: 'asc' }],
      });
    });

    it('should return empty object when no candidates exist', async () => {
      mockPrisma.candidate.findMany.mockResolvedValue([]);

      const result = await getAllCandidatesGrouped();

      expect(result).toEqual({});
    });
  });

  describe('updateCandidate', () => {
    it('should update candidate fields', async () => {
      const mockUpdated = {
        id: 'cand-1',
        organizationId: 'org-1',
        nameKetua: 'Alice Updated',
        nameWakil: 'Bob',
        vision: 'New vision',
        mission: 'Mission 1',
        photo: 'photo1.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
        organization: { id: 'org-1', name: 'BEM', createdAt: new Date() },
      };

      mockPrisma.candidate.update.mockResolvedValue(mockUpdated);

      const result = await updateCandidate('cand-1', {
        nameKetua: 'Alice Updated',
        vision: 'New vision',
      });

      expect(result).toEqual(mockUpdated);
      expect(mockPrisma.candidate.update).toHaveBeenCalledWith({
        where: { id: 'cand-1' },
        data: { nameKetua: 'Alice Updated', vision: 'New vision' },
        include: { organization: true },
      });
    });

    it('should only include defined fields in the update', async () => {
      const mockUpdated = {
        id: 'cand-1',
        organizationId: 'org-1',
        nameKetua: 'Alice',
        nameWakil: 'Bob',
        vision: 'Vision 1',
        mission: 'Updated mission',
        photo: 'new-photo.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
        organization: { id: 'org-1', name: 'BEM', createdAt: new Date() },
      };

      mockPrisma.candidate.update.mockResolvedValue(mockUpdated);

      await updateCandidate('cand-1', {
        mission: 'Updated mission',
        photo: 'new-photo.jpg',
      });

      expect(mockPrisma.candidate.update).toHaveBeenCalledWith({
        where: { id: 'cand-1' },
        data: { mission: 'Updated mission', photo: 'new-photo.jpg' },
        include: { organization: true },
      });
    });
  });

  describe('deleteCandidate', () => {
    it('should prevent deletion if candidate has received votes', async () => {
      mockPrisma.vote.count.mockResolvedValue(5);

      const result = await deleteCandidate('cand-1');

      expect(result).toEqual({
        success: false,
        error: 'Tidak dapat menghapus kandidat yang sudah menerima suara',
      });
      expect(mockPrisma.candidate.delete).not.toHaveBeenCalled();
    });

    it('should delete candidate when no votes exist', async () => {
      mockPrisma.vote.count.mockResolvedValue(0);
      mockPrisma.candidate.delete.mockResolvedValue({ id: 'cand-1' });

      const result = await deleteCandidate('cand-1');

      expect(result).toEqual({ success: true });
      expect(mockPrisma.vote.count).toHaveBeenCalledWith({
        where: { candidateId: 'cand-1' },
      });
      expect(mockPrisma.candidate.delete).toHaveBeenCalledWith({
        where: { id: 'cand-1' },
      });
    });
  });
});
