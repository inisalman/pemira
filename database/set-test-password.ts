import { hashPassword } from '../server/utils/password'
import { Pool } from 'pg'

/** Dev utility: set a known password on a seeded account for manual testing. */
const [identifier, password] = process.argv.slice(2)
if (!identifier || !password) {
  console.error('Usage: npx tsx database/set-test-password.ts <identifier> <password>')
  process.exit(1)
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const h = await hashPassword(password)
const { rowCount } = await pool.query('UPDATE users SET password_hash=$1 WHERE login_identifier=$2', [h, identifier])
console.log(rowCount ? `password set for ${identifier}` : `account ${identifier} not found`)
await pool.end()
