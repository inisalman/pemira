import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { Pool } from 'pg'
import { closePool } from '../../database/db'
import { createElection, updateElectionSchedule } from '../../server/services/elections/elections'
import { canTransition } from '../../server/services/elections/state'
import { createContest, createCandidateOption, updateCandidateOption } from '../../server/services/elections/candidates'
import { checkReadiness, setReady } from '../../server/services/elections/readiness'
import { proposeAction, approveAction, emergencyPause } from '../../server/services/elections/approvals'
import { ApiError } from '../../server/utils/errors'

/**
 * PH-3 integration tests (TASKLIST P3-07): incomplete candidates, duplicate
 * numbers, PAIR/SINGLE member rules, post-freeze edits, self-approval,
 * stale config version.
 */

const ADMIN_DB = process.env.TEST_ADMIN_DB_URL ?? 'postgres://salman@localhost:5432/postgres'
const TEST_DB = `pemira_el_${randomUUID().slice(0, 8)}`
const DB_URL = `${ADMIN_DB.replace(/\/postgres$/, '')}/${TEST_DB}`

let pool: Pool

function expectApiError(fn: () => Promise<unknown>, code: string): Promise<void> {
  return fn().then(
    () => { throw new Error(`Expected ApiError ${code}`) },
    (err) => {
      const e = err as ApiError
      // Match by code, not instanceof: module may be duplicated via alias imports.
      expect(e?.code ?? (e instanceof Error ? `plain: ${e.message}` : String(e))).toBe(code)
    },
  )
}

beforeAll(async () => {
  // services bind getPool() lazily from env — must point at the same DB as `pool`
  process.env.DATABASE_URL = DB_URL
  process.env.NUXT_DATABASE_URL = DB_URL
  execSync(`psql "${ADMIN_DB}" -c "CREATE DATABASE ${TEST_DB}"`, { stdio: 'pipe' })
  execSync('npx tsx database/migrate.ts', { env: { ...process.env, DATABASE_URL: DB_URL }, stdio: 'pipe' })
  pool = new Pool({ connectionString: DB_URL })
  // actor FK: create test admin users so audit_events.actor_id resolves
  for (const actor of ['a', 'pauser', 'proposer1', 'approver1', 'p1']) {
    await pool.query(
      "INSERT INTO users (id, login_kind, login_identifier, password_hash) VALUES ($1, 'ADMIN', $2, 'x') ON CONFLICT DO NOTHING",
      [actor, actor],
    )
  }
})

afterAll(async () => {
  await pool?.end()
  await closePool() // services hold pooled connections that block DROP
  execSync(`psql "${ADMIN_DB}" -c "DROP DATABASE ${TEST_DB}"`, { stdio: 'pipe' })
})

describe('state machine', () => {
  it('rejects illegal transitions', () => {
    expect(canTransition('DRAFT', 'OPEN')).toBe(false)
    expect(canTransition('OPEN', 'READY')).toBe(false)
    expect(canTransition('PAUSED', 'READY')).toBe(false)
    expect(canTransition('DRAFT', 'READY')).toBe(true)
    expect(canTransition('READY', 'OPEN')).toBe(true)
    expect(canTransition('OPEN', 'PAUSED')).toBe(true)
    expect(canTransition('CLOSED', 'PUBLISHED')).toBe(true)
  })

  it('draft schedule ordering validated', async () => {
    const admin = randomUUID()
    await expectApiError(
      () => createElection({ actorId: admin, name: 'Bad Schedule', startsAt: new Date('2026-10-02T00:00:00Z'), endsAt: new Date('2026-10-01T00:00:00Z') }),
      'VALIDATION_ERROR',
    )
  })

  it('config change only in DRAFT', async () => {
    const { id: electionId } = await createElection({ actorId: 'a', name: 'Freeze Test' })
    await pool.query("UPDATE elections SET status='OPEN' WHERE id=$1", [electionId])
    await expectApiError(
      () => updateElectionSchedule({ actorId: 'a', electionId, name: 'New Name' }),
      'STATE_INVALID',
    )
  })
})

