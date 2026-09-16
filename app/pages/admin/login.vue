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
.wrap { max-width: 24rem; margin: 0 auto; }.kicker { color: var(--color-primary); font-weight: 700; margin-bottom: var(--space-1); }.wrap > p:not(.kicker) { color: var(--color-text-muted); }
</style>
