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
    <aside :class="$style.aside" aria-hidden="true">
      <span :class="$style.asideMark"><AppIcon name="settings" :size="26" /></span>
      <h2 :class="$style.asideTitle">Ruang panitia</h2>
      <p :class="$style.asideLead">Kelola periode, daftar pemilih, kandidat, hak pilih, dan hasil PEMIRA dalam satu ruang kerja.</p>
      <ul :class="$style.points">
        <li><AppIcon name="calendar" :size="18" /> Atur periode dan status pemilihan.</li>
        <li><AppIcon name="users" :size="18" /> Kelola DPT dan hak pilih pemilih.</li>
        <li><AppIcon name="chart" :size="18" /> Pantau partisipasi dan hasil resmi.</li>
      </ul>
    </aside>
    <div :class="$style.panel">
      <p :class="$style.kicker">Akses panitia</p>
      <h1>Masuk ke panel admin</h1>
      <p :class="$style.sub">Gunakan akun admin yang diberikan untuk mengelola periode pemilihan.</p>
      <AppAlert v-if="notice" kind="info" :message="notice" />
      <AppAlert v-if="error" kind="error" :message="error" />
      <form class="form-fields" @submit.prevent="login">
        <AppInput v-model="identifier" label="ID akun panitia" required autocomplete="username" />
        <AppInput v-model="password" label="Password" type="password" required autocomplete="current-password" />
        <AppButton type="submit" block :loading="busy">{{ busy ? 'Memeriksa akun…' : 'Masuk ke admin' }}</AppButton>
      </form>
      <NuxtLink class="action-link" to="/login">Masuk sebagai pemilih</NuxtLink>
    </div>
  </section>
</template>

<style module>
.wrap {
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 56rem;
  margin: clamp(1.5rem, 6vw, 4rem) auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
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
.asideTitle { margin: var(--space-2) 0 0; color: #fff; font-size: 1.5rem; }
.asideLead { margin: 0; color: #e4f1ea; font-size: 0.95rem; }
.points { display: grid; gap: var(--space-3); margin: var(--space-2) 0 0; padding: 0; list-style: none; }
.points li { display: flex; align-items: flex-start; gap: 0.6rem; color: #eaf4ef; font-size: 0.875rem; line-height: 1.5; }
.points svg { margin-top: 0.1rem; color: #bfe6d4; }
.panel { padding: clamp(1.5rem, 5vw, 2.5rem); }
.kicker { color: var(--color-primary); font-size: .7rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; margin-bottom: var(--space-2); }
.sub { color: var(--color-text-muted); }
.panel h1 { font-size: clamp(1.75rem, 5vw, 2.25rem); }
.panel > .action-link { width: 100%; margin-top: var(--space-2); }
@media (max-width: 48rem) {
  .wrap { grid-template-columns: 1fr; max-width: 30rem; }
  .aside { display: none; }
}
</style>
