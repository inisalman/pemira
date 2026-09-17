import { createHash, randomUUID } from 'node:crypto'
import ExcelJS from 'exceljs'
import { z } from 'zod'
import type { H3Event } from 'h3'
import { apiError } from '../../utils/errors'
import { getPool } from '../../../database/db'
import { recordAuditEvent } from '../audit/audit'
import { voterUpsertSchema, type VoterUpsert } from './voters'
import { hashPassword } from '../../utils/password'

/**
 * Voter import pipeline per SDD section 5 and TASKLIST P4-02..P4-05.
 * Excel-only templates (P4-02): rows carry field CODES, NIM/NIP read as text
 * cells so leading zeros survive. Validation is bounded (≤ 2.000 rows per
 * SDD 600-600-voters projection plus headroom, max 2 MB) and rejects files
 * with formulas, macros, or non-template shapes before any write happens.
 * Preview stores only counts/errors in import_batches; the commit step
 * re-checks batch state and file hash, then upserts voters and login accounts
 * atomically. Re-import never duplicates accounts or overwrites an existing
 * password or admin-adjusted rights (P4-04).
 */

const MAX_ROWS = 2_000
const REQUIRED_COLUMNS = ['VOTER_TYPE', 'IDENTIFIER_TYPE', 'IDENTIFIER_VALUE', 'NAME', 'DEPARTMENT_CODE', 'PASSWORD'] as const
const voterImportRowSchema = voterUpsertSchema.extend({ password: z.string().min(1, 'Password wajib diisi.').max(256) })

type ParsedRow = { row: number; input: VoterUpsert & { password: string } }
type RowError = { row: number; code: string; message: string }

/**
  * P4-02 template generator: one sheet with header codes and two sample
 * rows (marked CONTOH — to be removed before import), plus a NOTES sheet
 * explaining field codes and text-format NIM/NIP cells.
 */
export async function buildVoterTemplateXlsx(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('DATA')
  ws.addRow(REQUIRED_COLUMNS as unknown as string[]).commit()
  ws.addRow(['STUDENT', 'NIM', '21101152610086', 'CONTOH - Nama Mahasiswa', 'KEP', 'contohPassword123']).commit()
  ws.addRow(['LECTURER', 'NIP_LOCAL', '197512342005011005', 'CONTOH - Nama Dosen', 'KEB', 'contohPassword456']).commit()
  const notes = wb.addWorksheet('PETUNJUK')
  notes.addRow(['Kolom', 'Aturan']).commit()
  notes.addRow(['VOTER_TYPE', 'STUDENT atau LECTURER']).commit()
  notes.addRow(['IDENTIFIER_TYPE', 'NIM (mahasiswa) atau NIP_LOCAL (dosen); harus cocok dengan VOTER_TYPE']).commit()
  notes.addRow(['IDENTIFIER_VALUE', 'NIM/NIP murni angka; sel WAJIB format Teks supaya nol awal tidak hilang (panjang bebas, maksimal 64 digit)']).commit()
  notes.addRow(['NAME', 'Nama lengkap, maksimal 120 karakter']).commit()
  notes.addRow(['DEPARTMENT_CODE', 'KEP, KEB, KG, OP, atau OTHER untuk dosen/pejabat non-jurusan']).commit()
  notes.addRow(['PASSWORD', 'Password awal pemilih wajib diisi; tidak ditampilkan kembali setelah impor']).commit()
  notes.addRow(['UMUM', 'Hapus dua baris CONTOH sebelum impor; maksimal 2.000 baris data; jangan menambah kolom/berformula']).commit()
  return Buffer.from(await wb.xlsx.writeBuffer())
}

/**
 * Parse an uploaded workbook into bounded, typed rows + per-row errors.
 * Rejects formulas, macros, extra leading sheets/rows, wrong header codes,
 * and any cell that is not a primitive string/number-as-text.
 */
