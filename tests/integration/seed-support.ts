import type { Pool } from 'pg'
import { departments, seedVoters } from './fixture-data'

/**
 * Deterministic seeder for integration tests: departments + synthetic voters
 * only. Contests belong to elections, so tests create their own contests
 * directly against their election row (see rights.test.ts beforeEach).
 */
export async function seedFresh(
  pool: Pool,
  opts: { actors: string[]; voterCount?: number },
): Promise<void> {
  for (const d of departments) {
    await pool.query('INSERT INTO departments (id, code, name) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [d.id, d.code, d.name])
  }
  await seedVoters(pool, opts.voterCount ?? 60)
  for (const a of opts.actors) {
    await pool.query(
      "INSERT INTO users (id, login_kind, login_identifier, password_hash) VALUES ($1,'ADMIN',$2,'x') ON CONFLICT DO NOTHING",
      [a, a],
    )
  }
}
