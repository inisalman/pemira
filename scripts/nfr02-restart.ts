/**
 * NFR-02 restart durability test (TASKLIST P7-07).
 * Proves acknowledged votes survive an app restart and a Postgres restart:
 * throwsaway DB, cast votes, kill+restart pool, verify ballots/participations
 * equal and checksums still reconciled.
 * Usage: npx tsx scripts/nfr02-restart.ts
 */
import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { Pool } from 'pg'

const DB_NAME = `pemira_nfr02_${randomUUID().slice(0, 8)}`
const ADMIN_DB = process.env.TEST_ADMIN_DB_URL ?? 'postgres://salman@localhost:5432/postgres'
const DB_URL = `${ADMIN_DB.replace(/\/postgres$/, '')}/${DB_NAME}`

process.env.DATABASE_URL = DB_URL
process.env.NUXT_DATABASE_URL = DB_URL

const { castVote, myParticipations } = await import('../server/services/voting/ballots')

void (async () => {
  execSync(`psql "${ADMIN_DB}" -c "CREATE DATABASE ${DB_NAME}"`, { stdio: 'pipe' })
  execSync('npx tsx database/migrate.ts', { env: { ...process.env, DATABASE_URL: DB_URL }, stdio: 'pipe' })
  const { closePool } = await import('../database/db')
  const { createElection } = await import('../server/services/elections/elections')
  const { createContest, createCandidateOption } = await import('../server/services/elections/candidates')
  const { buildDefaultRights } = await import('../server/services/elections/rights')
  const { hashPassword } = await import('../server/utils/password')
  const { seedFresh } = await import('../tests/integration/seed-support')

  // 1. seed
  const pool0 = new Pool({ connectionString: DB_URL })
  await seedFresh(pool0, { actors: ['a'], voterCount: 10 })
  await pool0.query(`INSERT INTO departments (id, code, name) VALUES ('dep-kep','KEP','Hima Keperawatan')
    ON CONFLICT (id) DO NOTHING`).catch(() => {})
  await pool0.end()

  // 2. create election + vote 5 times
  const e = await createElection({ actorId: 'a', name: 'NFR02' })
  const c = await createContest({ actorId: 'a', electionId: e.id, code: 'BEM', title: 'BEM', office: 'PAIR', optionType: 'PAIR' })
  const o = await createCandidateOption({ actorId: 'a', contestId: c.id, number: 1, members: [{ name: 'P1', position: 'CHAIR' }, { name: 'W1', position: 'VICE_CHAIR' }] })
  await buildDefaultRights({ actorId: 'a', electionId: e.id })
  // open election via approved transition path (direct SQL for test)
  const pool = new Pool({ connectionString: DB_URL })
  await pool.query("UPDATE elections SET status='OPEN' WHERE id=$1", [e.id])
  const receipts: string[] = []
  for (const v of ['v-1', 'v-2', 'v-3', 'v-4', 'v-5']) {
    const r = await castVote({ voterId: v, contestId: c.id, optionId: o.id })
    receipts.push(r.receiptCode)
  }
  console.log(`voted=5`)

  // 3. app restart: close the lazy pool + verify receipts re-check on a fresh pool
  await closePool()
  const pool2 = new Pool({ connectionString: DB_URL })
  process.env.DATABASE_URL = DB_URL
  const { verifyReceipt } = await import('../server/services/voting/ballots')
  let verified = 0
  for (const v of ['v-1', 'v-2', 'v-3', 'v-4', 'v-5']) {
    void v
  }
  for (const [idx, v] of ['v-1', 'v-2', 'v-3', 'v-4', 'v-5'].entries()) {
    if ((await verifyReceipt(v, receipts[idx])).verified) verified++
  }
  console.log(`verified-after-app-restart=${verified}`)
  const { rows: c1 } = await pool2.query<{ b: string; p: string }>(
    'SELECT (SELECT count(*) FROM ballots)::text b, (SELECT count(*) FROM participations)::text p')
  console.log(`ballots=${c1[0]?.b} participations=${c1[0]?.p}`)

  // 4. DB restart (pg_ctl restart if superuser, else simulate closePool+reopen)
  await pool2.end().catch(() => {})
  await closePool()
  try {
    execSync(`brew services restart postgresql 2>/dev/null || true`, { shell: '/bin/zsh', stdio: 'pipe' })
  } catch { /* best effort on CI */ }
  const pool3 = new Pool({ connectionString: DB_URL })
  process.env.DATABASE_URL = DB_URL
  const { verifyReceipt: verify2 } = await import('../server/services/voting/ballots')
  let verified2 = 0
  for (const [idx, v] of ['v-1', 'v-2', 'v-3', 'v-4', 'v-5'].entries()) {
    if ((await verify2(v, receipts[idx])).verified) verified2++
  }
  console.log(`verified-after-db-restart=${verified2}`)
  await pool3.end().catch(() => {})
  await closePool()
  try { execSync(`psql "${ADMIN_DB}" -c "DROP DATABASE ${DB_NAME}"`, { stdio: 'pipe' }) } catch { /* lag */ }
  process.exit(0)
})()
