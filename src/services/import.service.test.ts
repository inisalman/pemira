import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to define mocks that can be referenced in vi.mock factories
const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  organization: {
    findMany: vi.fn(),
  },
  voterAccess: {
    createMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn((password: string) => Promise.resolve(`hashed_${password}`)),
  },
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

import { readFileSync } from 'fs';
import { parseCsv, parseXlsx, bulkImport, importFromCsv } from './import.service';

describe('Import Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(
      (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma)
    );
  });

  describe('parseCsv', () => {
    it('should parse valid CSV content', () => {
      const csv = 'nim,name,password,organizations\n12345,John Doe,pass123,BEM\n67890,Jane Doe,pass456,MPM';
      const rows = parseCsv(csv);

      expect(rows).toHaveLength(2);
      expect(rows[0]).toEqual({
        nim: '12345',
        name: 'John Doe',
        department: '',
        password: 'pass123',
        role: 'VOTER',
        organizations: 'BEM',
      });
      expect(rows[1]).toEqual({
        nim: '67890',
        name: 'Jane Doe',
        department: '',
        password: 'pass456',
        role: 'VOTER',
        organizations: 'MPM',
      });
    });

    it('should parse role column when present', () => {
      const csv = 'nim,name,password,role,organizations\nadmin2,Admin Dua,secret123,ADMIN,';
      const rows = parseCsv(csv);

      expect(rows).toEqual([
        {
          nim: 'admin2',
          name: 'Admin Dua',
          department: '',
          password: 'secret123',
          role: 'ADMIN',
          organizations: '',
        },
      ]);
    });

    it('should handle quoted fields with commas', () => {
      const csv = 'nim,name,password,organizations\n12345,John Doe,pass123,"BEM,MPM"';
      const rows = parseCsv(csv);

      expect(rows).toHaveLength(1);
      expect(rows[0].organizations).toBe('BEM,MPM');
    });

    it('should return empty array for empty content', () => {
      expect(parseCsv('')).toEqual([]);
      expect(parseCsv('\n')).toEqual([]);
    });

    it('should return empty array for header-only content', () => {
      expect(parseCsv('nim,name,password,organizations')).toEqual([]);
    });

    it('should return empty array if required headers are missing', () => {
      const csv = 'nim,name,password\n12345,John,pass';
      expect(parseCsv(csv)).toEqual([]);
    });

    it('should handle Windows-style line endings', () => {
      const csv = 'nim,name,password,organizations\r\n12345,John Doe,pass123,BEM\r\n';
      const rows = parseCsv(csv);

      expect(rows).toHaveLength(1);
      expect(rows[0].nim).toBe('12345');
    });

    it('should trim whitespace from values', () => {
      const csv = 'nim,name,password,organizations\n  12345 , John Doe , pass123 , BEM ';
      const rows = parseCsv(csv);

      expect(rows[0].nim).toBe('12345');
      expect(rows[0].name).toBe('John Doe');
      expect(rows[0].password).toBe('pass123');
      expect(rows[0].organizations).toBe('BEM');
    });
  });

  describe('parseXlsx', () => {
    it('should parse the Excel import template', () => {
      const file = readFileSync('public/templates/user-import-template.xlsx');
      const rows = parseXlsx(file);

      expect(rows).toHaveLength(4);
      expect(rows[0]).toEqual({
        nim: '240001',
        name: 'Contoh Mahasiswa',
        department: 'Keperawatan',
        password: 'ubah-password-ini',
        role: 'VOTER',
        organizations: 'BEM',
      });
      expect(rows[3]).toEqual({
        nim: 'admin2',
        name: 'Contoh Admin',
        department: 'Manajemen',
        password: 'ubah-password-ini',
        role: 'ADMIN',
        organizations: '',
      });
    });
  });

  describe('bulkImport', () => {
    it('should successfully import valid rows', async () => {
      const rows = [
        { nim: '12345', name: 'John', password: 'pass123', organizations: 'BEM' },
      ];

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.organization.findMany.mockResolvedValue([{ id: 'org-1' }]);
      mockPrisma.user.create.mockResolvedValue({ id: 'user-1', nim: '12345' });
      mockPrisma.voterAccess.createMany.mockResolvedValue({ count: 1 });

      const result = await bulkImport(rows);

      expect(result.totalRows).toBe(1);
      expect(result.successCount).toBe(1);
      expect(result.failedRows).toHaveLength(0);
    });

    it('should import admin rows without organization access', async () => {
      const rows = [
        { nim: 'admin2', name: 'Admin Dua', password: 'secret123', role: 'ADMIN' as const, organizations: '' },
      ];

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 'user-1', nim: 'admin2' });

      const result = await bulkImport(rows);

      expect(result.successCount).toBe(1);
      expect(mockPrisma.voterAccess.createMany).not.toHaveBeenCalled();
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          nim: 'admin2',
          name: 'Admin Dua',
          department: '',
          password: 'hashed_secret123',
          role: 'ADMIN',
        },
      });
    });

    it('should reject rows with missing required fields', async () => {
      const rows = [
        { nim: '', name: 'John', password: 'pass123', organizations: 'BEM' },
      ];

      const result = await bulkImport(rows);

      expect(result.totalRows).toBe(1);
      expect(result.successCount).toBe(0);
      expect(result.failedRows).toHaveLength(1);
      expect(result.failedRows[0].row).toBe(1);
      expect(result.failedRows[0].reason.length).toBeGreaterThan(0);
    });

    it('should reject intra-file duplicate NIMs', async () => {
      const rows = [
        { nim: '12345', name: 'John', password: 'pass123', organizations: 'BEM' },
        { nim: '12345', name: 'Jane', password: 'pass456', organizations: 'MPM' },
      ];

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.organization.findMany.mockResolvedValue([{ id: 'org-1' }]);
      mockPrisma.user.create.mockResolvedValue({ id: 'user-1', nim: '12345' });
      mockPrisma.voterAccess.createMany.mockResolvedValue({ count: 1 });

      const result = await bulkImport(rows);

      expect(result.totalRows).toBe(2);
      expect(result.successCount).toBe(1);
      expect(result.failedRows).toHaveLength(1);
      expect(result.failedRows[0].row).toBe(2);
      expect(result.failedRows[0].reason).toBe('NIM duplikat dalam file');
    });

    it('should reject rows with NIM already in database', async () => {
      const rows = [
        { nim: '12345', name: 'John', password: 'pass123', organizations: 'BEM' },
      ];

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user', nim: '12345' });

      const result = await bulkImport(rows);

      expect(result.totalRows).toBe(1);
      expect(result.successCount).toBe(0);
      expect(result.failedRows).toHaveLength(1);
      expect(result.failedRows[0].reason).toBe('NIM sudah terdaftar');
    });

    it('should reject rows with unresolvable organizations', async () => {
      const rows = [
        { nim: '12345', name: 'John', password: 'pass123', organizations: 'INVALID_ORG' },
      ];

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.organization.findMany.mockResolvedValue([]);

      const result = await bulkImport(rows);

      expect(result.totalRows).toBe(1);
      expect(result.successCount).toBe(0);
      expect(result.failedRows).toHaveLength(1);
      expect(result.failedRows[0].reason).toBe('Organisasi tidak ditemukan');
    });

    it('should handle transaction failures gracefully', async () => {
      const rows = [
        { nim: '12345', name: 'John', password: 'pass123', organizations: 'BEM' },
      ];

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.organization.findMany.mockResolvedValue([{ id: 'org-1' }]);
      mockPrisma.$transaction.mockRejectedValue(new Error('DB error'));

      const result = await bulkImport(rows);

      expect(result.totalRows).toBe(1);
      expect(result.successCount).toBe(0);
      expect(result.failedRows).toHaveLength(1);
      expect(result.failedRows[0].reason).toBe('Gagal menyimpan data');
    });

    it('should satisfy totalRows = successCount + failedRows.length', async () => {
      const rows = [
        { nim: '11111', name: 'User 1', password: 'pass1', organizations: 'BEM' },
        { nim: '22222', name: 'User 2', password: 'pass2', organizations: 'BEM' },
        { nim: '', name: 'User 3', password: 'pass3', organizations: 'BEM' },
      ];

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.organization.findMany.mockResolvedValue([{ id: 'org-1' }]);
      mockPrisma.user.create.mockResolvedValue({ id: 'user-1' });
      mockPrisma.voterAccess.createMany.mockResolvedValue({ count: 1 });

      const result = await bulkImport(rows);

      expect(result.totalRows).toBe(result.successCount + result.failedRows.length);
    });
  });

  describe('importFromCsv', () => {
    it('should return empty result for empty content', async () => {
      const result = await importFromCsv('');

      expect(result.totalRows).toBe(0);
      expect(result.successCount).toBe(0);
      expect(result.failedRows).toHaveLength(0);
    });

    it('should parse and import valid CSV', async () => {
      const csv = 'nim,name,password,organizations\n12345,John Doe,pass123,BEM';

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.organization.findMany.mockResolvedValue([{ id: 'org-1' }]);
      mockPrisma.user.create.mockResolvedValue({ id: 'user-1', nim: '12345' });
      mockPrisma.voterAccess.createMany.mockResolvedValue({ count: 1 });

      const result = await importFromCsv(csv);

      expect(result.totalRows).toBe(1);
      expect(result.successCount).toBe(1);
      expect(result.failedRows).toHaveLength(0);
    });
  });
});
