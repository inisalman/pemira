import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CreateUserInput, UpdateUserInput } from '@/types';

// Use vi.hoisted to define mocks that can be referenced in vi.mock factories
const mockPrisma = vi.hoisted(() => ({
  user: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  voterAccess: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
  vote: {
    count: vi.fn(),
  },
  $transaction: vi.fn(),
}));

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn((password: string) => Promise.resolve(`hashed_${password}`)),
    compare: vi.fn((plain: string, hash: string) =>
      Promise.resolve(hash === `hashed_${plain}`)
    ),
  },
}));

// Mock hash utility
vi.mock('@/lib/hash', () => ({
  generateVoterHash: vi.fn((userId: string, orgId: string) => `hash_${userId}_${orgId}`),
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

import { createUser, getUsers, updateUser, deleteUser } from './user.service';

describe('User Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup $transaction to execute the callback with mockPrisma
    mockPrisma.$transaction.mockImplementation(
      (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma)
    );
  });

  describe('createUser', () => {
    it('should create a user with hashed password', async () => {
      const input: CreateUserInput = {
        nim: '12345',
        name: 'Test User',
        password: 'password123',
        role: 'VOTER',
      };

      const expectedUser = {
        id: 'user-1',
        nim: '12345',
        name: 'Test User',
        password: 'hashed_password123',
        role: 'VOTER',
        voterAccess: [],
      };

      mockPrisma.user.create.mockResolvedValue(expectedUser);

      const result = await createUser(input);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          nim: '12345',
          name: 'Test User',
          password: 'hashed_password123',
          role: 'VOTER',
        },
        include: { voterAccess: true },
      });
      expect(result).toEqual(expectedUser);
    });

    it('should create a user with VoterAccess records when organizationIds provided', async () => {
      const input: CreateUserInput = {
        nim: '12345',
        name: 'Test User',
        password: 'password123',
        role: 'VOTER',
        organizationIds: ['org-1', 'org-2'],
      };

      const expectedUser = {
        id: 'user-1',
        nim: '12345',
        name: 'Test User',
        password: 'hashed_password123',
        role: 'VOTER',
        voterAccess: [
          { id: 'va-1', userId: 'user-1', organizationId: 'org-1' },
          { id: 'va-2', userId: 'user-1', organizationId: 'org-2' },
        ],
      };

      mockPrisma.user.create.mockResolvedValue(expectedUser);

      const result = await createUser(input);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          nim: '12345',
          name: 'Test User',
          password: 'hashed_password123',
          role: 'VOTER',
          voterAccess: {
            create: [
              { organizationId: 'org-1' },
              { organizationId: 'org-2' },
            ],
          },
        },
        include: { voterAccess: true },
      });
      expect(result.voterAccess).toHaveLength(2);
    });
  });

  describe('getUsers', () => {
    it('should return paginated results', async () => {
      const users = [
        { id: 'user-1', nim: '111', name: 'User 1', role: 'VOTER', voterAccess: [] },
        { id: 'user-2', nim: '222', name: 'User 2', role: 'VOTER', voterAccess: [] },
      ];

      mockPrisma.user.findMany.mockResolvedValue(users);
      mockPrisma.user.count.mockResolvedValue(5);

      const result = await getUsers({ page: 1, pageSize: 2 });

      expect(result.data).toEqual(users);
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(2);
      expect(result.totalPages).toBe(3);
    });

    it('should apply search filter on nim and name', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await getUsers({ page: 1, pageSize: 10, search: 'john' });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { nim: { contains: 'john', mode: 'insensitive' } },
              { name: { contains: 'john', mode: 'insensitive' } },
            ],
          },
        })
      );
    });

    it('should apply role filter', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await getUsers({ page: 1, pageSize: 10, role: 'ADMIN' });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: 'ADMIN' },
        })
      );
    });

    it('should apply both search and role filter', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await getUsers({ page: 1, pageSize: 10, search: 'test', role: 'VOTER' });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { nim: { contains: 'test', mode: 'insensitive' } },
              { name: { contains: 'test', mode: 'insensitive' } },
            ],
            role: 'VOTER',
          },
        })
      );
    });
  });

  describe('updateUser', () => {
    it('should update user fields', async () => {
      const updatedUser = {
        id: 'user-1',
        nim: '12345',
        name: 'Updated Name',
        role: 'VOTER',
        voterAccess: [],
      };

      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await updateUser('user-1', { name: 'Updated Name' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'Updated Name' },
        include: { voterAccess: true },
      });
      expect(result.name).toBe('Updated Name');
    });

    it('should hash password when updating password', async () => {
      const updatedUser = {
        id: 'user-1',
        nim: '12345',
        name: 'User',
        password: 'hashed_newpass',
        role: 'VOTER',
        voterAccess: [],
      };

      mockPrisma.user.update.mockResolvedValue(updatedUser);

      await updateUser('user-1', { password: 'newpass' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { password: 'hashed_newpass' },
        include: { voterAccess: true },
      });
    });

    it('should replace VoterAccess records when organizationIds provided', async () => {
      const input: UpdateUserInput = {
        name: 'Updated',
        organizationIds: ['org-3'],
      };

      const updatedUser = {
        id: 'user-1',
        nim: '12345',
        name: 'Updated',
        role: 'VOTER',
        voterAccess: [{ id: 'va-3', userId: 'user-1', organizationId: 'org-3' }],
      };

      mockPrisma.user.findUniqueOrThrow.mockResolvedValue(updatedUser);

      const result = await updateUser('user-1', input);

      expect(mockPrisma.voterAccess.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(mockPrisma.voterAccess.createMany).toHaveBeenCalledWith({
        data: [{ userId: 'user-1', organizationId: 'org-3' }],
      });
      expect(result.voterAccess).toHaveLength(1);
    });
  });

  describe('deleteUser', () => {
    it('should reject deletion if user has votes', async () => {
      mockPrisma.voterAccess.findMany.mockResolvedValue([
        { organizationId: 'org-1' },
      ]);
      mockPrisma.vote.count.mockResolvedValue(1);

      const result = await deleteUser('user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Tidak dapat menghapus user yang sudah memilih');
      expect(mockPrisma.user.delete).not.toHaveBeenCalled();
    });

    it('should delete user if no votes exist', async () => {
      mockPrisma.voterAccess.findMany.mockResolvedValue([
        { organizationId: 'org-1' },
      ]);
      mockPrisma.vote.count.mockResolvedValue(0);

      const result = await deleteUser('user-1');

      expect(result.success).toBe(true);
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('should delete user with no VoterAccess records', async () => {
      mockPrisma.voterAccess.findMany.mockResolvedValue([]);

      const result = await deleteUser('user-1');

      expect(result.success).toBe(true);
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });
  });
});