describe('candidate validation', () => {
  let electionId: string
  let bemContest: string
  let chairContest: string

  beforeAll(async () => {
    const { id } = await createElection({ actorId: 'a', name: 'Candidates Test' })
    electionId = id
    const bem = await createContest({ actorId: 'a', electionId, code: 'BEM', title: 'BEM', office: 'PAIR', optionType: 'PAIR' })
    bemContest = bem.id
    const chair = await createContest({ actorId: 'a', electionId, code: 'HIMA_KEP_CHAIR', title: 'Ketua Hima', office: 'CHAIR', optionType: 'SINGLE' })
    chairContest = chair.id
  })

  it('rejects PAIR office with wrong optionType', async () => {
    await expectApiError(
      () => createContest({ actorId: 'a', electionId, code: 'BAD', title: 'Bad', office: 'PAIR', optionType: 'SINGLE' }),
      'VALIDATION_ERROR',
    )
  })

  it('PAIR option requires exactly chair+vice, chair+vice positions', async () => {
    await expectApiError(
      () => createCandidateOption({ actorId: 'a', contestId: bemContest, number: 1, members: [{ name: 'A', position: 'CHAIR' }] }),
      'VALIDATION_ERROR',
    )
    await expectApiError(
      () => createCandidateOption({ actorId: 'a', contestId: bemContest, number: 1, members: [{ name: 'A', position: 'VICE_CHAIR' }, { name: 'B', position: 'VICE_CHAIR' }] }),
      'VALIDATION_ERROR',
    )
    const ok = await createCandidateOption({
      actorId: 'a', contestId: bemContest, number: 1,
      members: [{ name: 'Ketua BEM', position: 'CHAIR' }, { name: 'Wakil BEM', position: 'VICE_CHAIR' }],
      motto: 'm', vision: 'v', mission: 'mi',
    })
    expect(ok.id).toBeTruthy()
  })

  it('duplicate number in same contest rejected', async () => {
    await expectApiError(
      () => createCandidateOption({
        actorId: 'a', contestId: bemContest, number: 1,
        members: [{ name: 'X', position: 'CHAIR' }, { name: 'Y', position: 'VICE_CHAIR' }],
      }),
      'VALIDATION_ERROR',
    )
  })

  it('SINGLE member position must match office', async () => {
    await expectApiError(
      () => createCandidateOption({ actorId: 'a', contestId: chairContest, number: 1, members: [{ name: 'Wrong', position: 'VICE_CHAIR' }] }),
      'VALIDATION_ERROR',
    )
    const ok = await createCandidateOption({ actorId: 'a', contestId: chairContest, number: 1, members: [{ name: 'Ketua Hima', position: 'CHAIR' }] })
    expect(ok.id).toBeTruthy()
  })

  it('updates fail after freeze (READY)', async () => {
    await pool.query("UPDATE elections SET status='READY' WHERE id=$1", [electionId])
    const option = await pool.query<{ id: string }>('SELECT o.id FROM candidate_options o JOIN contests c ON c.id=o.contest_id WHERE c.election_id=$1 LIMIT 1', [electionId])
    await expectApiError(
      () => updateCandidateOption({ actorId: 'a', optionId: option.rows[0].id, motto: 'changed after freeze' }),
      'STATE_INVALID',
    )
  })
})

describe('readiness and approvals', () => {
  beforeAll(async () => {
    for (const actor of ['p1', 'proposer1', 'approver1', 'pauser', 'a']) {
      await pool.query(
        "INSERT INTO users (id, login_kind, login_identifier, password_hash) VALUES ($1, 'ADMIN', $2, 'x') ON CONFLICT DO NOTHING",
        [actor, actor],
      )
    }
  })

  it('incomplete candidates block READY', async () => {
    const { id: electionId } = await createElection({ actorId: 'a', name: 'Ready Test', startsAt: new Date('2026-11-01T00:00:00Z'), endsAt: new Date('2026-11-02T00:00:00Z') })
    const result = await checkReadiness(electionId)
    expect(result.ready).toBe(false)
    expect(result.problems.join(' ')).toContain('10')
  })

  it('self-approval rejected; stale version rejected', async () => {
    const { id: electionId } = await createElection({ actorId: 'a', name: 'Approve Test' })
    await pool.query("UPDATE elections SET status='READY' WHERE id=$1", [electionId])
    // OPEN action executes immediately (single-officer open per D-10 flow shaping)
    const proposal = await proposeAction({ actorId: 'p1', electionId, kind: 'OPEN' })
    expect(proposal.requiresApproval).toBe(false)

    await emergencyPause({ actorId: 'pauser', electionId, reason: 'uji jeda' })
    const recover = await proposeAction({ actorId: 'proposer1', electionId, kind: 'RECOVER' })
    expect(recover.requiresApproval).toBe(true)

    await expectApiError(
      () => approveAction({ approverId: 'proposer1', actionId: recover.id }),
      'FORBIDDEN',
    )

    // bump config_version to make the proposal stale
    await pool.query('UPDATE elections SET config_version = config_version + 1 WHERE id = $1', [electionId])
    await expectApiError(
      () => approveAction({ approverId: 'approver1', actionId: recover.id }),
      'VERSION_STALE',
    )
  })
})
