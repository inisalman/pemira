<script setup lang="ts">
const config = useRuntimeConfig()

const links = [
  { to: '/voter', label: 'Dashboard' },
]
</script>

<template>
  <div :class="$style.shell">
    <header :class="$style.header">
      <NuxtLink to="/voter" :class="$style.brand">{{ config.public.appName }}</NuxtLink>
      <nav :class="$style.nav" aria-label="Navigasi pemilih">
        <NuxtLink v-for="link in links" :key="link.to" :to="link.to">{{ link.label }}</NuxtLink>
      </nav>
    </header>
    <main :class="$style.main">
      <slot />
    </main>
  </div>
</template>

<style module>
.shell { min-height: 100vh; display: flex; flex-direction: column; }
.header {
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}
.brand { font-weight: 700; font-size: var(--text-lg); color: var(--color-primary); text-decoration: none; }
.nav { display: flex; gap: var(--space-4); }
.nav a { color: var(--color-text); text-decoration: none; font-weight: 500; }
.nav a:hover, .nav a.router-link-active { color: var(--color-primary); text-decoration: underline; }
.main { flex: 1; width: 100%; max-width: 56rem; margin: 0 auto; padding: var(--space-4); }
</style>
