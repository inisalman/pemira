import bcrypt from 'bcryptjs';
import { inflateRawSync } from 'zlib';
import { prisma } from '@/lib/prisma';
import { csvRowSchema } from '@/lib/validators';
import type { ImportResult } from '@/types';

interface ParsedRow {
  nim: string;
  name: string;
  department?: string;
  password: string;
  role?: 'ADMIN' | 'VOTER' | '';
  organizations: string;
}

/**
 * Parses CSV content into an array of row objects.
 * Expects headers: nim, name, department, password, role, organizations
 * Role is optional and defaults to VOTER for older CSV files.
 * Organizations column contains comma-separated org names or IDs.
 */
export function parseCsv(content: string): ParsedRow[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const nimIdx = headers.indexOf('nim');
  const nameIdx = headers.indexOf('name');
  const departmentIdx = headers.indexOf('department');
  const passwordIdx = headers.indexOf('password');
  const roleIdx = headers.indexOf('role');
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
      department: departmentIdx === -1 ? '' : (values[departmentIdx] || '').trim(),
      password: (values[passwordIdx] || '').trim(),
      role: roleIdx === -1 ? 'VOTER' : normalizeRole(values[roleIdx]),
      organizations: (values[orgsIdx] || '').trim(),
    });
  }

  return rows;
}

