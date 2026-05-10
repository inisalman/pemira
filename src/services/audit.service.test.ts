import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  auditLog: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

import { log, getEntries } from './audit.service';

describe('Audit Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('log', () => {
    it('should create an audit log entry with required fields', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-1' });

      await log({
        actorId: 'user-1',
        actionType: 'VOTE_CAST',
        details: 'Vote cast for organization org-1',
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 'user-1',
          actionType: 'VOTE_CAST',
          details: 'Vote cast for organization org-1',
          metadata: undefined,
        },
      });
    });

    it('should create an audit log entry with optional metadata', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-2' });

      await log({
        actorId: 'admin-1',
        actionType: 'USER_CREATED',
        details: 'Created user with NIM 12345',
        metadata: { nim: '12345', role: 'VOTER' },
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 'admin-1',
          actionType: 'USER_CREATED',
          details: 'Created user with NIM 12345',
          metadata: { nim: '12345', role: 'VOTER' },
        },
      });
    });

    it('should propagate errors from the database', async () => {
      mockPrisma.auditLog.create.mockRejectedValue(new Error('DB error'));

      await expect(
        log({
          actorId: 'user-1',
          actionType: 'VOTE_CAST',
          details: 'Vote cast',
        })
      ).rejects.toThrow('DB error');
    });
  });

  describe('getEntries', () => {
    const mockEntries = [
      {
        id: 'log-3',
        actorId: 'user-1',
        actionType: 'VOTE_CAST',
        details: 'Vote cast for org-1',
        metadata: null,
        createdAt: new Date('2024-01-15T10:00:00Z'),
      },
      {
        id: 'log-2',
        actorId: 'admin-1',
        actionType: 'USER_CREATED',
        details: 'Created user',
        metadata: null,
        createdAt: new Date('2024-01-14T10:00:00Z'),
      },
      {
        id: 'log-1',
        actorId: 'user-1',
        actionType: 'USER_LOGIN',
        details: 'User logged in',
        metadata: null,
        createdAt: new Date('2024-01-13T10:00:00Z'),
      },
    ];

    it('should return paginated entries ordered by createdAt desc (newest first)', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue(mockEntries);
      mockPrisma.auditLog.count.mockResolvedValue(3);

      const result = await getEntries({});

      expect(result).toEqual({
        data: mockEntries,
        total: 3,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      });
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should filter by actionType', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([mockEntries[0]]);
      mockPrisma.auditLog.count.mockResolvedValue(1);

      const result = await getEntries({ actionType: 'VOTE_CAST' });

      expect(result.data).toHaveLength(1);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { actionType: 'VOTE_CAST' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should filter by actorId', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([mockEntries[0], mockEntries[2]]);
      mockPrisma.auditLog.count.mockResolvedValue(2);

      const result = await getEntries({ actorId: 'user-1' });

      expect(result.data).toHaveLength(2);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { actorId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should filter by date range (startDate and endDate)', async () => {
      const startDate = new Date('2024-01-14T00:00:00Z');
      const endDate = new Date('2024-01-15T23:59:59Z');

      mockPrisma.auditLog.findMany.mockResolvedValue([mockEntries[0], mockEntries[1]]);
      mockPrisma.auditLog.count.mockResolvedValue(2);

      const result = await getEntries({ startDate, endDate });

      expect(result.data).toHaveLength(2);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { createdAt: { gte: startDate, lte: endDate } },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should filter by startDate only', async () => {
      const startDate = new Date('2024-01-14T00:00:00Z');

      mockPrisma.auditLog.findMany.mockResolvedValue([mockEntries[0], mockEntries[1]]);
      mockPrisma.auditLog.count.mockResolvedValue(2);

      const result = await getEntries({ startDate });

      expect(result.data).toHaveLength(2);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { createdAt: { gte: startDate } },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should filter by endDate only', async () => {
      const endDate = new Date('2024-01-14T23:59:59Z');

      mockPrisma.auditLog.findMany.mockResolvedValue([mockEntries[1], mockEntries[2]]);
      mockPrisma.auditLog.count.mockResolvedValue(2);

      const result = await getEntries({ endDate });

      expect(result.data).toHaveLength(2);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { createdAt: { lte: endDate } },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should combine multiple filters', async () => {
      const startDate = new Date('2024-01-14T00:00:00Z');

      mockPrisma.auditLog.findMany.mockResolvedValue([mockEntries[0]]);
      mockPrisma.auditLog.count.mockResolvedValue(1);

      const result = await getEntries({
        actionType: 'VOTE_CAST',
        actorId: 'user-1',
        startDate,
      });

      expect(result.data).toHaveLength(1);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          actionType: 'VOTE_CAST',
          actorId: 'user-1',
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should respect custom pagination parameters', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([mockEntries[1]]);
      mockPrisma.auditLog.count.mockResolvedValue(3);

      const result = await getEntries({ page: 2, pageSize: 1 });

      expect(result).toEqual({
        data: [mockEntries[1]],
        total: 3,
        page: 2,
        pageSize: 1,
        totalPages: 3,
      });
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        skip: 1,
        take: 1,
      });
    });

    it('should return empty results when no entries match', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      const result = await getEntries({ actionType: 'USER_LOGOUT' });

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      });
    });
  });

  describe('immutability', () => {
    it('should NOT expose any update method', async () => {
      const auditService = await import('./audit.service');
      expect('update' in auditService).toBe(false);
      expect('updateEntry' in auditService).toBe(false);
    });

    it('should NOT expose any delete method', async () => {
      const auditService = await import('./audit.service');
      expect('delete' in auditService).toBe(false);
      expect('deleteEntry' in auditService).toBe(false);
      expect('remove' in auditService).toBe(false);
    });
  });
});
