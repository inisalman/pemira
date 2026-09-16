<script setup lang="ts">
const config = useRuntimeConfig()
</script>

<template>
  <div :class="$style.shell">
    <a class="skip-link" href="#main-content">Lewati navigasi</a>
    <header :class="$style.header">
      <div :class="$style.headerInner">
        <NuxtLink to="/" :class="$style.brand"><span :class="$style.brandMark">P</span><span>{{ config.public.appName }}</span></NuxtLink>
        <NuxtLink to="/admin/login" :class="$style.adminLink">Panel panitia</NuxtLink>
      </div>
    </header>
    <main id="main-content" :class="$style.main" tabindex="-1">
      <slot />
    </main>
    <footer :class="$style.footer">
      <p>Pemilihan umum mahasiswa. Hasil sementara bukan penetapan pemenang.</p>
    </footer>
  </div>
</template>

<style module>
.shell { min-height: 100vh; display: flex; flex-direction: column; }
.header {
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}
.headerInner { width: 100%; max-width: 72rem; min-height: 4rem; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); }
.brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 700;
  font-size: var(--text-lg);
  color: var(--color-primary);
  text-decoration: none;
}
.brandMark { display: grid; place-items: center; width: 1.75rem; height: 1.75rem; border-radius: 0.35rem; background: var(--color-primary); color: white; font-size: var(--text-sm); }
.adminLink { margin-left: auto; font-size: var(--text-sm); }
.main {
  flex: 1;
  width: 100%;
  max-width: 72rem;
  margin: 0 auto;
  padding: var(--space-4);
}
.footer {
  padding: var(--space-4);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}
</style>
