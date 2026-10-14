import type { H3Event } from 'h3'

/**
 * Baseline security headers for every response (API, SPA shell, and static
 * assets). Applied in Nitro so it also covers error responses and files
 * served outside the Vue router.
 *
 * CSP notes for this SPA (ssr: false):
 * - script-src 'self': Nuxt serves its bundle from /_nuxt/ on the same origin.
 *   No third-party script origin is used; add explicit origins here if a CDN
 *   is introduced later.
 * - style-src allows 'unsafe-inline' because Vue injects scoped/module styles
 *   inline; this does not weaken script execution controls.
 * - img-src allows data: for the inline SVG/photo fallbacks.
 * - frame-ancestors 'none' blocks clickjacking of the voting pages.
 * - object-src 'none' and base-uri 'self' close common injection vectors.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

export default defineEventHandler((event: H3Event) => {
  setResponseHeader(event, 'Content-Security-Policy', CSP)
  setResponseHeader(event, 'X-Content-Type-Options', 'nosniff')
  setResponseHeader(event, 'X-Frame-Options', 'DENY')
  setResponseHeader(event, 'Referrer-Policy', 'no-referrer')
  // Limit powerful browser features the app never needs.
  setResponseHeader(event, 'Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  // HSTS only over HTTPS in production; harmless header, honored by browsers
  // only on secure transport.
  if (process.env.NODE_ENV === 'production') {
    setResponseHeader(event, 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
})
