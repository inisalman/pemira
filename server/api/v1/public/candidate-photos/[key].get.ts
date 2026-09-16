import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import type { H3Event } from 'h3'
import { candidatePhotoPath } from '#server/services/elections/photos'

export default defineEventHandler(async (event: H3Event) => {
  const key = getRouterParam(event, 'key')
  const path = key ? candidatePhotoPath(key) : null
  if (!path) return sendError(event, createError({ statusCode: 404, statusMessage: 'Foto tidak ditemukan' }))
  try {
    const info = await stat(path)
    setResponseHeader(event, 'content-type', 'image/webp')
    setResponseHeader(event, 'content-length', info.size)
    setResponseHeader(event, 'cache-control', 'public, max-age=31536000, immutable')
    return sendStream(event, createReadStream(path))
  } catch { return sendError(event, createError({ statusCode: 404, statusMessage: 'Foto tidak ditemukan' })) }
})
