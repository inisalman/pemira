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
  <section :class="$style.wrap" aria-labelledby="login-title">
    <div :class="$style.heading">
      <p :class="$style.eyebrow">AKSES PEMILIH</p>
      <h1 id="login-title">Masuk untuk memilih</h1>
      <p>Gunakan NIM atau NIP lokal dan password yang dibagikan panitia.</p>
    </div>
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
.wrap { max-width: 28rem; margin: clamp(2rem, 8vw, 5rem) auto; padding: var(--space-6); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); }
.heading { margin-bottom: var(--space-6); }
.heading h1 { margin-bottom: var(--space-2); font-size: clamp(1.75rem, 5vw, 2.25rem); }
.heading p:last-child { margin: 0; color: var(--color-text-muted); }
.eyebrow { margin: 0 0 var(--space-2); color: var(--color-primary); font-size: var(--text-sm); font-weight: 700; letter-spacing: 0.1em; }
.form { display: flex; flex-direction: column; gap: var(--space-4); margin-top: var(--space-4); }
@media (max-width: 30rem) { .wrap { padding: var(--space-4); border-inline: 0; border-radius: 0; margin-inline: calc(var(--space-4) * -1); } }
</style>
