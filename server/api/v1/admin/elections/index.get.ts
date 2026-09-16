import { requireAdmin } from '#server/utils/session'
import { sendApiError } from '#server/utils/errors'
import { getPool } from '~~/database/db'

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
    setResponseHeader(event, 'cache-control', 'no-store')
    const { rows } = await getPool().query(
      `SELECT id, name, status, starts_at AS "startsAt", ends_at AS "endsAt", config_version AS "configVersion"
       FROM elections ORDER BY created_at DESC, id`,
    )
    return { elections: rows }
  } catch (error) { return sendApiError(event, error) }
})
