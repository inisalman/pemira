import type { H3Event } from 'h3'
import { z } from 'zod'
import { requireAdmin } from '#server/utils/session'
import { sendApiError } from '#server/utils/errors'
import { paginationSchema } from '#server/utils/schemas'
import { listVoters } from '#server/services/identity/voters'

const querySchema = paginationSchema.extend({
  search: z.string().max(120).optional(),
  voterType: z.enum(['STUDENT', 'LECTURER']).optional(),
  departmentCode: z.string().max(32).optional(),
  activeStatus: z.enum(['true', 'false']).optional(),
})

/** GET /api/v1/admin/voters — paginated/filterable list (P4-01). */
export default defineEventHandler(async (event: H3Event) => {
  try {
    await requireAdmin(event)
    const q = querySchema.parse(getQuery(event))
    const result = await listVoters({
      search: q.search,
      voterType: q.voterType,
      departmentCode: q.departmentCode,
      activeStatus: q.activeStatus === undefined ? undefined : q.activeStatus === 'true',
      page: q.page,
      pageSize: q.pageSize,
    })
    return result
  } catch (err) {
    return sendApiError(event, err)
  }
})
