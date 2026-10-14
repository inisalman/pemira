import type { H3Event } from 'h3'

/**
 * Baseline security headers for every response (API, SPA shell, and static
 * assets). Applied in Nitro so it also covers error responses and files
 * served outside the Vue router.
 *
 * CSP notes for this SPA (ssr: false):
 * - script-src needs 'unsafe-inline': the Nuxt SPA shell embeds an inline
 *   bootstrap/payload script whose content (and therefore hash) changes every
 *   build, so hash/nonce pinning is not maintainable here. 'self' covers the
 *   /_nuxt/ bundle; static.cloudflareinsights.com is the Cloudflare Web
 *   Analytics beacon auto-injected while the domain is orange-clouded.
 * - style-src allows 'unsafe-inline' (Vue scoped/module styles + Nuxt inlined
 *   critical CSS) plus fonts.googleapis.com (landing typography).
 * - font-src allows fonts.gstatic.com (Google Fonts binaries).
 * - connect-src allows cloudflareinsights.com (beacon reporting endpoint).
 * - img-src allows data: for the inline SVG/photo fallbacks.
 * - frame-ancestors 'none' blocks clickjacking of the voting pages.
 * - object-src 'none' and base-uri 'self' close common injection vectors.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://cloudflareinsights.com",
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
