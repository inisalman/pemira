import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { Pool } from 'pg'

/**
 * Integration test: prove migrations run on an empty database (TASKLIST P0-07).
 * Creates a uniquely-named throwaway database, runs the migration runner,
 * then drops it. Requires a local PostgreSQL reachable with DATABASE_URL.
 */

const ADMIN_DB = process.env.TEST_ADMIN_DB_URL ?? 'postgres://salman@localhost:5432/postgres'
const TEST_DB = `pemira_test_${randomUUID().slice(0, 8)}`

let pool: Pool

beforeAll(() => {
  execSync(`psql "${ADMIN_DB}" -c "CREATE DATABASE ${TEST_DB}"`, { stdio: 'pipe' })
  pool = new Pool({ connectionString: `${ADMIN_DB.replace(/\/postgres$/, '')}/${TEST_DB}` })
})

afterAll(async () => {
  await pool?.end()
  execSync(`psql "${ADMIN_DB}" -c "DROP DATABASE ${TEST_DB}"`, { stdio: 'pipe' })
})

describe('migrations on empty database', () => {
  it('applies all migrations and creates the full schema', () => {
    const out = execSync(`npx tsx database/migrate.ts`, {
      env: { ...process.env, DATABASE_URL: `${ADMIN_DB.replace(/\/postgres$/, '')}/${TEST_DB}` },
      stdio: 'pipe',
    }).toString()
    expect(out).toContain('Migrations complete.')

    return pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`,
    ).then(({ rows }) => {
      const tables = rows.map((r) => r.table_name)
      for (const expected of [
        'departments', 'voters', 'users', 'sessions', 'role_assignments', 'elections', 'contests',
        'candidate_options', 'candidate_members', 'voter_roll_entries', 'voting_rights',
        'participations', 'ballots', 'admin_actions', 'result_snapshots', 'audit_events',
        'import_batches', 'schema_migrations',
      ]) {
        expect(tables).toContain(expected)
      }
    })
  })

  it('is idempotent when re-run', () => {
    const out = execSync(`npx tsx database/migrate.ts`, {
      env: { ...process.env, DATABASE_URL: `${ADMIN_DB.replace(/\/postgres$/, '')}/${TEST_DB}` },
      stdio: 'pipe',
    }).toString()
    expect(out).toContain('Migrations complete.')
    expect(out).not.toContain('Applied:')
  })
})
