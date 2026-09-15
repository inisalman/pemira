import type { H3Event } from 'h3'
import { requireAdmin, requireCsrf } from '#server/utils/session'
import { sendApiError } from '#server/utils/errors'
import { importVotersPreview, commitVoterImport } from '#server/services/identity/voter-import'

/**
 * POST /api/v1/admin/voters/import — parse a .xlsx/.csv upload and stage a
 * validate-preview-then-commit flow (P4-02/P4-03/P4-04).
 * `mode=validate` (default) → preview with per-row report, nothing written.
 * `mode=commit&batchId=…` → reuse the validated batch only if data_file_hash
 * matches, atomic insert, per-row add/update/skip counts, never touches
 * passwords or rights already adjusted by admins.
 */
export default defineEventHandler(async (event: H3Event) => {
  try {
    const admin = await requireAdmin(event)
    requireCsrf(event)
    const q = getQuery(event)
    if (q.mode === 'commit') return await commitVoterImport(admin.userId, event)
    return await importVotersPreview(admin.userId, event)
  } catch (err) {
    return sendApiError(event, err)
  }
})
