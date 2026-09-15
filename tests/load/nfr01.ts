/**
 * NFR-01 load harness (TASKLIST P7-04/P7-05). Throwaway DB per run.
 * Scenarios:
 *   mixed : 10 votes/s for 4 min + 600 spectators polling quick count (5 s)
 *   login : 600-voter login sweep (separate scenario per spec)
 * Usage: npx tsx tests/load/nfr01.ts mixed|login
 */
import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { Pool } from 'pg'
import { hashPassword, verifyPassword } from '../../server/utils/password'

const scenario = process.argv[2] ?? 'mixed'
const DB_NAME = ['pemira_p7', scenario, randomUUID().slice(0, 6)].join('_')
const ADMIN_DB = process.env.TEST_ADMIN_DB_URL ?? 'postgres://salman@localhost:5432/postgres'
const DB_URL = `${ADMIN_DB.replace(/\/postgres$/, '')}/${DB_NAME}`

const VOTERS = 600
const DEPTS = ['dep-kep', 'dep-keb', 'dep-kg', 'dep-op']

process.env.DATABASE_URL = DB_URL
process.env.NUXT_DATABASE_URL = DB_URL

const { closePool } = await import('../../database/db')
const { castVote } = await import('../../server/services/voting/ballots')
const { quickCountPayload } = await import('../../server/services/results/results')

const lats: { ms: number; ok: boolean }[] = []
let errors = 0

function percentile(list: number[], p: number): number {
  if (!list.length) return 0
  const s = [...list].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]
}

async function setup(): Promise<Pool> {
  execSync(`psql "${ADMIN_DB}" -c "CREATE DATABASE ${DB_NAME}"`, { stdio: 'pipe' })
  execSync('npx tsx database/migrate.ts', { env: { ...process.env, DATABASE_URL: DB_URL }, stdio: 'pipe' })
  const pool = new Pool({ connectionString: DB_URL, max: 15 })
  const argon = await hashPassword('Salina-test-2026!')

  await pool.query(
    `INSERT INTO departments (id, code, name) VALUES
      ('dep-kep','KEP','Hima Keperawatan'),('dep-keb','KEB','Hima Kebidanan'),
      ('dep-kg','KG','Hima Kesehatan Gigi'),('dep-op','OP','Hima Ortotik Prostetik')
     ON CONFLICT (id) DO NOTHING`,
  )

  // 600 voters + 600 matching users (login rows)
  for (let i = 0; i < VOTERS; i++) {
    await pool.query(
      `INSERT INTO voters (id, voter_type, identifier_type, identifier_value, name, active_status)
       VALUES ($1,'STUDENT','NIM',$2,$3,TRUE)`,
      [`v-${i}`, String(21101152610000 + i), `Budi ${i}`],
    )
    await pool.query(
      `INSERT INTO users (id, login_kind, login_identifier, password_hash, active, voter_id)
       VALUES ($1,'STUDENT',$2,$3,TRUE,$4)`,
      [`u-${i}`, String(21101152610000 + i), argon, `v-${i}`],
    )
  }

  const electionId = 'e-load'
  await pool.query(`INSERT INTO elections (id, name, status) VALUES ($1,'NFR-01','DRAFT')`, [electionId])

  // 2 pair + 8 Hima contests = 10
  const defs = [
    { code: 'BEM', office: 'PAIR', scope: null as string | null },
    { code: 'MPM', office: 'PAIR', scope: null },
    ...DEPTS.flatMap((d) => [
      { code: `HIMA_${d}_CHAIR`, office: 'CHAIR', scope: d },
      { code: `HIMA_${d}_VICE`, office: 'VICE_CHAIR', scope: d },
    ]),
  ]
  for (const d of defs) {
    const cid = `c-${d.code}`
    await pool.query(
      `INSERT INTO contests (id, election_id, code, title, office, option_type, scope_department_id)
       VALUES ($1,$2,$3,$3,$4,$6,$5)`, [cid, electionId, d.code, d.office, d.scope, d.office === 'PAIR' ? 'PAIR' : 'SINGLE'],
    )
    for (let n = 1; n <= 2; n++) {
      await pool.query(
        `INSERT INTO candidate_options (id, contest_id, number, motto) VALUES ($1,$2,$3,$4)`,
        [`o-${d.code}-${n}`, cid, n, `Kandidat ${n}`],
      )
    }
  }

  // rights: roll + rights per eligible contest ≈ 2,400 entries
  await pool.query(
    `INSERT INTO voter_roll_entries (id, election_id, voter_id, voter_type_snapshot, department_id_snapshot)
     SELECT 'r-'||v.id, $1, v.id, v.voter_type,
            CASE (substring(v.id from '[0-9]+'))::int % 4
              WHEN 0 THEN 'dep-kep' WHEN 1 THEN 'dep-keb' WHEN 2 THEN 'dep-kg' ELSE 'dep-op' END
     FROM voters v`, [electionId],
  )
  await pool.query(
    `INSERT INTO voting_rights (id, roll_entry_id, contest_id, election_id, source)
     SELECT 'vr-'||r.id||'-'||c.id, r.id, c.id, $1, 'DEFAULT'
     FROM voter_roll_entries r, contests c
     WHERE r.election_id=$1 AND (c.scope_department_id IS NULL OR c.scope_department_id = r.department_id_snapshot)`,
    [electionId],
  )
  const { rows: rightCount } = await pool.query<{ c: string }>(
    "SELECT count(*)::text c FROM voting_rights vr JOIN voter_roll_entries r ON r.id=vr.roll_entry_id WHERE r.election_id=$1", [electionId])

  await pool.query(`UPDATE elections SET status='OPEN' WHERE id=$1`, [electionId])
  console.log(`rights: ${rightCount[0]?.c}`)
  return pool
}

