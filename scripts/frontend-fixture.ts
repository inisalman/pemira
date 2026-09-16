import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { Pool } from 'pg'
import { hashPassword } from '../server/utils/password'
import { seedFresh } from '../tests/integration/seed-support'

const adminUrl = process.env.TEST_ADMIN_DB_URL ?? 'postgres://salman@localhost:5432/postgres'
const name = `pemira_frontend_${randomUUID().replaceAll('-', '').slice(0, 8)}`
const url = new URL(adminUrl)
url.pathname = `/${name}`
const admin = new Pool({ connectionString: adminUrl })
await admin.query(`CREATE DATABASE ${name}`)
await admin.end()
execFileSync('npx', ['tsx', 'database/migrate.ts'], { env: { ...process.env, DATABASE_URL: url.href }, stdio: 'pipe' })
const pool = new Pool({ connectionString: url.href })
try {
  await seedFresh(pool, { actors: ['frontend-admin'], voterCount: 4 })
  const hash = await hashPassword('SimulasiFrontend2026!')
  await pool.query("INSERT INTO users (id, login_kind, login_identifier, password_hash, voter_id) VALUES ('frontend-student', 'STUDENT', '001234', $1, 'v-1')", [hash])
  await pool.query("UPDATE users SET password_hash = $1 WHERE id = 'frontend-admin'", [hash])
  await pool.query("INSERT INTO elections (id,name,status) VALUES ('frontend-election', 'Simulasi frontend (data uji)', 'OPEN')")
  await pool.query("INSERT INTO voter_roll_entries (id,election_id,voter_id,voter_type_snapshot,department_id_snapshot) SELECT 'frontend-roll','frontend-election',id,voter_type,department_id FROM voters WHERE id='v-1'")
  for (const code of ['BEM', 'MPM']) {
    await pool.query("INSERT INTO contests (id,election_id,code,title,office,option_type) VALUES ($1,'frontend-election',$1,$2,'PAIR','PAIR')", [code, `Pasangan ${code} (simulasi)`])
    await pool.query("INSERT INTO voting_rights (id,roll_entry_id,contest_id,election_id) VALUES ($1,'frontend-roll',$1,'frontend-election')", [code])
    for (const number of [1, 2]) {
      const id = `${code}-${number}`
      await pool.query("INSERT INTO candidate_options (id,contest_id,number,motto,vision,mission) VALUES ($1,$2,$3,'Moto simulasi','Visi simulasi untuk pengujian tampilan.','Misi simulasi untuk pengujian tampilan.')", [id, code, number])
      for (const position of ['CHAIR', 'VICE_CHAIR']) {
        await pool.query('INSERT INTO candidate_members (id,option_id,name,position) VALUES ($1,$2,$3,$4)', [`${id}-${position}`, id, `Calon simulasi ${number} ${position === 'CHAIR' ? 'ketua' : 'wakil'}`, position])
      }
    }
  }
  console.log(`Database simulasi: ${name}`)
  console.log('Akun mahasiswa: 001234; panitia: frontend-admin')
  console.log('Password khusus fixture: SimulasiFrontend2026!')
} finally { await pool.end() }
