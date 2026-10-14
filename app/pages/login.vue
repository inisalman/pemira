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
    <aside :class="$style.aside" aria-hidden="true">
      <span :class="$style.asideMark"><AppIcon name="shield-check" :size="26" /></span>
      <h2 :class="$style.asideTitle">PEMIRA</h2>
      <p :class="$style.asideLead">Pemilihan Raya Mahasiswa Poltekkes Kemenkes Jakarta I. Satu suara menentukan arah kepemimpinan mahasiswa.</p>
      <ul :class="$style.points">
        <li><AppIcon name="lock" :size="18" /> Suara bersifat rahasia dan tidak terhubung ke identitas Anda.</li>
        <li><AppIcon name="check-circle" :size="18" /> Satu pilihan per kontes, tercatat secara aman.</li>
        <li><AppIcon name="id-card" :size="18" /> Masuk dengan NIM atau NIP lokal dari panitia.</li>
      </ul>
    </aside>
    <div :class="$style.panel">
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
    </div>
  </section>
</template>

<style module>
.wrap {
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 56rem;
  margin: clamp(1.5rem, 6vw, 4rem) auto;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}
.aside {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: clamp(1.75rem, 4vw, 2.75rem);
  color: #fff;
  background:
    radial-gradient(26rem 18rem at 110% 0%, #0e6e50 0%, transparent 70%),
    linear-gradient(150deg, var(--color-primary-strong), var(--color-primary));
}
.asideMark { display: grid; place-items: center; width: 3rem; height: 3rem; border-radius: 0.85rem; background: rgba(255,255,255,0.16); color: #fff; }
.asideTitle { margin: var(--space-2) 0 0; color: #fff; font-size: 1.5rem; letter-spacing: 0.02em; }
.asideLead { margin: 0; color: #e4f1ea; font-size: 0.95rem; }
.points { display: grid; gap: var(--space-3); margin: var(--space-2) 0 0; padding: 0; list-style: none; }
.points li { display: flex; align-items: flex-start; gap: 0.6rem; color: #eaf4ef; font-size: 0.875rem; line-height: 1.5; }
.points svg { margin-top: 0.1rem; color: #bfe6d4; }
.panel { padding: clamp(1.5rem, 5vw, 2.5rem); }
.heading { margin-bottom: var(--space-6); }
.heading h1 { margin-bottom: var(--space-2); font-size: clamp(1.75rem, 5vw, 2.25rem); }
.heading p:last-child { margin: 0; color: var(--color-text-muted); }
.eyebrow { margin: 0 0 var(--space-2); color: var(--color-primary); font-size: var(--text-sm); font-weight: 800; letter-spacing: 0.1em; }
.form { display: flex; flex-direction: column; gap: var(--space-4); margin-top: var(--space-4); }
@media (max-width: 48rem) {
  .wrap { grid-template-columns: 1fr; max-width: 30rem; }
  .aside { display: none; }
}
@media (max-width: 30rem) { .wrap { margin-block: 1rem; } }
</style>
