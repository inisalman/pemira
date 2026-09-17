import { randomUUID, randomInt } from 'node:crypto'
import { getPool, closePool } from './db'

/**
 * Synthetic seed data per TASKLIST P0-05:
 * - 5 departments, including a non-department group for lecturers
 * - default election with 10 contests: 2 PAIR (BEM, MPM) + 8 SINGLE (4 Hima × chair/vice)
 * - synthetic voters (default 600) and matching accounts
 * - admin account with a generated password printed ONCE to stdout
 *
 * No production accounts, no shared passwords. Safe to run on dev/test only.
 */

const DEPARTMENTS = [
  { code: 'KEP', name: 'Keperawatan' },
  { code: 'KEB', name: 'Kebidanan' },
  { code: 'KG', name: 'Kesehatan Gigi' },
  { code: 'OP', name: 'Ortotik Prostetik' },
  { code: 'OTHER', name: 'Lainnya' },
]

const VOTER_DEPARTMENTS = DEPARTMENTS.filter((department) => department.code !== 'OTHER')

const CONTESTS = [
  { code: 'BEM', title: 'Ketua dan wakil BEM', office: 'PAIR', optionType: 'PAIR', department: null },
  { code: 'MPM', title: 'Ketua dan wakil MPM', office: 'PAIR', optionType: 'PAIR', department: null },
  { code: 'HIMA_KEP_CHAIR', title: 'Ketua Hima Keperawatan', office: 'CHAIR', optionType: 'SINGLE', department: 'KEP' },
  { code: 'HIMA_KEP_VICE', title: 'Wakil ketua Hima Keperawatan', office: 'VICE_CHAIR', optionType: 'SINGLE', department: 'KEP' },
  { code: 'HIMA_KEB_CHAIR', title: 'Ketua Hima Kebidanan', office: 'CHAIR', optionType: 'SINGLE', department: 'KEB' },
  { code: 'HIMA_KEB_VICE', title: 'Wakil ketua Hima Kebidanan', office: 'VICE_CHAIR', optionType: 'SINGLE', department: 'KEB' },
  { code: 'HIMA_KG_CHAIR', title: 'Ketua Hima Kesehatan Gigi', office: 'CHAIR', optionType: 'SINGLE', department: 'KG' },
  { code: 'HIMA_KG_VICE', title: 'Wakil ketua Hima Kesehatan Gigi', office: 'VICE_CHAIR', optionType: 'SINGLE', department: 'KG' },
  { code: 'HIMA_OP_CHAIR', title: 'Ketua Hima Ortotik Prostetik', office: 'CHAIR', optionType: 'SINGLE', department: 'OP' },
  { code: 'HIMA_OP_VICE', title: 'Wakil ketua Hima Ortotik Prostetik', office: 'VICE_CHAIR', optionType: 'SINGLE', department: 'OP' },
]

const VOTER_COUNT = Number(process.env.SEED_VOTERS ?? 600)

/** Generate a random printable password (16 chars) — never stored in plaintext. */
function generatePassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < 16; i++) out += alphabet[randomInt(alphabet.length)]
  return out
}

