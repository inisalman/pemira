export function useApi() {
  async function request<T>(path: string, body?: Record<string, unknown>) {
    // Read the current cookie after login rotation, rather than a cached useCookie ref.
    const token = document.cookie.split('; ').find(value => value.startsWith('pemira_csrf='))?.slice(12)
    return await $fetch<T>(path, {
      method: body === undefined ? 'GET' : 'POST',
      body,
      headers: token ? { 'x-csrf-token': decodeURIComponent(token) } : {},
      retry: 0,
      timeout: 15_000,
    })
  }
  return { request }
}