async function mixedFlow(pool: Pool) {
  const { rows: contests } = await pool.query<{ id: string; code: string; scope_department_id: string | null }>(
    "SELECT id, code, scope_department_id FROM contests WHERE election_id='e-load'")
  const opts = new Map<string, string[]>()
  for (const c of contests) {
    const o = await pool.query<{ id: string }>(
      'SELECT id FROM candidate_options WHERE contest_id=$1 AND active=TRUE ORDER BY number', [c.id])
    opts.set(c.id, o.rows.map((r) => r.id))
  }
  const university = contests.filter((c) => ['BEM', 'MPM'].includes(c.code)).map((c) => c.id)
  const deptOf = (voter: number): string => DEPTS[(voter % 4 + 4) % 4]
  const DURATION_MS = 4 * 60 * 1000
  const started = Date.now()

  let voteOps = 0
  const voteTimer = setInterval(async () => {
    if (Date.now() - started >= DURATION_MS) return
    for (let k = 0; k < 10; k++) { // 10 votes/s
      // unique voter per visit until 600×4 = 2400 rights exhausted: visit n
      // maps bijectively to (contest-slot, voter) — no double voting by design
      const slot = voteOps % 4 // 0=BEM 1=MPM 2..3 = own Hima contests
      const voter = (voteOps % 600 + Math.floor(voteOps / 600)) % VOTERS
      const dept = deptOf(voter)
      const eligible = university.concat(
        contests.filter((c) => c.scope_department_id === dept).map((c) => c.id))
      const cid = slot === 0 ? university[0]! : slot === 1 ? university[1]! :
        contests.filter((c) => c.scope_department_id === dept).map((c) => c.id)[slot - 2]!
      const o = opts.get(cid) ?? []
      voteOps++
      const t0 = Date.now()
      try {
        await castVote({ voterId: `v-${voter}`, contestId: cid, optionId: o[voteOps % o.length] })
        lats.push({ ms: Date.now() - t0, ok: true })
      } catch {
        // double-vote/conflict lulls count as errors per NFR-01 accounting
        lats.push({ ms: Date.now() - t0, ok: false })
        errors++
      }
    }
  }, 1000)

  // 600 spectators, staggered, poll every 5 s for the last 3 min
  const spectatorLats: number[] = []
  const spectators = Array.from({ length: 600 }, (_, i) => {
    const offset = (i % 60) * 50
    const deadline = started + DURATION_MS - 60 * 1000
    return (async () => {
      let due = Date.now() + offset
      while (due < deadline) {
        const wait = due - Date.now()
        if (wait > 0) await new Promise((r) => setTimeout(r, wait))
        const t0 = Date.now()
        try { await quickCountPayload('e-load') } catch { errors++ }
        spectatorLats.push(Date.now() - t0)
        due += 5000
      }
    })()
  })
  await Promise.all(spectators)
  clearInterval(voteTimer)

  const voteMs = lats.map((l) => l.ms)
  const { rows: [cnt] } = await pool.query<{ b: string; p: string }>(
    `SELECT (SELECT count(*) FROM ballots)::text b, (SELECT count(*) FROM participations)::text p`)
  return {
    scenario: 'mixed',
    voteOps,
    voteP50: Math.round(percentile(voteMs, 50)),
    voteP95: Math.round(percentile(voteMs, 95)),
    voteErrors: lats.filter((l) => !l.ok).length,
    errorRatePct: voteMs.length ? Math.round((lats.filter((l) => !l.ok).length / voteMs.length) * 10000) / 100 : 0,
    spectatorPolls: spectatorLats.length,
    spectatorP95: Math.round(percentile(spectatorLats, 95)),
    ballots: Number(cnt.b),
    participations: Number(cnt.p),
    noDoubleVotes: cnt.b === cnt.p,
    totalErrors: errors,
  }
}

async function loginFlow(pool: Pool) {
  const { rows } = await pool.query<{ id: string; identifier: string; hash: string }>(
    "SELECT id, login_identifier AS identifier, password_hash AS hash FROM users WHERE login_kind='STUDENT'")
  const t0 = Date.now()
  let ok = 0
  let fail = 0
  const lat: number[] = []
  for (const u of rows) {
    const s = Date.now()
    if (await verifyPassword(u.hash, 'Salina-test-2026!')) ok++
    else fail++
    lat.push(Date.now() - s)
  }
  return {
    scenario: 'login',
    logins: rows.length,
    ok,
    fail,
    sweepMs: Date.now() - t0,
    p50: Math.round(percentile(lat, 50)),
    p95: Math.round(percentile(lat, 95)),
  }
}

void (async () => {
  const pool = await setup()
  const result = scenario === 'login' ? await loginFlow(pool) : await mixedFlow(pool)
  console.log(JSON.stringify(result, null, 2))
  await pool.end().catch(() => {})
  await closePool()
  try { execSync(`psql "${ADMIN_DB}" -c "DROP DATABASE ${DB_NAME}"`, { stdio: 'pipe' }) } catch { /* lag */ }
  process.exit(0)
})()
