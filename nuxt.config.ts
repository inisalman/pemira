// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  // MVP renders in the browser; Nitro still serves the API in production builds.
  ssr: false,

  devtools: { enabled: true },

  // Secrets live in private runtimeConfig (override via .env / environment).
  // runtimeConfig.public only carries browser-safe values.
  runtimeConfig: {
    databaseUrl: '',
    sessionSecret: '',
    public: {
      appName: 'PEMIRA'
    }
  }
})
