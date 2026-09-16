import { getPool } from '~~/database/db'
import { sendApiError } from '#server/utils/errors'

export default defineEventHandler(async (event) => {
  try {
    setResponseHeader(event, 'cache-control', 'no-store')
    const { rows } = await getPool().query(
      `SELECT id, name, status, starts_at AS "startsAt", ends_at AS "endsAt"
       FROM elections WHERE status IN ('READY', 'OPEN', 'PAUSED', 'CLOSED', 'PUBLISHED')
       ORDER BY starts_at DESC NULLS LAST, created_at DESC`,
    )
    return { elections: rows }
  } catch (error) { return sendApiError(event, error) }
})
