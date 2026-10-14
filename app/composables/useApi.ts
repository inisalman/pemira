type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

interface RequestOptions {
  method?: HttpMethod
  timeout?: number
}

/** Read the CSRF double-submit token from the (non-httpOnly) cookie. */
function readCsrfToken(): string {
  const value = document.cookie.split('; ').find(item => item.startsWith('pemira_csrf='))?.slice(12)
  return value ? decodeURIComponent(value) : ''
}

/**
 * Single API client for the SPA. Attaches the CSRF header to every
 * state-changing request (read fresh from the cookie after login rotation,
 * not from a cached ref) and keeps retry disabled so failed votes/mutations
 * are never silently replayed.
 */
export function useApi() {
  /**
   * JSON request. GET when `body` is omitted; otherwise the given method
   * (default POST). The CSRF header is sent for every non-GET call.
   */
  async function request<T>(path: string, body?: Record<string, unknown>, options: RequestOptions = {}) {
    const method: HttpMethod = options.method ?? (body === undefined ? 'GET' : 'POST')
    const token = method === 'GET' ? '' : readCsrfToken()
    return await $fetch<T>(path, {
      method,
      body,
      headers: token ? { 'x-csrf-token': token } : {},
      retry: 0,
      timeout: options.timeout ?? 15_000,
    })
  }

  /**
   * Multipart upload (file imports, candidate photos). Always carries the
   * CSRF header; default method POST, longer default timeout for large files.
   */
  async function upload<T>(path: string, form: FormData, options: RequestOptions = {}) {
    return await $fetch<T>(path, {
      method: options.method ?? 'POST',
      body: form,
      headers: { 'x-csrf-token': readCsrfToken() },
      retry: 0,
      timeout: options.timeout ?? 30_000,
    })
  }

  return { request, upload, csrfToken: readCsrfToken }
}