export function parseXlsx(buffer: Buffer): ParsedRow[] {
  const entries = readZipEntries(buffer);
  const workbookXml = entries.get('xl/workbook.xml')?.toString('utf8') ?? '';
  const workbookRelsXml =
    entries.get('xl/_rels/workbook.xml.rels')?.toString('utf8') ?? '';
  const sheetPath = resolveFirstWorksheetPath(workbookXml, workbookRelsXml);
  const sheetXml = entries.get(sheetPath)?.toString('utf8') ?? '';

  if (!sheetXml) return [];

  const sharedStringsXml = entries.get('xl/sharedStrings.xml')?.toString('utf8') ?? '';
  const sharedStrings = parseSharedStrings(sharedStringsXml);
  const table = parseWorksheetRows(sheetXml, sharedStrings);

  if (table.length < 2) return [];

  const headers = table[0].map((h) => h.trim().toLowerCase());
  const nimIdx = headers.indexOf('nim');
  const nameIdx = headers.indexOf('name');
  const departmentIdx = headers.indexOf('department');
  const passwordIdx = headers.indexOf('password');
  const roleIdx = headers.indexOf('role');
  const orgsIdx = headers.indexOf('organizations');

  if (nimIdx === -1 || nameIdx === -1 || passwordIdx === -1 || orgsIdx === -1) {
    return [];
  }

  return table
    .slice(1)
    .filter((row) => row.some((value) => value.trim() !== ''))
    .map((values) => ({
      nim: (values[nimIdx] || '').trim(),
      name: (values[nameIdx] || '').trim(),
      department: departmentIdx === -1 ? '' : (values[departmentIdx] || '').trim(),
      password: (values[passwordIdx] || '').trim(),
      role: roleIdx === -1 ? 'VOTER' : normalizeRole(values[roleIdx]),
      organizations: (values[orgsIdx] || '').trim(),
    }));
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

function normalizeRole(value: string | undefined): 'ADMIN' | 'VOTER' | '' {
  const role = (value || '').trim().toUpperCase();
  if (!role) return 'VOTER';
  if (role === 'ADMIN' || role === 'VOTER') return role;
  return '';
}

function readZipEntries(buffer: Buffer): Map<string, Buffer> {
  const entries = new Map<string, Buffer>();
  const eocdOffset = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocdOffset === -1) return entries;

  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  let offset = centralDirectoryOffset;

  for (let i = 0; i < totalEntries; i++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;

    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer
      .subarray(offset + 46, offset + 46 + fileNameLength)
      .toString('utf8');

    const localFileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localFileNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);

    if (compressionMethod === 0) {
      entries.set(fileName, compressed);
    } else if (compressionMethod === 8) {
      entries.set(fileName, inflateRawSync(compressed));
    }

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function resolveFirstWorksheetPath(workbookXml: string, relsXml: string) {
  const sheetMatch = workbookXml.match(/<[^:\s>]*:?sheet\b[^>]*r:id="([^"]+)"/);
  const relId = sheetMatch?.[1];
  if (!relId) return 'xl/worksheets/sheet1.xml';

  const relPattern = new RegExp(`<Relationship[^>]*Id="${escapeRegExp(relId)}"[^>]*Target="([^"]+)"`);
  const relMatch = relsXml.match(relPattern);
  const target = relMatch?.[1] ?? 'worksheets/sheet1.xml';
  return target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`;
}

function parseSharedStrings(xml: string) {
  const strings: string[] = [];
  for (const match of xml.matchAll(/<[^:\s>]*:?si\b[\s\S]*?<\/[^:\s>]*:?si>/g)) {
    strings.push(readTextNodes(match[0]));
  }
  return strings;
}

function parseWorksheetRows(xml: string, sharedStrings: string[]) {
  const rows: string[][] = [];

  for (const rowMatch of xml.matchAll(/<[^:\s>]*:?row\b[^>]*>([\s\S]*?)<\/[^:\s>]*:?row>/g)) {
    const rowValues: string[] = [];

    for (const cellMatch of rowMatch[0].matchAll(/<[^:\s>]*:?c\b([^>]*)(?:>([\s\S]*?)<\/[^:\s>]*:?c>|\/>)/g)) {
      const attrs = cellMatch[1];
      const body = cellMatch[2] ?? '';
      const ref = attrs.match(/\br="([A-Z]+)\d+"/)?.[1] ?? '';
      const colIdx = columnNameToIndex(ref);
      const type = attrs.match(/\bt="([^"]+)"/)?.[1] ?? '';
      const value = body.match(/<[^:\s>]*:?v>([\s\S]*?)<\/[^:\s>]*:?v>/)?.[1] ?? '';

      while (rowValues.length <= colIdx) rowValues.push('');

      if (type === 's') {
        rowValues[colIdx] = sharedStrings[Number(value)] ?? '';
      } else if (type === 'inlineStr') {
        rowValues[colIdx] = readTextNodes(body);
      } else {
        rowValues[colIdx] = decodeXml(value);
      }
    }

    rows.push(rowValues);
  }

  return rows;
}

function readTextNodes(xml: string) {
  return Array.from(xml.matchAll(/<[^:\s>]*:?t\b[^>]*>([\s\S]*?)<\/[^:\s>]*:?t>/g))
    .map((match) => decodeXml(match[1]))
    .join('');
}

function decodeXml(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function columnNameToIndex(column: string) {
  let index = 0;
  for (const char of column) {
    index = index * 26 + char.charCodeAt(0) - 64;
  }
  return Math.max(index - 1, 0);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    const role = validation.data.role ?? 'VOTER';

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

    // Resolve organization identifiers to IDs. VOTER rows require at least one org.
    const organizationIds =
      role === 'VOTER' ? await resolveOrganizations(row.organizations) : [];
    if (role === 'VOTER' && organizationIds.length === 0) {
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
            department: row.department ?? '',
            password: hashedPassword,
            role,
          },
        });

        // Create VoterAccess records for each organization
        if (organizationIds.length > 0) {
          await tx.voterAccess.createMany({
            data: organizationIds.map((orgId) => ({
              userId: user.id,
              organizationId: orgId,
            })),
          });
        }
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

export async function importFromXlsx(buffer: Buffer): Promise<ImportResult> {
  const rows = parseXlsx(buffer);

  if (rows.length === 0) {
    return {
      totalRows: 0,
      successCount: 0,
      failedRows: [],
    };
  }

  return bulkImport(rows);
}
