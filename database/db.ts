import { Pool } from 'pg'

/**
 * Shared pool for migration/seed tooling and server services.
 * Pool maximum is 5 connections per SDD section 11 (app budget alongside
 * PostgreSQL max_connections 20). Never create a pool per request.
 */

let pool: Pool | null = null

export function getPool(databaseUrl?: string): Pool {
  if (!pool) {
    const url = databaseUrl ?? process.env.DATABASE_URL ?? process.env.NUXT_DATABASE_URL
    if (!url) {
      throw new Error('Missing DATABASE_URL (or NUXT_DATABASE_URL) for database connection')
    }
    pool = new Pool({
      connectionString: url,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    })
  }
  return pool
}

/** Close the shared pool (used by tests and CLI tools on exit). */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
