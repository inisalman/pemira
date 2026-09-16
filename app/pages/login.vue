<script setup lang="ts">
const route = useRoute()
const session = useSession()
const { request } = useApi()
const identifier = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')
const notice = computed(() => ({
  expired: 'Sesi berakhir. Masuk kembali untuk melanjutkan. Status suara tersimpan di server.',
  password: 'Password berhasil diganti. Masuk dengan password baru.',
  unavailable: 'Sesi belum dapat diperiksa. Periksa koneksi lalu masuk kembali.',
}[String(route.query.reason)] ?? ''))
async function login() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await request('/api/v1/auth/login-voter', { identifier: identifier.value.trim(), password: password.value })
    const user = await session.refresh()
    password.value = ''
    if (user) await navigateTo(user.loginKind === 'ADMIN' ? '/admin' : '/voter')
    else error.value = 'Sesi belum terbentuk. Pastikan browser mengizinkan cookie, lalu masuk kembali.'
  } catch (cause) { error.value = apiErrorMessage(cause) }
  finally { busy.value = false }
}
</script>

<template>
  <section :class="$style.wrap">
    <h1>Masuk</h1>
    <p>Gunakan akun dan password yang dibagikan panitia.</p>
    <AppAlert v-if="notice" kind="info" :message="notice" />
    <AppAlert v-if="error" kind="error" :message="error" />
    <form :class="$style.form" @submit.prevent="login">
      <fieldset class="form-fields" :disabled="busy">
      <AppInput v-model="identifier" label="NIM atau NIP lokal" required inputmode="numeric" autocomplete="username" hint="Tuliskan identitas lengkap, termasuk nol di awal." />
      <AppInput v-model="password" label="Password" type="password" required autocomplete="current-password" />
      <AppButton type="submit" block :loading="busy">{{ busy ? 'Memeriksa akun…' : 'Masuk' }}</AppButton>
      </fieldset>
    </form>
  </section>
</template>

<style module>
.wrap { max-width: 24rem; margin: 0 auto; }
.form { display: flex; flex-direction: column; gap: var(--space-4); margin-top: var(--space-4); }
</style>
