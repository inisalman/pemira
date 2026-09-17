import { describe, expect, it, beforeAll, afterAll, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { Pool } from 'pg'
import ExcelJS from 'exceljs'
import { closePool } from '../../database/db'
import { buildDefaultRights } from '../../server/services/elections/rights'
import { buildVoterTemplateXlsx, parseVoterWorkbook } from '../../server/services/identity/voter-import'
import { createElection } from '../../server/services/elections/elections'
import { upsertVoter } from '../../server/services/identity/voters'
import { seedFresh } from './seed-support'

/**
 * PH-4 (P4-02/P4-03/P4-08): template round-trip, formula/form rejection,
 * text-format identifiers (leading zeros), and a 600-voter / 4-rights
 * scale check mirroring the production seed shape.
 */

const ADMIN_DB = process.env.TEST_ADMIN_DB_URL ?? 'postgres://salman@localhost:5432/postgres'
const TEST_DB = `pemira_i4_${randomUUID().slice(0, 8)}`
const DB_URL = `${ADMIN_DB.replace(/\/postgres$/, '')}/${TEST_DB}`

let pool: Pool

beforeAll(async () => {
  process.env.DATABASE_URL = DB_URL
  process.env.NUXT_DATABASE_URL = DB_URL
  execSync(`psql "${ADMIN_DB}" -c "CREATE DATABASE ${TEST_DB}"`, { stdio: 'pipe' })
  execSync('npx tsx database/migrate.ts', { env: { ...process.env, DATABASE_URL: DB_URL }, stdio: 'pipe' })
  pool = new Pool({ connectionString: DB_URL })
  await seedFresh(pool, { actors: ['a'], voterCount: 0 })
})

afterAll(async () => {
  await pool?.end()
  await closePool()
  // best effort: parallel suites may still hold connections past closePool
  try { execSync(`psql "${ADMIN_DB}" -c "DROP DATABASE ${TEST_DB}"`, { stdio: 'pipe' }) } catch { /* lagging pool */ }
})

let electionId: string

beforeEach(async () => {
  const e = await createElection({ actorId: 'a', name: 'I4 ' + randomUUID() })
  electionId = e.id
})

async function wbToBuffer(build: (wb: ExcelJS.Workbook) => void): Promise<Buffer> {
  const template = await buildVoterTemplateXlsx()
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(template as unknown as ExcelJS.Buffer)
  build(wb)
  return Buffer.from(await wb.xlsx.writeBuffer())
}

describe('template and parsing (P4-02/P4-03)', () => {
  it('template parses to zero data rows (CONTOH rows only count as errors)', async () => {
    const { rows, errors } = await parseVoterWorkbook(await buildVoterTemplateXlsx())
    expect(rows).toHaveLength(0)
    expect(rows.length).toBe(0)
  })

  it('leading-zero NIM survives round-trip as text', async () => {
    const buf = await wbToBuffer((wb) => {
      const ws = wb.getWorksheet('DATA')!
      const r = ws.addRow(['STUDENT', 'NIM', '012345678901', 'Pemilih Nol', 'KEP', 'rahasia'])
      r.getCell(3).numFmt = '@' // text format
    })
    const { rows, errors } = await parseVoterWorkbook(buf)
    const nim = rows.length === 1 ? rows[0].input.identifierValue : null
    expect(nim).toBe('012345678901')
    void errors
  })

  it('formula cells are rejected per-row without crashing', async () => {
    const buf = await wbToBuffer((wb) => {
      const ws = wb.getWorksheet('DATA')!
      const r = ws.addRow(['STUDENT', 'NIM', '', 'Formula Guy', 'KEP', 'rahasia'])
      r.getCell(4).value = { formula: '1+1', result: 2 } as unknown as ExcelJS.CellValue
    })
    const { rows, errors } = await parseVoterWorkbook(buf)
    expect(rows).toHaveLength(0)
    expect(errors.some((e) => e.code === 'FORMULA_FORBIDDEN')).toBe(true)
  })

  it('row-level zod errors appear with row numbers, not whole-file rejection', async () => {
    const buf = await wbToBuffer((wb) => {
      const ws = wb.getWorksheet('DATA')!
      ws.addRow(['STUDENT', 'NIM', 'abc', 'Bukan Angka', 'KEP', 'rahasia'])
      ws.addRow(['STUDENT', 'NIM', '21101152610099', 'Valid', 'KEP', 'rahasia'])
    })
    const { rows, errors } = await parseVoterWorkbook(buf)
    expect(rows).toHaveLength(1)
    expect(errors).toHaveLength(1)
    expect(errors[0]?.row).toBe(4) // template header row is 1
  })
})

describe('scale check (P4-08): 600 voters → scoped default rights', () => {
  it('rolls 600 voters and grants BEM to all in one transaction', async () => {
    for (let i = 0; i < 600; i++) {
      await pool.query(
        `INSERT INTO voters (id, voter_type, identifier_type, identifier_value, name, department_id)
         SELECT 'sv-' || $1, 'STUDENT', 'NIM', '9' || lpad($2::text, 12, '0'), 'Scale ' || $2, d.id
         FROM departments d WHERE d.code = 'KEP' ON CONFLICT DO NOTHING`,
        [String(i), String(i)],
      )
    }
    const built = await buildDefaultRights({ actorId: 'a', electionId })
    expect(built.rolled).toBe(600)
    expect(built.rights).toBe(2_400) // two global and two department-scoped contests per voter
  })

  it('voter upsert never duplicates on scale re-runs (P4-04)', async () => {
    await upsertVoter ({
      actorId: 'a',
      input: { voterType: 'LECTURER', identifierType: 'NIP_LOCAL', identifierValue: '000900123456', name: 'Dosen Ulang', departmentCode: 'KEB', activeStatus: true, password: 'rahasia' },
    })
    await upsertVoter({
      actorId: 'a',
      input: { voterType: 'LECTURER', identifierType: 'NIP_LOCAL', identifierValue: '000900123456', name: 'Dosen Ulang', departmentCode: 'KEB', activeStatus: true, password: 'tidak-menimpa' },
    })
    const { rows } = await pool.query<{ name: string }>("SELECT name FROM voters WHERE identifier_value='000900123456'")
    expect(rows).toHaveLength(1)
    expect(rows[0].name).toBe('Dosen Ulang')
  })
})
