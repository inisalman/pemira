import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { apiError } from '../../utils/errors'
import { getPool } from '../../../database/db'
import { recordAuditEvent } from '../audit/audit'

/**
 * Voter registry management per SDD sections 3/5 (TASKLIST P4-01).
 * Identity stays as text (NIM/NIP may have leading zeros — never numeric).
 * Create-or-update semantics keep the unique (identifier_type, identifier_value)
 * invariant so re-imports never duplicate accounts (P4-04 pairs with this).
 */

export const voterUpsertSchema = z.object({
  voterType: z.enum(['STUDENT', 'LECTURER']),
  identifierType: z.enum(['NIM', 'NIP_LOCAL']),
  identifierValue: z.string().min(1).max(64).regex(/^[0-9]+$/, 'NIM/NIP harus angka murni (nol awal dipertahankan sebagai teks).'),
  name: z.string().min(1).max(120),
  departmentCode: z.string().min(1).max(32),
  activeStatus: z.boolean().default(true),
})

export type VoterUpsert = z.infer<typeof voterUpsertSchema>

export type VoterRow = {
  id: string
  voterType: string
  identifierType: string
  identifierValue: string
  name: string
  departmentCode: string | null
  departmentName: string | null
  activeStatus: boolean
}

export async function upsertVoter(opts: { actorId: string; input: VoterUpsert }) {
  const pool = getPool()
  if (opts.input.voterType === 'STUDENT' && opts.input.identifierType !== 'NIM') {
    apiError('VALIDATION_ERROR', 'Mahasiswa wajib memakai NIM.')
  }
  if (opts.input.voterType === 'LECTURER' && opts.input.identifierType !== 'NIP_LOCAL') {
    apiError('VALIDATION_ERROR', 'Dosen wajib memakai NIP lokal.')
  }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const dept = await client.query<{ id: string }>('SELECT id FROM departments WHERE code = $1', [opts.input.departmentCode])
    if (!dept.rows[0]) apiError('VALIDATION_ERROR', `Kode jurusan ${opts.input.departmentCode} tidak dikenal.`)
    const values = [
      opts.input.voterType,
      opts.input.identifierType,
      opts.input.identifierValue,
      opts.input.name,
      dept.rows[0].id,
      opts.input.activeStatus,
    ]
    const { rows } = await client.query<{ id: string, action: string }>(
      `INSERT INTO voters (id, voter_type, identifier_type, identifier_value, name, department_id, active_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (identifier_type, identifier_value) DO UPDATE
         SET voter_type = EXCLUDED.voter_type,
             name = EXCLUDED.name,
             department_id = EXCLUDED.department_id,
             active_status = EXCLUDED.active_status
       WHERE voters.voter_type = EXCLUDED.voter_type
       RETURNING id,
         'UPDATED' AS action`,
      [randomUUID(), ...values],
    )
    if (!rows[0]) {
      apiError('CONFLICT', 'Identitas sudah terdaftar sebagai jenis pemilih berbeda; perubahan jenis tidak diizinkan.')
    }
    await recordAuditEvent(client, {
      actorId: opts.actorId,
      action: rows[0].action === 'UPDATED' ? 'ADMIN_UPSERT_VOTER' : 'ADMIN_CREATE_VOTER',
      target: rows[0].id,
      changes: { identifierType: opts.input.identifierType, voterType: opts.input.voterType },
    })
    await client.query('COMMIT')
    return { id: rows[0].id, action: rows[0].action }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

/** Paginated/filterable voter list (P4-01). Search is prefixmatch on identifier, substring on name. */
export async function listVoters(opts: {
  search?: string
  voterType?: 'STUDENT' | 'LECTURER'
  departmentCode?: string
  activeStatus?: boolean
  page: number
  pageSize: number
}) {
  const pool = getPool()
  const where: string[] = []
  const params: unknown[] = []
  if (opts.search) {
    params.push(`%${opts.search}%`)
    where.push(`(v.name ILIKE $${params.length} OR v.identifier_value LIKE $${params.length})`)
  }
  if (opts.voterType) {
    params.push(opts.voterType)
    where.push(`v.voter_type = $${params.length}`)
  }
  if (opts.departmentCode) {
    params.push(opts.departmentCode)
    where.push(`d.code = $${params.length}`)
  }
  if (opts.activeStatus !== undefined) {
    params.push(opts.activeStatus)
    where.push(`v.active_status = $${params.length}`)
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const offset = (opts.page - 1) * opts.pageSize
  const { rows } = await pool.query<VoterRow & { total: string }>(
    `SELECT v.id, v.voter_type, v.identifier_type, v.identifier_value, v.name, v.active_status,
            d.code AS department_code, d.name AS department_name,
            count(*) OVER ()::text AS total
     FROM voters v LEFT JOIN departments d ON d.id = v.department_id
     ${whereSql}
     ORDER BY v.name, v.identifier_value
     LIMIT ${opts.pageSize} OFFSET ${offset}`,
    params,
  )
  return {
    items: rows.map(({ total, ...v }) => ({
      id: v.id,
      voterType: v.voterType,
      identifierType: v.identifierType,
      identifierValue: v.identifierValue,
      name: v.name,
      departmentCode: v.departmentCode,
      departmentName: v.departmentName,
      activeStatus: v.activeStatus,
    })),
    total: Number(rows[0]?.total ?? 0),
    page: opts.page,
    pageSize: opts.pageSize,
  }
}
