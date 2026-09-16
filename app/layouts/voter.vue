<script setup lang="ts">
const config = useRuntimeConfig()

const links = [
  { to: '/voter', label: 'Dashboard' },
]
</script>

<template>
  <div :class="$style.shell">
    <a class="skip-link" href="#main-content">Lewati navigasi</a>
    <header :class="$style.header">
      <NuxtLink to="/voter" :class="$style.brand"><span :class="$style.brandMark">P</span><span>{{ config.public.appName }}</span></NuxtLink>
      <nav :class="$style.nav" aria-label="Navigasi pemilih">
        <NuxtLink v-for="link in links" :key="link.to" :to="link.to">{{ link.label }}</NuxtLink>
      </nav>
      <SessionActions />
    </header>
    <main id="main-content" :class="$style.main" tabindex="-1">
      <slot />
    </main>
  </div>
</template>

<style module>
.shell { min-height: 100vh; display: flex; flex-direction: column; }
.header {
  padding: 0 var(--space-4);
  min-height: 4rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}
.brand { display: inline-flex; align-items: center; gap: var(--space-2); font-weight: 700; font-size: var(--text-lg); color: var(--color-primary); text-decoration: none; }
.brandMark { display: grid; place-items: center; width: 1.75rem; height: 1.75rem; border-radius: 0.35rem; background: var(--color-primary); color: white; font-size: var(--text-sm); }
.nav { display: flex; gap: var(--space-2); }
.nav a { color: var(--color-text); text-decoration: none; font-weight: 500; }
.nav a { padding: 0.5rem 0.75rem; border-radius: var(--radius); }
.nav a:hover, .nav a.router-link-active { color: var(--color-primary); background: var(--color-primary-soft); text-decoration: none; }
.main { flex: 1; width: 100%; max-width: 56rem; margin: 0 auto; padding: var(--space-4); }
@media (max-width: 42rem) { .header { align-items: flex-start; padding-block: var(--space-3); } .nav { order: 3; width: 100%; } .session-actions { margin-left: auto; } }
</style>
