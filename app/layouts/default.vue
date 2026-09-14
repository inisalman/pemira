<script setup lang="ts">
const config = useRuntimeConfig()
</script>

<template>
  <div :class="$style.shell">
    <header :class="$style.header">
      <NuxtLink to="/" :class="$style.brand">{{ config.public.appName }}</NuxtLink>
    </header>
    <main :class="$style.main">
      <slot />
    </main>
    <footer :class="$style.footer">
      <p>Pemilihan umum mahasiswa — hasil sementara bukan penetapan pemenang.</p>
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
