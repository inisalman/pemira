<script setup lang="ts">
const { request } = useApi()
const session = useSession()
const currentPassword = ref('')
const newPassword = ref('')
const confirmation = ref('')
const busy = ref(false)
const error = ref('')
async function save() {
  error.value = ''
  if (newPassword.value.length < 12) { error.value = 'Password baru minimal 12 karakter.'; return }
  if (newPassword.value !== confirmation.value) { error.value = 'Konfirmasi password belum sama.'; return }
  busy.value = true
  try {
    await request('/api/v1/auth/change-password', { currentPassword: currentPassword.value, newPassword: newPassword.value })
    session.user.value = null
    currentPassword.value = newPassword.value = confirmation.value = ''
    await navigateTo('/login?reason=password')
  } catch (cause) { error.value = apiErrorMessage(cause) }
  finally { busy.value = false }
}
</script>

<template>
  <section class="account-page">
    <header><p class="eyebrow">Keamanan akun</p><h1>Ganti password</h1><p>Setelah password diganti, semua sesi akan berakhir. Hak pilih dan suara yang sudah masuk tetap tersimpan.</p></header>
    <AppAlert v-if="error" kind="error" :message="error" />
    <form @submit.prevent="save">
      <fieldset class="form-fields" :disabled="busy">
        <AppInput v-model="currentPassword" label="Password saat ini" type="password" autocomplete="current-password" required />
        <AppInput v-model="newPassword" label="Password baru" type="password" autocomplete="new-password" hint="Minimal 12 karakter." required />
        <AppInput v-model="confirmation" label="Ulangi password baru" type="password" autocomplete="new-password" required />
        <AppButton type="submit" :loading="busy">Simpan password</AppButton>
      </fieldset>
    </form>
  </section>
</template>

<style scoped>
.account-page { max-width: 32rem; margin: clamp(1rem, 5vw, 3rem) auto; padding: clamp(1.25rem, 5vw, 2.5rem); border: 1px solid var(--color-border); border-radius: var(--radius-xl); background: white; box-shadow: var(--shadow-sm); }.account-page header { padding-bottom: var(--space-4); border-bottom: 1px solid var(--color-border); }.account-page header > p:not(.eyebrow) { color: var(--color-text-muted); margin-bottom: 0; }.eyebrow { margin: 0 0 .5rem; color: var(--color-primary); font-size: .7rem; font-weight: 800; letter-spacing: .09em; text-transform: uppercase; }
</style>
