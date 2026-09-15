import type { H3Event } from 'h3'
import { requireAdmin, requireCsrf } from '#server/utils/session'
import { sendApiError, apiError, parseBody } from '#server/utils/errors'
import { z } from 'zod'
import { createOfficialSnapshot, exportResults } from '#server/services/results/results'
import { lockElection, requireTransition, type ElectionStatus } from '#server/services/elections/state'
import { getPool } from '~~/database/db'
import { recordAuditEvent } from '#server/services/audit/audit'

/**
 * POST /api/v1/admin/elections/:id/results — admin results ops (P6-04/P6-05).
 * Body action=SNAPSHOT  → reconcile + versioned official snapshot (CLOSED only)
 *        action=PUBLISH → stamp published_at on latest snapshot (CLOSED, needs approval via actions endpoint per D-10; here re-checked)
 *        action=EXPORT  → export payload (official or interim) with audit
 */
const bodySchema = z.object({
  action: z.enum(['SNAPSHOT', 'PUBLISH', 'EXPORT']),
  official: z.boolean().optional(),
})

export default defineEventHandler(async (event: H3Event) => {
  try {
    const admin = await requireAdmin(event)
    requireCsrf(event)
    const electionId = getRouterParam(event, 'id')
    if (!electionId) apiError('VALIDATION_ERROR', 'ID periode wajib ada.')
    const body = await parseBody(event, bodySchema)
    const pool = getPool()
    const { rows } = await pool.query<{ status: string }>(
      'SELECT status FROM elections WHERE id = $1', [electionId],
    )
    const status = rows[0]?.status
    if (!status) apiError('NOT_FOUND', 'Periode tidak ditemukan.')

    if (body.action === 'SNAPSHOT') {
      if (status !== 'CLOSED') {
        apiError('STATE_INVALID', 'Snapshot resmi hanya saat CLOSED.')
      }
      const result = await createOfficialSnapshot({ actorId: admin.userId, electionId })
      return { ...result, status: 'OK' }
    }
    if (body.action === 'PUBLISH') {
      if (status !== 'CLOSED') {
        apiError('STATE_INVALID', 'Publikasi hanya saat CLOSED.')
      }
      const result = await publishElection(pool, electionId, 'PUBLISHED', admin.userId)
      return { ...result, status: 'OK' }
    }
    // EXPORT
    const payload = await exportResults({ actorId: admin.userId, electionId, official: body.official ?? false })
    return { status: 'OK', result: payload }
  } catch (err) {
    return sendApiError(event, err)
  }
})

async function publishElection(pool: import('pg').Pool, electionId: string, to: ElectionStatus, actorId: string) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const current = await lockElection(client, electionId)
    requireTransition(current.status, to)
    await client.query(`UPDATE elections SET status = $2 WHERE id = $1`, [electionId, to])
    await client.query(`UPDATE result_snapshots SET published_at = clock_timestamp() WHERE election_id = $1 AND version = (SELECT max(version) FROM result_snapshots WHERE election_id = $1)`, [electionId])
    await recordAuditEvent(client, { actorId, electionId, action: `ADMIN_STATUS_${to}`, target: electionId, changes: { from: current.status, to } })
    await client.query('COMMIT')
    return { from: current.status, to }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