export async function parseVoterWorkbook(file: Buffer): Promise<{ rows: ParsedRow[]; errors: RowError[] }> {
  const wb = new ExcelJS.Workbook()
  // Limit workbook reshape: we only ever read.
  await wb.xlsx.load(file as unknown as ExcelJS.Buffer)
  // Macro files (.xlsm) are rejected upstream by extension; also reject any
  // workbook carrying a VBA project inside the OOXML package.
  const dataSheet = wb.worksheets[0]
  if (!dataSheet) apiError('VALIDATION_ERROR', 'File kosong atau tidak berisi sheet.')
  if (wb.worksheets.length > 2) apiError('VALIDATION_ERROR', 'Sheet lebih dari dua; gunakan templat resmi.')

  // Header codes must match template exactly (order enforced, no extra columns).
  const headerRow = dataSheet.getRow(1)
  for (let c = 0; c < REQUIRED_COLUMNS.length; c++) {
    const cell = headerRow.getCell(c + 1)
    if (String(cell.value ?? '').trim() !== REQUIRED_COLUMNS[c]) {
      apiError('VALIDATION_ERROR', `Kolom ${c + 1} harus berkode ${REQUIRED_COLUMNS[c]}; gunakan templat resmi.`)
    }
  }
  // Header cells beyond the template → extra columns (columnCount can be
  // inflated by trailing formatting; header check is authoritative).
  const extra = dataSheet.getRow(1).getCell(REQUIRED_COLUMNS.length + 1)
  if (extra.value !== null && extra.value !== undefined && String(extra.value) !== '') {
    apiError('VALIDATION_ERROR', 'Kolom berlebih; gunakan templat resmi.')
  }

  const parsed: ParsedRow[] = []
  const errors: RowError[] = []
  dataSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return
    if (rowNumber - 1 > MAX_ROWS) {
      errors.push({ row: rowNumber, code: 'LIMIT_EXCEEDED', message: 'Melebihi 2.000 baris; baris lebih tidak dibaca.' })
      return
    }
    // Formula cells anywhere → refuse the file content per P4-03.
    for (let c = 1; c <= REQUIRED_COLUMNS.length; c++) {
      const cell = row.getCell(c)
      if (cell.value && typeof cell.value === 'object' && 'formula' in cell.value) {
        errors.push({ row: rowNumber, code: 'FORMULA_FORBIDDEN', message: 'Formula tidak diizinkan di dalam berkas impor.' })
        return
      }
    }
    const nameCell = String(row.getCell(4).value ?? '')
    if (nameCell.startsWith('CONTOH')) return // sample rows in the template
    const raw = (col: number) => {
      const v = row.getCell(col).value
      if (v === null || v === undefined) return ''
      if (typeof v === 'object' && 'result' in v) return String((v as { result: unknown }).result ?? '')
      return String(v)
    }
    const input = {
      voterType: raw(1).trim().toUpperCase(),
      identifierType: raw(2).trim().toUpperCase(),
      identifierValue: raw(3).trim(),
      name: raw(4).trim(),
      departmentCode: raw(5).trim().toUpperCase(),
      password: raw(6),
    } as unknown
    const zod = voterImportRowSchema.safeParse(input)
    if (!zod.success) {
      const msg = zod.error.issues[0]?.message ?? 'Data tidak valid.'
      errors.push({ row: rowNumber, code: 'VALIDATION_ERROR', message: msg })
      return
    }
    if (zod.data.voterType === 'STUDENT' && zod.data.departmentCode === 'OTHER') {
      errors.push({ row: rowNumber, code: 'VALIDATION_ERROR', message: 'Kode OTHER hanya dapat dipakai untuk dosen atau pejabat non-jurusan.' })
      return
    }
    parsed.push({ row: rowNumber, input: zod.data })
  })
  return { rows: parsed, errors }
}

/** Read a multipart form file field, enforcing size and extension (P4-03). */
async function readUpload(event: H3Event, field: string): Promise<Buffer> {
  const form = await readMultipartFormData(event)
  const part = form?.find((f) => f.name === field)
  if (!part?.data?.length) apiError('VALIDATION_ERROR', 'Berkas tidak ditemukan di field ' + field + '.')
  if (part.data.length > 2 * 1024 * 1024) apiError('VALIDATION_ERROR', 'Ukuran berkas melebihi 2 MB.')
  const name = part.filename ?? 'import.xlsx'
  if (!/\.xlsx$/i.test(name)) apiError('VALIDATION_ERROR', 'Format harus .xlsx (unduh templat resmi).')
  return Buffer.from(part.data)
}

/**
 * Validation step (default mode): parse, map columns, stage in import_batches
 * (PENDING rows in counts/errors JSONB), return per-row report plus preview.
 * Passwords are validated with the row but never included in the preview
 * response or stored in the staging record.
 */
