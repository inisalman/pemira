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
      <NuxtLink to="/voter" :class="$style.brand"><span :class="$style.brandMark">P</span><span>{{ config.public.appName }}<small>Portal pemilih</small></span></NuxtLink>
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
.shell { min-height: 100vh; display: flex; flex-direction: column; background: #faf8ff; }
.header {
  padding: 0 max(1rem, calc((100vw - 68rem) / 2));
  min-height: 4rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}
.brand { display: inline-flex; align-items: center; gap: var(--space-2); font-weight: 800; font-size: var(--text-lg); color: var(--color-primary); text-decoration: none; line-height: 1.1; }
.brand small { display: block; margin-top: .25rem; color: var(--color-text-muted); font-size: .6rem; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; }
.brandMark { display: grid; place-items: center; width: 1.75rem; height: 1.75rem; border-radius: 0.35rem; background: var(--color-primary); color: white; font-size: var(--text-sm); }
.nav { display: flex; gap: var(--space-2); }
.nav a { color: var(--color-text); text-decoration: none; font-weight: 500; }
.nav a { padding: 0.5rem 0.75rem; border-radius: var(--radius); }
.nav a:hover, .nav a.router-link-active { color: var(--color-primary); background: var(--color-primary-soft); text-decoration: none; }
.main { flex: 1; width: 100%; max-width: 72rem; margin: 0 auto; padding: clamp(1.5rem, 4vw, 3rem); }
@media (max-width: 42rem) {
  .header { padding-block: var(--space-3); gap: 0.5rem 1rem; }
  .nav { order: 3; width: 100%; }
  .header :global(.session-actions) { margin-left: auto; gap: 0.5rem; font-size: 0.875rem; }
}
</style>
