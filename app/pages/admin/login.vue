<script setup lang="ts">
definePageMeta({ layout: 'default' })
const route = useRoute()
const session = useSession()
const { request } = useApi()
const identifier = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')
const notice = computed(() => String(route.query.reason) === 'expired' ? 'Sesi panitia berakhir. Masuk kembali untuk melanjutkan.' : '')
async function login() {
  if (busy.value) return
  busy.value = true; error.value = ''
  try {
    await request('/api/v1/auth/login', { loginKind: 'ADMIN', identifier: identifier.value.trim(), password: password.value })
    const user = await session.refresh()
    if (user?.loginKind === 'ADMIN') await navigateTo('/admin')
    else error.value = 'Akun tidak memiliki akses panitia.'
  } catch (cause) { error.value = apiErrorMessage(cause) }
  finally { busy.value = false }
}
</script>

<template>
  <section :class="$style.wrap">
    <p :class="$style.kicker">Akses panitia</p>
    <h1>Masuk ke panel admin</h1>
    <p>Gunakan akun admin yang diberikan untuk mengelola periode pemilihan.</p>
    <AppAlert v-if="notice" kind="info" :message="notice" />
    <AppAlert v-if="error" kind="error" :message="error" />
    <form class="form-fields" @submit.prevent="login">
      <AppInput v-model="identifier" label="ID akun panitia" required autocomplete="username" />
      <AppInput v-model="password" label="Password" type="password" required autocomplete="current-password" />
      <AppButton type="submit" block :loading="busy">{{ busy ? 'Memeriksa akun…' : 'Masuk ke admin' }}</AppButton>
    </form>
    <NuxtLink class="action-link" to="/login">Masuk sebagai pemilih</NuxtLink>
  </section>
</template>

<style module>
.wrap { max-width: 28rem; margin: clamp(2rem, 8vw, 5rem) auto; padding: clamp(1.5rem, 5vw, 2.5rem); border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: white; box-shadow: var(--shadow-md); }.kicker { color: var(--color-primary); font-size: .7rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; margin-bottom: var(--space-2); }.wrap > p:not(.kicker) { color: var(--color-text-muted); }.wrap h1 { font-size: clamp(1.75rem, 5vw, 2.25rem); }
</style>
