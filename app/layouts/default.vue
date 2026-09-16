<script setup lang="ts">
const config = useRuntimeConfig()
</script>

<template>
  <div :class="$style.shell">
    <a class="skip-link" href="#main-content">Lewati navigasi</a>
    <header :class="$style.header">
      <NuxtLink to="/" :class="$style.brand">{{ config.public.appName }}</NuxtLink>
      <NuxtLink to="/admin/login" :class="$style.adminLink">Panel panitia</NuxtLink>
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
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}
.brand {
  font-weight: 700;
  font-size: var(--text-lg);
  color: var(--color-primary);
  text-decoration: none;
}
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
}
</style>
