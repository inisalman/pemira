import type { H3Event } from 'h3'
import { z } from 'zod'
import { requireAdmin, requireCsrf } from '#server/utils/session'
import { parseBody, sendApiError } from '#server/utils/errors'
import { buildDefaultRights, applyRightsChanges, rightsChangeSchema } from '#server/services/elections/rights'

const bodySchema = z.union([
  z.object({ action: z.literal('BUILD_DEFAULT') }),
  rightsChangeSchema,
])

/** POST /api/v1/admin/elections/:id/rights — build defaults or apply grant/revoke batch (P4-06/P4-07). */
export default defineEventHandler(async (event: H3Event) => {
  try {
    const admin = await requireAdmin(event)
    requireCsrf(event)
    const electionId = getRouterParam(event, 'id')
    if (!electionId) apiError('VALIDATION_ERROR', 'ID periode wajib ada.')
    const body = await parseBody(event, bodySchema)
    if ('action' in body && body.action === 'BUILD_DEFAULT') {
      const result = await buildDefaultRights({ actorId: admin.userId, electionId })
      return { ...result, status: 'OK' }
    }
    // After the BUILD_DEFAULT branch, body is the rightsChangeSchema shape.
    const input = { ...body, electionId } as z.infer<typeof rightsChangeSchema>
    const result = await applyRightsChanges({ actorId: admin.userId, input })
    return { ...result, status: 'OK' }
  } catch (err) {
    return sendApiError(event, err)
  }
})
