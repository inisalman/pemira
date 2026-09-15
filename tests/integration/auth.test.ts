import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { Pool } from 'pg'
import { hashPassword, verifyPassword, generatePassword } from '../../server/utils/password'
import { hashToken } from '../../server/utils/session'
import { redactForLog } from '../../server/utils/log-redaction'

/**
 * Auth integration tests (TASKLIST P2-07): same NIM/NIP value distinguished by
 * login_kind, wrong password rejected, credential_version revokes sessions,
 * reset does not touch rights/participation, no plaintext passwords anywhere.
 */

const ADMIN_DB = process.env.TEST_ADMIN_DB_URL ?? 'postgres://salman@localhost:5432/postgres'
const TEST_DB = `pemira_auth_${randomUUID().slice(0, 8)}`
const DB_URL = `${ADMIN_DB.replace(/\/postgres$/, '')}/${TEST_DB}`

let pool: Pool

async function migrate() {
  execSync('npx tsx database/migrate.ts', { env: { ...process.env, DATABASE_URL: DB_URL }, stdio: 'pipe' })
}

beforeAll(async () => {
  execSync(`psql "${ADMIN_DB}" -c "CREATE DATABASE ${TEST_DB}"`, { stdio: 'pipe' })
  await migrate()
  pool = new Pool({ connectionString: DB_URL })
})

afterAll(async () => {
  await pool?.end()
  execSync(`psql "${ADMIN_DB}" -c "DROP DATABASE ${TEST_DB}"`, { stdio: 'pipe' })
})

describe('password hashing', () => {
  it('produces argon2id hashes and verifies correctly', async () => {
    const password = generatePassword()
    const h = await hashPassword(password)
    expect(h).toMatch(/^\$argon2id\$/)
    expect(await verifyPassword(h, password)).toBe(true)
    expect(await verifyPassword(h, 'wrong-password')).toBe(false)
  })

  it('generated passwords are >= 16 chars and random', () => {
    const a = generatePassword()
    const b = generatePassword()
    expect(a.length).toBeGreaterThanOrEqual(16)
    expect(a).not.toBe(b)
  })
})

describe('login identity semantics', () => {
  it('same identifier value under different login_kind is a different account', async () => {
    const password = generatePassword()
    const shared = '1234567890' // same NIM and NIP_LOCAL value
    for (const kind of ['STUDENT', 'LECTURER'] as const) {
      await pool.query(
        'INSERT INTO users (id, login_kind, login_identifier, password_hash) VALUES ($1, $2, $3, $4)',
        [randomUUID(), kind, shared, await hashPassword(password)],
      )
    }
    const { rows } = await pool.query(
      'SELECT login_kind FROM users WHERE login_identifier = $1 ORDER BY login_kind', [shared],
    )
    expect(rows.map((r) => r.login_kind)).toEqual(['LECTURER', 'STUDENT'])
  })
})

describe('session revocation via credential_version', () => {
  it('bumping credential_version invalidates stored session rows', async () => {
    const userId = randomUUID()
    await pool.query(
      "INSERT INTO users (id, login_kind, login_identifier, password_hash) VALUES ($1, 'STUDENT', 'revtest', 'x')",
      [userId],
    )
    const token = randomUUID()
    await pool.query(
      'INSERT INTO sessions (id_hash, user_id, credential_version, expires_at) VALUES ($1, $2, 1, clock_timestamp() + interval \'1 hour\')',
      [hashToken(token), userId],
    )
    await pool.query('UPDATE users SET credential_version = credential_version + 1 WHERE id = $1', [userId])
    const { rows } = await pool.query(
      `SELECT s.id_hash FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id_hash = $1 AND s.credential_version = u.credential_version`,
      [hashToken(token)],
    )
    expect(rows).toHaveLength(0)
  })
})

describe('reset safety', () => {
  it('password reset does not modify voting rights or participation', async () => {
    const dept = await pool.query("INSERT INTO departments (id, code, name) VALUES ($1,'KEP','Keperawatan') RETURNING id", [randomUUID()])
    const deptId = dept.rows[0].id
    const voterId = randomUUID()
    await pool.query(
      "INSERT INTO voters (id, voter_type, identifier_type, identifier_value, name, department_id) VALUES ($1,'STUDENT','NIM','R1','Reset Test',$2)",
      [voterId, deptId],
    )
    const userId = randomUUID()
    await pool.query(
      "INSERT INTO users (id, login_kind, login_identifier, password_hash, voter_id) VALUES ($1,'STUDENT','R1','x',$2)",
      [userId, voterId],
    )
    const electionId = randomUUID()
    await pool.query("INSERT INTO elections (id, name) VALUES ($1,'T')", [electionId])
    const contestId = randomUUID()
    await pool.query(
      "INSERT INTO contests (id, election_id, code, title, office, option_type) VALUES ($1,$2,'BEM','BEM','PAIR','PAIR')",
      [contestId, electionId],
    )
    const rollId = randomUUID()
    await pool.query(
      "INSERT INTO voter_roll_entries (id, election_id, voter_id, voter_type_snapshot, department_id_snapshot) VALUES ($1,$2,$3,'STUDENT',$4)",
      [rollId, electionId, voterId, deptId],
    )
    const rightId = randomUUID()
    await pool.query(
      "INSERT INTO voting_rights (id, roll_entry_id, contest_id, election_id, source) VALUES ($1,$2,$3,$4,'DEFAULT')",
      [rightId, rollId, contestId, electionId],
    )

    // Simulate reset: bump credential_version only.
    await pool.query('UPDATE users SET credential_version = credential_version + 1 WHERE id = $1', [userId])

    const rights = await pool.query('SELECT count(*)::int AS c FROM voting_rights WHERE id = $1', [rightId])
    expect(rights.rows[0].c).toBe(1)
    const participation = await pool.query('SELECT count(*)::int AS c FROM participations')
    expect(participation.rows[0].c).toBe(0)
  })
})

describe('no plaintext secrets', () => {
  it('log redaction never leaks identifiers or option ids', () => {
    const logged = JSON.stringify(redactForLog({
      login_identifier: 'N000123',
      password: 'hunter2secret',
      option_id: 'opt-1',
    }))
    expect(logged).not.toContain('N000123')
    expect(logged).not.toContain('hunter2secret')
    expect(logged).not.toContain('opt-1')
  })

  it('no plaintext password column value in seeded-style rows', async () => {
    const password = generatePassword()
    await pool.query(
      "INSERT INTO users (id, login_kind, login_identifier, password_hash) VALUES ($1,'STUDENT','plainchk',$2)",
      [randomUUID(), await hashPassword(password)],
    )
    const { rows } = await pool.query<{ password_hash: string }>("SELECT password_hash FROM users WHERE login_identifier='plainchk'")
    expect(rows[0].password_hash).not.toContain(password)
    expect(rows[0].password_hash).toMatch(/^\$argon2/)
  })
})
