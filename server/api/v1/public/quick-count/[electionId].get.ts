import type { H3Event } from 'h3'
import { apiError, sendApiError } from '#server/utils/errors'
import { quickCountPayload } from '#server/services/results/results'

/**
 * GET /api/v1/public/quick-count/:electionId — public quick count (P6-02).
 * No session. Per-election cache, 5 s TTL. When stale, the FIRST caller
 * triggers one shared refresh (single-flight) while others are served the
 * previous payload (x-cache: STALE) instead of stampeding the database.
 */

const TTL_MS = 5_000
type Entry = { payload: unknown; expires: number; refreshing?: Promise<unknown> }
const cache = new Map<string, Entry>()

export default defineEventHandler(async (event: H3Event) => {
  try {
    const electionId = getRouterParam(event, 'electionId')
    if (!electionId) apiError('VALIDATION_ERROR', 'ID periode wajib ada.')

    const now = Date.now()
    let entry = cache.get(electionId)
    if (entry && entry.expires > now) {
      setResponseHeader(event, 'x-cache', 'HIT')
      return entry.payload
    }
    if (entry?.refreshing) {
      setResponseHeader(event, 'x-cache', 'STALE')
      return entry.payload
    }
    if (!entry) {
      // fresh miss: no previous payload to serve — refresh inline
      const payload = await quickCountPayload(electionId)
        .finally(() => { cache.delete(electionId) })
      cache.set(electionId, { payload, expires: Date.now() + TTL_MS })
      setResponseHeader(event, 'x-cache', 'MISS')
      return payload
    }
    // stale entry: start a single-flight refresh, serve stale payload now
    const refreshing = quickCountPayload(electionId)
    entry.refreshing = refreshing
    setResponseHeader(event, 'x-cache', 'STALE')
    void refreshing
      .then((payload) => cache.set(electionId, { payload, expires: Date.now() + TTL_MS }))
      .catch(() => { /* keep stale value; next request retries */ })
      .finally(() => {
        const e = cache.get(electionId)
        if (e) e.refreshing = undefined
      })
    return entry.payload
  } catch (err) {
    return sendApiError(event, err)
  }
})
