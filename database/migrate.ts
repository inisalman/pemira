import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getPool, closePool } from './db'

/**
 * Minimal forward-only SQL migration runner.
 * Each migration runs inside a transaction; applied migrations are recorded
 * in schema_migrations. Proves a fresh database can be rebuilt from scratch.
 */

const MIGRATIONS_DIR = join(import.meta.dirname, 'migrations')

async function ensureSchemaTable(pool: import('pg').Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
    )
  `)
}

async function main(): Promise<void> {
  const pool = getPool()
  await ensureSchemaTable(pool)

  const { rows } = await pool.query<{ id: string }>('SELECT id FROM schema_migrations ORDER BY id')
  const applied = new Set(rows.map((r) => r.id))

  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort()
  if (files.length === 0) {
    console.log('No migrations found.')
  }

  for (const file of files) {
    if (applied.has(file)) {
      continue
    }
    const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8')
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [file])
      await client.query('COMMIT')
      console.log(`Applied: ${file}`)
    } catch (err) {
      await client.query('ROLLBACK')
      throw new Error(`Migration ${file} failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      client.release()
    }
  }
  console.log('Migrations complete.')
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exitCode = 1
  })
  .finally(() => closePool())
