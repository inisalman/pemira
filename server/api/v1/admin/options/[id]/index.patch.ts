import { z } from 'zod'
import { requireAdmin, requireCsrf } from '#server/utils/session'
import { parseBody, sendApiError } from '#server/utils/errors'
import { updateCandidateOption } from '#server/services/elections/candidates'

const bodySchema = z.object({
  number: z.coerce.number().int().min(1).optional(),
  members: z.array(z.object({
    name: z.string().min(1).max(200),
    position: z.enum(['CHAIR', 'VICE_CHAIR']),
  })).min(1).max(2).optional(),
  motto: z.string().max(500).optional(),
  vision: z.string().max(2000).optional(),
  mission: z.string().max(2000).optional(),
  programs: z.string().max(2000).optional(),
})

/** PATCH /api/v1/admin/options/:id — edit candidate in DRAFT (P3-04). */
export default defineEventHandler(async (event) => {
  try {
    const admin = await requireAdmin(event)
    requireCsrf(event)
    const id = getRouterParam(event, 'id')
    if (!id) apiError('VALIDATION_ERROR', 'ID opsi wajib ada.')
    const body = await parseBody(event, bodySchema)
    await updateCandidateOption({ actorId: admin.userId, optionId: id, ...body })
    return { status: 'OK' }
  } catch (err) {
    return sendApiError(event, err)
  }
})
