import { z } from 'zod'
import { requireAdmin, requireCsrf } from '#server/utils/session'
import { parseBody, sendApiError } from '#server/utils/errors'
import { createCandidateOption } from '#server/services/elections/candidates'

const membersSchema = z.array(z.object({
  name: z.string().min(1).max(200),
  position: z.enum(['CHAIR', 'VICE_CHAIR']),
})).min(1).max(2)

const bodySchema = z.object({
  number: z.coerce.number().int().min(1),
  members: membersSchema,
  motto: z.string().max(500).optional(),
  vision: z.string().max(2000).optional(),
  mission: z.string().max(2000).optional(),
  programs: z.string().max(2000).optional(),
})

/** POST /api/v1/admin/contests/:id/options — create candidate pair/individual (P3-02/04). */
export default defineEventHandler(async (event) => {
  try {
    const admin = await requireAdmin(event)
    requireCsrf(event)
    const contestId = getRouterParam(event, 'id')
    if (!contestId) apiError('VALIDATION_ERROR', 'ID kontes wajib ada.')
    const body = await parseBody(event, bodySchema)
    const result = await createCandidateOption({ actorId: admin.userId, contestId, ...body })
    return { status: 'OK', id: result.id }
  } catch (err) {
    return sendApiError(event, err)
  }
})
