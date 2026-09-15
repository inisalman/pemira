/**
 * Minimal app plugin: registers Nuxt app-ready hook that logs boot.
 * Also serves as the only-entry file so Nuxt generates plugins.d.ts with
 * at least one named plugin (works around empty-list TS1110 in .nuxt).
 */
export default defineNuxtPlugin({
  name: 'app-health-boot',
  setup(nuxtApp) {
    if (import.meta.client) {
      nuxtApp.hook('app:mounted', () => {
        // eslint-disable-next-line no-console
        console.debug('[pemira] app mounted')
      })
    }
  },
})
