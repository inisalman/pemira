import { z } from 'zod'
import { requireAdmin, requireCsrf } from '#server/utils/session'
import { parseBody, sendApiError } from '#server/utils/errors'
import { updateElectionSchedule } from '#server/services/elections/elections'

const bodySchema = z.object({
  name: z.string().min(3).max(200).optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
})

/** PATCH /api/v1/admin/elections/:id — change DRAFT-only config (P3-01). */
export default defineEventHandler(async (event) => {
  try {
    const admin = await requireAdmin(event)
    requireCsrf(event)
    const id = getRouterParam(event, 'id')
    if (!id) apiError('VALIDATION_ERROR', 'ID periode wajib ada.')
    const body = await parseBody(event, bodySchema)
    await updateElectionSchedule({ actorId: admin.userId, electionId: id, ...body })
    return { status: 'OK' }
  } catch (err) {
    return sendApiError(event, err)
  }
})
