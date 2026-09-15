import type { H3Event } from 'h3'
import { requireAdmin } from '#server/utils/session'
import { sendApiError } from '#server/utils/errors'
import { buildVoterTemplateXlsx } from '#server/services/identity/voter-import'

/** GET /api/v1/admin/voters/template — download the .xlsx import template (P4-02). */
export default defineEventHandler(async (event: H3Event) => {
  try {
    await requireAdmin(event)
    const buf = await buildVoterTemplateXlsx()
    setResponseHeader(event, 'content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    setResponseHeader(event, 'content-disposition', 'attachment; filename="templat-impor-pemilih.xlsx"')
    return buf
  } catch (err) {
    return sendApiError(event, err)
  }
})