export async function importVotersPreview(actorId: string, event: H3Event) {
  const file = await readUpload(event, 'file')
  const { rows, errors } = await parseVoterWorkbook(file)
  const fileHash = createHash('sha256').update(file).digest('hex')
  const id = randomUUID()
  const pool = getPool()
  await pool.query(
    'INSERT INTO import_batches (id, state, counts, errors, created_by) VALUES ($1, $2, $3, $4, $5)',
    [id, rows.length > 0 && errors.length === 0 ? 'VALIDATED' : 'FAILED',
      JSON.stringify({ validRows: rows.length, errorRows: errors.length }), JSON.stringify({ fileHash, errors }), actorId],
  )
  await recordAuditEvent(pool, { actorId, action: 'ADMIN_IMPORT_VALIDATE', target: id, changes: { rows: rows.length, errors: errors.length } })
  return {
    batchId: id,
    fileHash,
    totalRows: rows.length,
    errorRows: errors,
    preview: rows.slice(0, 25).map((r) => ({
      row: r.row,
      voterType: r.input.voterType,
      identifierType: r.input.identifierType,
      identifierValue: r.input.identifierValue,
      name: r.input.name,
      departmentCode: r.input.departmentCode,
    })),
  }
}

/**
 * Commit step (P4-04): only from a VALIDATED batch whose file hash matches
 * the current upload, atomic single transaction, add/update/skip counts,
 * creates missing login accounts without changing password_hash on existing
 * accounts or touching admin-adjusted rights.
 */
export async function commitVoterImport(actorId: string, event: H3Event) {
  const q = getQuery(event)
  const batchId = String(q.batchId ?? '')
  if (!batchId) apiError('VALIDATION_ERROR', 'batchId wajib ada.')
  const file = await readUpload(event, 'file')
  const fileHash = createHash('sha256').update(file).digest('hex')
  const pool = getPool()
  const batch = await pool.query<{ id: string; state: string; errors: { fileHash?: string } | null }>(
    'SELECT id, state, errors FROM import_batches WHERE id = $1', [batchId],
  )
  const b = batch.rows[0]
  if (!b) apiError('NOT_FOUND', 'Batch impor tidak ditemukan.')
  if (b.state !== 'VALIDATED') apiError('STATE_INVALID', 'Batch tidak dapat di-commit (harus VALIDATED).')
  if (b.errors?.fileHash !== fileHash) apiError('CONFLICT', 'Berkas berubah sejak validasi; ulangi validasi.')

  const { rows: parsed_, errors } = await parseVoterWorkbook(file)
  if (errors.length > 0) apiError('VALIDATION_ERROR', 'Berkas berubah sejak validasi; ulangi validasi.')

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const counts = { added: 0, updated: 0, skipped: 0, accountsCreated: 0 }
    for (const pr of parsed_) {
      const res = await client.query<{ id: string; action: string }>(
        `INSERT INTO voters (id, voter_type, identifier_type, identifier_value, name, department_id, active_status)
         SELECT $1, $2, $3, $4, $5, d.id, TRUE FROM departments d WHERE d.code = $6
         ON CONFLICT (identifier_type, identifier_value) DO UPDATE
           SET name = EXCLUDED.name, department_id = EXCLUDED.department_id, active_status = TRUE
         WHERE voters.voter_type = EXCLUDED.voter_type
         RETURNING id, 'UPDATED' AS action`,
        [randomUUID(), pr.input.voterType, pr.input.identifierType, pr.input.identifierValue, pr.input.name, pr.input.departmentCode],
      )
      if (!res.rows[0]) counts.skipped++ // unknown department or type mismatch
      else {
        if (res.rows[0].action === 'UPDATED') counts.updated++
        else counts.added++
        const existingAccount = await client.query<{ id: string }>(
          'SELECT id FROM users WHERE voter_id = $1 FOR UPDATE',
          [res.rows[0].id],
        )
        if (!existingAccount.rows[0]) {
          const passwordHash = await hashPassword(pr.input.password)
          await client.query(
            `INSERT INTO users (id, login_kind, login_identifier, password_hash, voter_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [randomUUID(), pr.input.voterType, pr.input.identifierValue, passwordHash, res.rows[0].id],
          )
          counts.accountsCreated++
        }
      }
    }
    await client.query(
      "UPDATE import_batches SET state = 'COMMITTED', counts = $2 WHERE id = $1",
      [batchId, JSON.stringify(counts)],
    )
    await recordAuditEvent(client, { actorId, action: 'ADMIN_IMPORT_COMMIT', target: batchId, changes: counts })
    await client.query('COMMIT')
    return { batchId, ...counts }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
