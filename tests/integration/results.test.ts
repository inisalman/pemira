import { describe, expect, it, beforeAll, afterAll, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { Pool } from 'pg'
import { closePool } from '../../database/db'
import { castVote } from '../../server/services/voting/ballots'
import { createElection } from '../../server/services/elections/elections'
import { createContest, createCandidateOption } from '../../server/services/elections/candidates'
import { buildDefaultRights } from '../../server/services/elections/rights'
import {
  aggregateElection, createOfficialSnapshot, exportResults,
  quickCountPayload, reconcileElection,
} from '../../server/services/results/results'
import { seedFresh } from './seed-support'

/**
 * PH-6 integration tests (TASKLIST P6-01/04/06/07): aggregation incl. zero
 * votes, no-divide-by-zero, reconciliation, snapshot publishing gates,
 * export audit, identity-free public payload.
 */

const ADMIN_DB = process.env.TEST_ADMIN_DB_URL ?? 'postgres://salman@localhost:5432/postgres'
const TEST_DB = `pemira_p6_${randomUUID().slice(0, 8)}`
const DB_URL = `${ADMIN_DB.replace(/\/postgres$/, '')}/${TEST_DB}`

let pool: Pool

beforeAll(async () => {
  process.env.DATABASE_URL = DB_URL
  process.env.NUXT_DATABASE_URL = DB_URL
  execSync(`psql "${ADMIN_DB}" -c "CREATE DATABASE ${TEST_DB}"`, { stdio: 'pipe' })
  execSync('npx tsx database/migrate.ts', { env: { ...process.env, DATABASE_URL: DB_URL }, stdio: 'pipe' })
  pool = new Pool({ connectionString: DB_URL })
  await seedFresh(pool, { actors: ['a'], voterCount: 40 })
})

afterAll(async () => {
  await pool?.end()
  await closePool()
  // best effort: parallel suites may still hold connections past closePool
  try { execSync(`psql "${ADMIN_DB}" -c "DROP DATABASE ${TEST_DB}"`, { stdio: 'pipe' }) } catch { /* lagging pool */ }
})

let electionId: string
let contestId: string
let optionA: string
let optionB: string

beforeEach(async () => {
  const e = await createElection({ actorId: 'a', name: 'P6 ' + randomUUID() })
  electionId = e.id
  const c = await createContest({ actorId: 'a', electionId, code: 'BEM', title: 'BEM', office: 'PAIR', optionType: 'PAIR' })
  contestId = c.id
  const a = await createCandidateOption({
    actorId: 'a', contestId, number: 1,
    members: [{ name: 'P1', position: 'CHAIR' }, { name: 'W1', position: 'VICE_CHAIR' }],
    motto: 'm', vision: 'v', mission: 'x',
  })
  optionA = a.id
  const b = await createCandidateOption({
    actorId: 'a', contestId, number: 2,
    members: [{ name: 'P2', position: 'CHAIR' }, { name: 'W2', position: 'VICE_CHAIR' }],
    motto: 'm', vision: 'v', mission: 'x',
  })
  optionB = b.id
  await buildDefaultRights({ actorId: 'a', electionId })
})

describe('aggregation (P6-01)', () => {
  it('zero votes → all options present with 0 and percent 0 (no divide by zero)', async () => {
    const results = await aggregateElection(electionId)
    const bem = results.find((r) => r.code === 'BEM')
    expect(bem?.options).toHaveLength(2)
    expect(bem?.totalBallots).toBe(0)
    expect(bem?.participation).toBe(0)
    for (const opt of bem?.options ?? []) {
      expect(opt.votes).toBe(0)
      expect(opt.percent).toBe(0)
    }
  })

  it('votes counted per option; participation reflects actual voters', async () => {
    await pool.query("UPDATE elections SET status='OPEN' WHERE id=$1", [electionId])
    await castVote({ voterId: 'v-1', contestId, optionId: optionA })
    await castVote({ voterId: 'v-2', contestId, optionId: optionA })
    await castVote({ voterId: 'v-5', contestId, optionId: optionB })
    const results = await aggregateElection(electionId)
    const bem = results.find((r) => r.code === 'BEM')
    expect(bem?.totalBallots).toBe(3)
    const a = bem?.options.find((o) => o.optionId === optionA)
    expect(a?.votes).toBe(2)
    const pct = (a?.percent ?? 0)
    expect(pct).toBeCloseTo(66.67, 1)
  })
})

describe('reconciliation and snapshots (P4/6-04)', () => {
  it('ok when ballots equal participations', async () => {
    await pool.query("UPDATE elections SET status='OPEN' WHERE id=$1", [electionId])
    await castVote({ voterId: 'v-1', contestId, optionId: optionA })
    const { anomalies } = await reconcileElection(electionId)
    expect(anomalies).toHaveLength(0)
  })

  it('anomaly detected when ballot exists without participation', async () => {
    await pool.query("UPDATE elections SET status='OPEN' WHERE id=$1", [electionId])
    await castVote({ voterId: 'v-1', contestId, optionId: optionA })
    // simulate drift: delete participation to break counting
    await pool.query('DELETE FROM participations WHERE contest_id=$1', [contestId])
    const { anomalies } = await reconcileElection(electionId)
    expect(anomalies.length).toBeGreaterThan(0)
  })

  it('snapshot blocked while OPEN, allowed when CLOSED, version++ per run (P6-06)', async () => {
    await pool.query("UPDATE elections SET status='OPEN' WHERE id=$1", [electionId])
    await expect(createOfficialSnapshot({ actorId: 'a', electionId }))
      .rejects.toMatchObject({ code: 'STATE_INVALID' })
    await pool.query("UPDATE elections SET status='CLOSED' WHERE id=$1", [electionId])
    const first = await createOfficialSnapshot({ actorId: 'a', electionId })
    expect(first.version).toBe(1)
    const second = await createOfficialSnapshot({ actorId: 'a', electionId })
    expect(second.version).toBe(2)
    expect(second.checksum).not.toBe(first.checksum)
  })

  it('quick count blocked before OPEN (P6-06)', async () => {
    const fresh = await createElection({ actorId: 'a', name: 'Fresh ' + randomUUID() })
    await expect(quickCountPayload(fresh.id)).rejects.toMatchObject({ code: 'STATE_INVALID' })
  })

  it('import/export audited (P6-05)', async () => {
    await pool.query("UPDATE elections SET status='CLOSED' WHERE id=$1", [electionId])
    await createOfficialSnapshot({ actorId: 'a', electionId })
    const payload = await exportResults({ actorId: 'a', electionId, official: true })
    expect((payload as { kind?: string }).kind).toBe('OFFICIAL')
    const { rows } = await pool.query<{ c: string }>(
      "SELECT count(*)::text c FROM audit_events WHERE action='ADMIN_RESULTS_EXPORT'",
    )
    expect(Number(rows[0]?.c)).toBeGreaterThan(0)
  })

  it('public quick-count payload carries no voter/right identifiers (P6-07)', async () => {
    await castVote({ voterId: 'v-3', contestId, optionId: optionA }).catch(() => undefined)
    await pool.query("UPDATE elections SET status='OPEN' WHERE id=$1", [electionId])
    const payload = await quickCountPayload(electionId)
    const text = JSON.stringify(payload)
    const identifiers = (await pool.query<{ v: string }>('SELECT identifier_value AS v FROM voters')).rows
    for (const { v } of identifiers.slice(0, 50)) {
      expect(text.includes(v)).toBe(false)
    }
    const rightIds = (await pool.query<{ id: string }>('SELECT id FROM voting_rights LIMIT 50')).rows
    for (const { id } of rightIds) {
      expect(text.includes(id)).toBe(false)
    }
  })
})
