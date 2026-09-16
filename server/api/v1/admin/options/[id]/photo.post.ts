import type { H3Event } from 'h3'
import { requireAdmin, requireCsrf } from '#server/utils/session'
import { sendApiError } from '#server/utils/errors'
import { updateCandidatePhoto } from '#server/services/elections/photos'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const admin = await requireAdmin(event)
    requireCsrf(event)
    const optionId = getRouterParam(event, 'id')
    if (!optionId) throw new Error('ID opsi wajib ada.')
    const parts = await readMultipartFormData(event)
    const file = parts?.find(part => part.name === 'file')
    if (!file?.data) throw new Error('Berkas foto wajib diisi.')
    return await updateCandidatePhoto(admin.userId, optionId, Buffer.from(file.data), file.filename ?? 'photo.jpg')
  } catch (err) { return sendApiError(event, err) }
})
