import type { Pool } from 'pg'

/** Shared deterministic fixture data for integration tests. */

export const departments = [
  { id: 'dep-kep', code: 'KEP', name: 'Keperawatan' },
  { id: 'dep-keb', code: 'KEB', name: 'Kebidanan' },
  { id: 'dep-kg', code: 'KG', name: 'Kesehatan Gigi' },
  { id: 'dep-op', code: 'OP', name: 'Ortotik Prostetik' },
  { id: 'dep-other', code: 'OTHER', name: 'Lainnya' },
]

/** 600-voter-scale synthetic population (fast: no argon2 in this path). */
export async function seedVoters(pool: Pool, count: number): Promise<void> {
  const rows: unknown[][] = []
  for (let i = 0; i < count; i++) {
    const dept = `dep-${['kep', 'keb', 'kg', 'op'][i % 4]}`
    const isStudent = i % 10 !== 9
    rows.push([
      `v-${i}`,
      isStudent ? 'STUDENT' : 'LECTURER',
      isStudent ? 'NIM' : 'NIP_LOCAL',
      isStudent ? `2110115261${String(i).padStart(5, '0')}` : `197512${String(i).padStart(6, '0')}L`,
      `Pemilih ${i}`,
      dept,
    ])
  }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const r of rows) {
      await client.query(
        'INSERT INTO voters (id, voter_type, identifier_type, identifier_value, name, department_id) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING',
        r,
      )
    }
    await client.query('COMMIT')
  } finally {
    client.release()
  }
}

export function seedAdmin(_pool: Pool, _id: string): void { void _pool; void _id }
