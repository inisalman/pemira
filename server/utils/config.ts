/**
 * Server-side config access. All secrets come from private runtimeConfig
 * (mapped from NUXT_* environment variables in nuxt.config.ts).
 * Never expose these through API responses or runtimeConfig.public.
 */
export function getDatabaseUrl(config: { databaseUrl?: string }): string {
  const url = config.databaseUrl
  if (!url) {
    throw new Error('Missing runtimeConfig.databaseUrl — set NUXT_DATABASE_URL')
  }
  return url
}

export function getSessionSecret(config: { sessionSecret?: string }): string {
  const secret = config.sessionSecret
  if (!secret) {
    throw new Error('Missing runtimeConfig.sessionSecret — set NUXT_SESSION_SECRET')
  }
  return secret
}
