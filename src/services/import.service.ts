import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { csvRowSchema } from '@/lib/validators';
import type { ImportResult } from '@/types';

interface ParsedRow {
  nim: string;
  name: string;
  password: string;
  organizations: string;
}

/**
 * Parses CSV content into an array of row objects.
 * Expects headers: nim, name, password, organizations
 * Organizations column contains comma-separated org names or IDs.
 */
export function parseCsv(content: string): ParsedRow[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const nimIdx = headers.indexOf('nim');
  const nameIdx = headers.indexOf('name');
  const passwordIdx = headers.indexOf('password');
  const orgsIdx = headers.indexOf('organizations');

  if (nimIdx === -1 || nameIdx === -1 || passwordIdx === -1 || orgsIdx === -1) {
    return [];
  }

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    rows.push({
      nim: (values[nimIdx] || '').trim(),
      name: (values[nameIdx] || '').trim(),
      password: (values[passwordIdx] || '').trim(),
      organizations: (values[orgsIdx] || '').trim(),
    });
  }

  return rows;
}

/**
 * Parses a single CSV line, handling quoted fields that may contain commas.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Resolves organization identifiers (names or IDs) to actual organization IDs.
 * Returns an array of valid organization IDs.
 */
async function resolveOrganizations(orgString: string): Promise<string[]> {
  const orgIdentifiers = orgString
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o !== '');

  if (orgIdentifiers.length === 0) return [];

  // Try to find organizations by name or ID
  const organizations = await prisma.organization.findMany({
    where: {
      OR: [
        { name: { in: orgIdentifiers } },
        { id: { in: orgIdentifiers } },
      ],
    },
    select: { id: true },
  });

  return organizations.map((org) => org.id);
}

/**
 * Performs bulk import of users from parsed CSV rows.
 * For each row:
 * 1. Validates required fields
 * 2. Checks for duplicate NIM (within file and database)
 * 3. Creates user with hashed password and VoterAccess records in a transaction
 * 4. Reports failures with reasons
 */
export async function bulkImport(rows: ParsedRow[]): Promise<ImportResult> {
  const result: ImportResult = {
    totalRows: rows.length,
    successCount: 0,
    failedRows: [],
  };

  // Track NIMs seen within this import batch for intra-file duplicate detection
  const seenNims = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 1; // 1-based row number (excluding header)

    // Validate required fields using Zod schema
    const validation = csvRowSchema.safeParse(row);
    if (!validation.success) {
      const reason = validation.error.issues.map((e) => e.message).join('; ');
      result.failedRows.push({ row: rowNumber, nim: row.nim || '', reason });
      continue;
    }

    // Check for intra-file duplicate NIM
    if (seenNims.has(row.nim)) {
      result.failedRows.push({
        row: rowNumber,
        nim: row.nim,
        reason: 'NIM duplikat dalam file',
      });
      continue;
    }
    seenNims.add(row.nim);

    // Check for existing NIM in database
    const existingUser = await prisma.user.findUnique({
      where: { nim: row.nim },
    });
    if (existingUser) {
      result.failedRows.push({
        row: rowNumber,
        nim: row.nim,
        reason: 'NIM sudah terdaftar',
      });
      continue;
    }

    // Resolve organization identifiers to IDs
    const organizationIds = await resolveOrganizations(row.organizations);
    if (organizationIds.length === 0) {
      result.failedRows.push({
        row: rowNumber,
        nim: row.nim,
        reason: 'Organisasi tidak ditemukan',
      });
      continue;
    }

    // Create user and VoterAccess records in a transaction
    try {
      await prisma.$transaction(async (tx) => {
        const hashedPassword = await bcrypt.hash(row.password, 10);
        const user = await tx.user.create({
          data: {
            nim: row.nim,
            name: row.name,
            password: hashedPassword,
            role: 'VOTER',
          },
        });

        // Create VoterAccess records for each organization
        await tx.voterAccess.createMany({
          data: organizationIds.map((orgId) => ({
            userId: user.id,
            organizationId: orgId,
          })),
        });
      });
      result.successCount++;
    } catch {
      result.failedRows.push({
        row: rowNumber,
        nim: row.nim,
        reason: 'Gagal menyimpan data',
      });
    }
  }

  return result;
}

/**
 * Main entry point for bulk import from file content.
 * Parses CSV and runs the import process.
 */
export async function importFromCsv(content: string): Promise<ImportResult> {
  const rows = parseCsv(content);

  if (rows.length === 0) {
    return {
      totalRows: 0,
      successCount: 0,
      failedRows: [],
    };
  }

  return bulkImport(rows);
}
