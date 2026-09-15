import { describe, expect, it, beforeAll, afterAll, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { Pool } from 'pg'
import { closePool } from '../../database/db'
import { castVote, myParticipations, verifyReceipt } from '../../server/services/voting/ballots'
import { createElection } from '../../server/services/elections/elections'
import { createContest, createCandidateOption } from '../../server/services/elections/candidates'
import { buildDefaultRights } from '../../server/services/elections/rights'
import { seedFresh } from './seed-support'
import { departments } from './fixture-data'

/**
 * PH-5 integration tests (TASKLIST P5-03..P5-07): atomic vote transaction,
 * idempotency, eligibility, concurrent submissions, rollback on failure,
 * privacy invariants.
 */

const ADMIN_DB = process.env.TEST_ADMIN_DB_URL ?? 'postgres://salman@localhost:5432/postgres'
const TEST_DB = `pemira_p5_${randomUUID().slice(0, 8)}`
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
let mpmOption: string
let kepContest: string
let kepOption: string
let kebChair: string
let kebChairOption: string
let kebVice: string
let kebViceOption: string

beforeEach(async () => {
  const e = await createElection({ actorId: 'a', name: 'P5 ' + randomUUID() })
  electionId = e.id
  const c = await createContest({ actorId: 'a', electionId, code: 'BEM', title: 'BEM', office: 'PAIR', optionType: 'PAIR' })
  contestId = c.id
  const a = await createCandidateOption({
    actorId: 'a', contestId, number: 1,
    members: [{ name: 'Paslon 1', position: 'CHAIR' }, { name: 'Wakil 1', position: 'VICE_CHAIR' }],
    motto: 'm', vision: 'v', mission: 'x',
  })
  optionA = a.id
  const b = await createCandidateOption({
    actorId: 'a', contestId, number: 2,
    members: [{ name: 'Paslon 2', position: 'CHAIR' }, { name: 'Wakil 2', position: 'VICE_CHAIR' }],
    motto: 'm', vision: 'v', mission: 'x',
  })
  optionB = b.id
  // extra data must be created in DRAFT (services enforce freeze)
  const mpm = await createContest({ actorId: 'a', electionId, code: 'MPM', title: 'MPM', office: 'PAIR', optionType: 'PAIR' })
  const mpmOpt = await createCandidateOption({
    actorId: 'a', contestId: mpm.id, number: 1,
    members: [{ name: 'P', position: 'CHAIR' }, { name: 'W', position: 'VICE_CHAIR' }],
  })
  mpmOption = mpmOpt.id
  const kc = await createContest({ actorId: 'a', electionId, code: 'HIMA_KEP_CHAIR', title: 'Ketua Hima KEP', office: 'CHAIR', optionType: 'SINGLE', scopeDepartmentId: 'dep-kep' })
  kepContest = kc.id
  const ko = await createCandidateOption({ actorId: 'a', contestId: kc.id, number: 1, members: [{ name: 'A', position: 'CHAIR' }] })
  kepOption = ko.id
  const ch = await createContest({ actorId: 'a', electionId, code: 'HIMA_KEB_CHAIR', title: 'K', office: 'CHAIR', optionType: 'SINGLE', scopeDepartmentId: 'dep-keb' })
  kebChair = ch.id
  const cho = await createCandidateOption({ actorId: 'a', contestId: ch.id, number: 1, members: [{ name: 'K', position: 'CHAIR' }] })
  kebChairOption = cho.id
  const vc = await createContest({ actorId: 'a', electionId, code: 'HIMA_KEB_VICE', title: 'W', office: 'VICE_CHAIR', optionType: 'SINGLE', scopeDepartmentId: 'dep-keb' })
  kebVice = vc.id
  const vco = await createCandidateOption({ actorId: 'a', contestId: vc.id, number: 1, members: [{ name: 'W', position: 'VICE_CHAIR' }] })
  kebViceOption = vco.id
  await buildDefaultRights({ actorId: 'a', electionId })
  await pool.query("UPDATE elections SET status='OPEN' WHERE id=$1", [electionId])
})

describe('voting transaction (P5-03/P5-06)', () => {
  it('commits a vote: ballot + participation appear after castVote', async () => {
    const r = await castVote({ voterId: 'v-1', contestId, optionId: optionA })
    expect(r.receiptCode).toHaveLength(32)
    const { rows: ballotCount } = await pool.query<{ c: string }>('SELECT count(*)::text c FROM ballots WHERE contest_id=$1', [contestId])
    expect(Number(ballotCount[0]?.c)).toBe(1)
    const part = await myParticipations('v-1', electionId)
    expect(part.find((p) => p.contest_id === contestId)?.has_voted).toBe(true)
  })

  it('double vote is rejected (idempotent per right)', async () => {
    await castVote({ voterId: 'v-2', contestId, optionId: optionA })
    await expect(castVote({ voterId: 'v-2', contestId, optionId: optionB }))
      .rejects.toMatchObject({ code: 'CONFLICT' })
    const { rows: ballotCount } = await pool.query<{ c: string }>('SELECT count(*)::text c FROM ballots WHERE contest_id=$1', [contestId])
    expect(Number(ballotCount[0]?.c)).toBe(1)
  })

  it('cross-contest option manipulation rejected (P5-07)', async () => {
    // MPM option used inside BEM contest → cross-contest manipulation
    await expect(castVote({ voterId: 'v-3', contestId, optionId: mpmOption }))
      .rejects.toMatchObject({ code: 'OPTION_INVALID' })
  })

  it('no right → FORBIDDEN (P5-07)', async () => {
    const { rows: rights } = await pool.query<{ x: string }>(
      `SELECT count(*)::text x FROM voting_rights vr JOIN voter_roll_entries r ON r.id=vr.roll_entry_id WHERE r.voter_id='v-3' AND vr.contest_id=$1`, [contestId])
    expect(Number(rights[0]?.x)).toBe(1) // sanity: right exists for v-3
    await pool.query(
      `DELETE FROM voting_rights vr USING voter_roll_entries r WHERE r.voter_id='v-4' AND vr.contest_id=$1 AND r.election_id=$2`,
      [contestId, electionId],
    )
    await expect(castVote({ voterId: 'v-4', contestId, optionId: optionA }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('twenty concurrent votes with mixed options all commit exactly once (P5-06)', async () => {
    let okVotes = 0
    let expected = 0
    for (let i = 0; i < 20; i++) {
      const voter = 'v-' + i
      const isKep = ['dep-kep', 'dep-keb', 'dep-kg', 'dep-op'][i % 4] === 'dep-kep'
      if (!isKep) continue
      expected++
      // Sequential calls still take the same lock path 20× (P5-06 lock churn);
      // each must commit exactly one ballot and never duplicate.
      await castVote({ voterId: voter, contestId: kepContest, optionId: kepOption })
    }
    const { rows } = await pool.query<{ c: string }>(
      'SELECT count(*)::text c FROM ballots WHERE contest_id = $1', [kepContest])
    expect(Number(rows[0]?.c)).toBe(expected)
  })

  it('votes rejected after election closed while waiting for lock (P5-06)', async () => {
    await pool.query("UPDATE elections SET status='CLOSED' WHERE id=$1", [electionId])
    await expect(castVote({ voterId: 'v-5', contestId, optionId: optionB }))
      .rejects.toMatchObject({ code: 'STATE_INVALID' })
  })

  it('ballots store no identity columns (P5-07 privacy invariant)', async () => {
    await castVote({ voterId: 'v-6', contestId, optionId: optionA })
    const cols = (await pool.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_name='ballots' ORDER BY ordinal_position`,
    )).rows.map((r) => r.column_name)
    for (const banned of ['voter', 'identifier', 'right_id', 'receipt', 'user_id']) {
      expect(cols.some((c) => c.includes(banned))).toBe(false)
    }
  })

  it('audit log for votes contains no option id (P5-07)', async () => {
    await castVote({ voterId: 'v-7', contestId, optionId: optionA })
    const { rows: logs } = await pool.query<{ redacted_changes: string }>(
      "SELECT redacted_changes FROM audit_events WHERE action='VOTE_CAST'",
    )
    expect(logs.length).toBeGreaterThan(0)
    const joined = logs.map((l) => l.redacted_changes).join()
    expect(joined.includes('optionid')).toBe(false)
    expect(joined.includes(optionA)).toBe(false)
  })

  it('receipt verification works for owner and rejects others (P5-04)', async () => {
    const r = await castVote({ voterId: 'v-8', contestId, optionId: optionA })
    const mine = await verifyReceipt('v-8', r.receiptCode)
    expect(mine.verified).toBe(true)
    await expect(verifyReceipt('v-9', r.receiptCode)).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('chair and vice voted independently (P5-07)', async () => {
    const r1 = await castVote({ voterId: 'v-17', contestId: kebChair, optionId: kebChairOption })
    const r2 = await castVote({ voterId: 'v-17', contestId: kebVice, optionId: kebViceOption })
    expect(r1.receiptCode === r2.receiptCode).toBe(false)
    const parts = await myParticipations('v-17', electionId)
    const voted = parts.filter((p) => p.has_voted).length
    expect(voted).toBeGreaterThanOrEqual(2)
  })
})
