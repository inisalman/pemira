import { z } from 'zod'
import { requireAdmin, requireCsrf } from '#server/utils/session'
import { parseBody, sendApiError } from '#server/utils/errors'
import { createContest } from '#server/services/elections/candidates'

const bodySchema = z.object({
  code: z.string().min(2).max(64),
  title: z.string().min(3).max(200),
  office: z.enum(['PAIR', 'CHAIR', 'VICE_CHAIR']),
  optionType: z.enum(['PAIR', 'SINGLE']),
  scopeDepartmentId: z.string().max(64).optional().nullable(),
})

/** POST /api/v1/admin/elections/:id/contests — create contest in DRAFT (P3-01/02). */
export default defineEventHandler(async (event) => {
  try {
    const admin = await requireAdmin(event)
    requireCsrf(event)
    const electionId = getRouterParam(event, 'id')
    if (!electionId) apiError('VALIDATION_ERROR', 'ID periode wajib ada.')
    const body = await parseBody(event, bodySchema)
    const result = await createContest({
      actorId: admin.userId,
      electionId,
      code: body.code,
      title: body.title,
      office: body.office,
      optionType: body.optionType,
      scopeDepartmentId: body.scopeDepartmentId ?? null,
    })
    return { status: 'OK', id: result.id }
  } catch (err) {
    return sendApiError(event, err)
  }
})
