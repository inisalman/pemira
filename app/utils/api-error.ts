export function apiErrorMessage(error: unknown): string {
  const value = error as { data?: { data?: { error?: { message?: string } }; error?: { message?: string } } }
  return value?.data?.data?.error?.message ?? value?.data?.error?.message
    ?? 'Tidak dapat terhubung ke server. Periksa koneksi dan coba lagi.'
}

export function isUnauthorized(error: unknown): boolean {
  const value = error as { status?: number; statusCode?: number }
  return value?.status === 401 || value?.statusCode === 401
}
