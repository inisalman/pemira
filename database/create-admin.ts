import { randomUUID } from 'node:crypto'
import { Pool } from 'pg'
import { hashPassword } from '../server/utils/password'

const [identifier, password] = process.argv.slice(2)

if (!identifier || !password) {
  console.error('Usage: npx tsx database/create-admin.ts <identifier> <password>')
  process.exit(1)
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? process.env.NUXT_DATABASE_URL })

try {
  const passwordHash = await hashPassword(password)
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const existing = await client.query<{ id: string }>(
      "SELECT id FROM users WHERE login_kind = 'ADMIN' AND login_identifier = $1 FOR UPDATE",
      [identifier],
    )

    const userId = existing.rows[0]?.id ?? randomUUID()
    if (existing.rowCount) {
      await client.query('UPDATE users SET password_hash = $1, active = TRUE WHERE id = $2', [passwordHash, userId])
    } else {
      await client.query(
        "INSERT INTO users (id, login_kind, login_identifier, password_hash) VALUES ($1, 'ADMIN', $2, $3)",
        [userId, identifier, passwordHash],
      )
    }

    await client.query(
      "INSERT INTO role_assignments (user_id, role) VALUES ($1, 'ADMIN') ON CONFLICT DO NOTHING",
      [userId],
    )
    await client.query('COMMIT')
    console.log(`admin account ready: ${identifier}`)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
} finally {
  await pool.end()
}
