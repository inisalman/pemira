import { z } from 'zod'
import { requireAdmin, requireCsrf } from '#server/utils/session'
import { parseBody, sendApiError } from '#server/utils/errors'
import { createElection } from '#server/services/elections/elections'

const bodySchema = z.object({
  name: z.string().min(3).max(200),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
})

/** POST /api/v1/admin/elections — create a DRAFT period (P3-01). */
export default defineEventHandler(async (event) => {
  try {
    const admin = await requireAdmin(event)
    requireCsrf(event)
    const body = await parseBody(event, bodySchema)
    const result = await createElection({ actorId: admin.userId, name: body.name, startsAt: body.startsAt, endsAt: body.endsAt })
    return { status: 'OK', id: result.id }
  } catch (err) {
    return sendApiError(event, err)
  }
})
