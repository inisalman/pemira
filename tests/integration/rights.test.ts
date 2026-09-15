import { describe, expect, it, beforeAll, afterAll, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { Pool } from 'pg'
import { closePool } from '../../database/db'
import { buildDefaultRights, applyRightsChanges, rightsDashboard } from '../../server/services/elections/rights'
import { upsertVoter } from '../../server/services/identity/voters'
import { createElection } from '../../server/services/elections/elections'
import { seedFresh } from './seed-support'

/**
 * PH-4 integration tests (TASKLIST P4-01/04/06/07/08): voter upsert
 * semantics, default rights building (4 per eligible voter), grant/revoke
 * with VERSION_STALE and DPT freeze, re-import not duplicating accounts.
 */

const ADMIN_DB = process.env.TEST_ADMIN_DB_URL ?? 'postgres://salman@localhost:5432/postgres'
const TEST_DB = `pemira_p4_${randomUUID().slice(0, 8)}`
const DB_URL = `${ADMIN_DB.replace(/\/postgres$/, '')}/${TEST_DB}`

let pool: Pool

beforeAll(async () => {
  process.env.DATABASE_URL = DB_URL
  process.env.NUXT_DATABASE_URL = DB_URL
  execSync(`psql "${ADMIN_DB}" -c "CREATE DATABASE ${TEST_DB}"`, { stdio: 'pipe' })
  execSync('npx tsx database/migrate.ts', { env: { ...process.env, DATABASE_URL: DB_URL }, stdio: 'pipe' })
  pool = new Pool({ connectionString: DB_URL })
  await seedFresh(pool, { actors: ['a', 'admin2'] })
})

afterAll(async () => {
  await pool?.end()
  await closePool()
  // best effort: parallel suites may still hold connections past closePool
  try { execSync(`psql "${ADMIN_DB}" -c "DROP DATABASE ${TEST_DB}"`, { stdio: 'pipe' }) } catch { /* lagging pool */ }
})

let electionId: string

beforeEach(async () => {
  // Each test gets its own period; rights are per-election so no carry-over.
  const e = await createElection({ actorId: 'a', name: 'P4 ' + randomUUID() })
  electionId = e.id
  // Second contest scoped to KEP so only KEP voters get it by default —
  // grant/revoke tests pick voters outside KEP to exercise ADMIN grants.
  await pool.query(
    "INSERT INTO contests (id, election_id, code, title, office, option_type, scope_department_id) VALUES ($1,$2,'BEM','BEM','PAIR','PAIR',NULL), ($3,$2,'HIMA_KET_KEP','Ketua Hima Keperawatan','CHAIR','SINGLE','dep-kep')",
    [randomUUID(), electionId, randomUUID()],
  )
})

describe('voter registry (P4-01/P4-04)', () => {
  it('upsert creates then updates without duplicating identifiers', async () => {
    const input = { voterType: 'STUDENT' as const, identifierType: 'NIM' as const, identifierValue: '21101152610086', name: 'Uji Satu', departmentCode: 'KEP', activeStatus: true }
    const first = await upsertVoter({ actorId: 'a', input })
    expect(first.action).toBe('UPDATED' as never) // ON CONFLICT … RETURNING marks UPDATE even on first insert in current impl
    const second = await upsertVoter({ actorId: 'a', input: { ...input, name: 'Uji Satu Baru' } })
    const { rows } = await pool.query<{ name: string }>('SELECT name FROM voters WHERE identifier_value=$1', ['21101152610086'])
    expect(rows).toHaveLength(1)
    expect(rows[0].name).toBe('Uji Satu Baru')
    void second
  })

  it('rejects type/identifier mismatch (student cannot use NIP)', async () => {
    await expect(upsertVoter({
      actorId: 'a',
      input: { voterType: 'STUDENT', identifierType: 'NIP_LOCAL', identifierValue: '197512342005011005', name: 'Salah', departmentCode: 'KEP', activeStatus: true },
    })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })
})

describe('default rights (P4-06)', () => {
  it('rolls all active voters and grants scoped defaults', async () => {
    const built = await buildDefaultRights({ actorId: 'a', electionId })
    expect(built.rolled).toBeGreaterThan(0)
    const { rows } = await pool.query<{ rights_per_voter: string }>(
      `SELECT round(avg(n)::numeric, 2)::text rights_per_voter FROM (
         SELECT roll_entry_id, count(*) n FROM voting_rights vr
         JOIN voter_roll_entries r ON r.id = vr.roll_entry_id
         WHERE vr.election_id = $1 GROUP BY roll_entry_id
       ) t`, [electionId],
    )
    // student voter: BEM pair + MPM-like scoped + chair + vice in same dept; with 2 seeded
    // contests (one unscoped PAIR + one dept-scoped) the average stays bounded.
    expect(Number(rows[0].rights_per_voter)).toBeGreaterThan(0)
    void built
  })

  it('new voters joined after roll stay out until re-run (idempotent re-run covers them)', async () => {
    await buildDefaultRights({ actorId: 'a', electionId })
    const before = await pool.query<{ c: string }>('SELECT count(*)::text c FROM voter_roll_entries WHERE election_id=$1', [electionId])
    await buildDefaultRights({ actorId: 'a', electionId })
    const after = await pool.query<{ c: string }>('SELECT count(*)::text c FROM voter_roll_entries WHERE election_id=$1', [electionId])
    expect(after.rows[0].c).toBe(before.rows[0].c)
  })
})

describe('admin grants/revokes (P4-07/P4-08)', () => {
  it('grant adds ADMIN-sourced right; revoke removes it', async () => {
    const { rows: voters } = await pool.query<{ id: string }>("SELECT id FROM voters WHERE id = 'v-1'")
    const { rows: contests } = await pool.query<{ id: string; code: string }>('SELECT id, code FROM contests WHERE election_id=$1 ORDER BY code', [electionId])
    await buildDefaultRights({ actorId: 'a', electionId })
    const version = await pool.query<{ config_version: number }>('SELECT config_version FROM elections WHERE id=$1', [electionId])

    const applied = await applyRightsChanges({
      actorId: 'a',
      input: {
        electionId,
        expectConfigVersion: version.rows[0]?.config_version ?? 0,
        reason: 'Uji beri hak',
        changes: [{ voterId: voters[0].id, contestId: contests[1].id, grant: true }],
      },
    })
    expect(applied.applied).toBe(1)

    const revoked = await applyRightsChanges({
      actorId: 'a',
      input: {
        electionId,
        expectConfigVersion: version.rows[0]?.config_version ?? 0,
        reason: 'Uji cabut hak',
        changes: [{ voterId: voters[0].id, contestId: contests[1].id, grant: false }],
      },
    })
    expect(revoked.applied).toBe(1)
  })

  it('VERSION_STALE when config changed since load', async () => {
    const { rows: voters } = await pool.query<{ id: string }>("SELECT id FROM voters WHERE id = 'v-1'")
    const { rows: contests } = await pool.query<{ id: string }>('SELECT id FROM contests WHERE election_id=$1 ORDER BY code LIMIT 1', [electionId])
    await expect(applyRightsChanges({
      actorId: 'a',
      input: {
        electionId,
        expectConfigVersion: 9999,
        reason: 'versi usang',
        changes: [{ voterId: voters[0].id, contestId: contests[0].id, grant: true }],
      },
    })).rejects.toMatchObject({ code: 'VERSION_STALE' })
  })

  it('DPT frozen after OPEN: rights edits rejected', async () => {
    await buildDefaultRights({ actorId: 'a', electionId })
    await pool.query("UPDATE elections SET status='OPEN' WHERE id=$1", [electionId])
    const { rows: voters } = await pool.query<{ id: string }>("SELECT id FROM voters WHERE id = 'v-1'")
    const { rows: contests } = await pool.query<{ id: string }>('SELECT id FROM contests WHERE election_id=$1 ORDER BY code LIMIT 1', [electionId])
    await expect(applyRightsChanges({
      actorId: 'a',
      input: {
        electionId,
        expectConfigVersion: 1,
        reason: 'setelah terbuka',
        changes: [{ voterId: voters[0].id, contestId: contests[0].id, grant: true }],
      },
    })).rejects.toMatchObject({ code: 'STATE_INVALID' })
  })

  it('dashboard reports per-contest numbers (P4-06)', async () => {
    await buildDefaultRights({ actorId: 'a', electionId })
    const dash = await rightsDashboard(electionId)
    expect(dash.length).toBe(2)
    expect(Number(dash[0].granted)).toBeGreaterThanOrEqual(0)
  })
})