async function main(): Promise<void> {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Departments (upsert by code so re-seeding is idempotent)
    const deptIds = new Map<string, string>()
    for (const d of DEPARTMENTS) {
      const existing = await client.query<{ id: string }>('SELECT id FROM departments WHERE code = $1', [d.code])
      if (existing.rows.length > 0) {
        deptIds.set(d.code, existing.rows[0].id)
      } else {
        const id = randomUUID()
        await client.query('INSERT INTO departments (id, code, name) VALUES ($1, $2, $3)', [id, d.code, d.name])
        deptIds.set(d.code, id)
      }
    }

    // Default synthetic election
    let electionId: string
    const existingElection = await client.query<{ id: string }>("SELECT id FROM elections WHERE name = 'Pemira Simulasi 2026'")
    if (existingElection.rows.length > 0) {
      electionId = existingElection.rows[0].id
    } else {
      electionId = randomUUID()
      await client.query("INSERT INTO elections (id, name, status) VALUES ($1, 'Pemira Simulasi 2026', 'DRAFT')", [electionId])
    }

    // Ten contests
    for (const c of CONTESTS) {
      const existing = await client.query('SELECT id FROM contests WHERE election_id = $1 AND code = $2', [electionId, c.code])
      if (existing.rowCount === 0) {
        await client.query(
          'INSERT INTO contests (id, election_id, code, title, scope_department_id, office, option_type) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [randomUUID(), electionId, c.code, c.title, c.department ? deptIds.get(c.department) : null, c.office, c.optionType],
        )
      }
    }

    // Admin account (random password, printed once)
    const adminExists = await client.query("SELECT id FROM users WHERE login_kind = 'ADMIN' AND login_identifier = 'admin'")
    if (adminExists.rowCount === 0) {
      const { hash } = await import('@node-rs/argon2')
      const password = generatePassword()
      const passwordHash = await hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 })
      await client.query("INSERT INTO users (id, login_kind, login_identifier, password_hash) VALUES ($1, 'ADMIN', 'admin', $2)", [randomUUID(), passwordHash])
      console.log('ADMIN ACCOUNT (printed once, not stored): login=admin password=' + password)
    }

    // Synthetic voters + accounts + DPT roll + default rights
    const contests = await client.query<{ id: string; code: string; scope_department_id: string | null }>(
      'SELECT id, code, scope_department_id FROM contests WHERE election_id = $1', [electionId],
    )
    const globalContests = contests.rows.filter((c) => c.scope_department_id === null)
    const himaContests = contests.rows.filter((c) => c.scope_department_id !== null)

    const existingVoters = await client.query<{ count: string }>('SELECT count(*)::text AS count FROM voters')
    let created = Number(existingVoters.rows[0].count)
    const { hash } = await import('@node-rs/argon2')

    for (let i = created; i < VOTER_COUNT; i++) {
      const isLecturer = i % 10 === 9 // ~10% lecturers
      const dept = VOTER_DEPARTMENTS[i % VOTER_DEPARTMENTS.length]
      const deptId = deptIds.get(dept.code)!
      const identifier = isLecturer ? `L${String(1000 + i)}` : `N${String(100000 + i).padStart(6, '0')}`
      const voterId = randomUUID()
      await client.query(
        'INSERT INTO voters (id, voter_type, identifier_type, identifier_value, name, department_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [voterId, isLecturer ? 'LECTURER' : 'STUDENT', isLecturer ? 'NIP_LOCAL' : 'NIM', identifier, `Pemilih Sintetis ${i + 1}`, deptId],
      )
      // Account with a random password (not printed — synthetic accounts)
      const passwordHash = await hash(generatePassword(), { memoryCost: 19456, timeCost: 2, parallelism: 1 })
      await client.query(
        'INSERT INTO users (id, login_kind, login_identifier, password_hash, voter_id) VALUES ($1, $2, $3, $4, $5)',
        [randomUUID(), isLecturer ? 'LECTURER' : 'STUDENT', identifier, passwordHash, voterId],
      )
      const rollId = randomUUID()
      await client.query(
        'INSERT INTO voter_roll_entries (id, election_id, voter_id, voter_type_snapshot, department_id_snapshot) VALUES ($1, $2, $3, $4, $5)',
        [rollId, electionId, voterId, isLecturer ? 'LECTURER' : 'STUDENT', deptId],
      )
      // Default rights: BEM, MPM + the two Hima contests of the voter's department
      for (const c of globalContests) {
        await client.query(
          "INSERT INTO voting_rights (id, roll_entry_id, contest_id, election_id, source) VALUES ($1, $2, $3, $4, 'DEFAULT')",
          [randomUUID(), rollId, c.id, electionId],
        )
      }
      for (const c of himaContests.filter((c) => c.scope_department_id === deptId)) {
        await client.query(
          "INSERT INTO voting_rights (id, roll_entry_id, contest_id, election_id, source) VALUES ($1, $2, $3, $4, 'DEFAULT')",
          [randomUUID(), rollId, c.id, electionId],
        )
      }
      created++
    }

    await client.query('COMMIT')
    const rights = await client.query<{ count: string }>('SELECT count(*)::text AS count FROM voting_rights')
    console.log(`Seed complete: ${created} voters, ${rights.rows[0].count} voting rights, 10 contests, 5 departments.`)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exitCode = 1
  })
  .finally(() => closePool())
