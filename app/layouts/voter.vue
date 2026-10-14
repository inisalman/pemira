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
      <NuxtLink to="/voter" :class="$style.brand">
        <span :class="$style.brandMark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 12 2 2 4-4" /><rect x="3" y="4" width="18" height="16" rx="2" /></svg>
        </span>
        <span :class="$style.brandText">{{ config.public.appName }}<small>Portal pemilih</small></span>
      </NuxtLink>
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
.shell { min-height: 100vh; display: flex; flex-direction: column; background: var(--color-bg); }
.header {
  position: sticky;
  top: 0;
  z-index: 30;
  padding: 0 max(1rem, calc((100vw - 68rem) / 2));
  min-height: 4.5rem;
  border-bottom: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-bg) 90%, transparent);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}
.brand { display: inline-flex; align-items: center; gap: 0.6rem; font-weight: 800; color: var(--color-primary-strong); text-decoration: none; line-height: 1.1; }
.brandMark { display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: 0.55rem; background: var(--color-primary); color: #fff; flex-shrink: 0; }
.brandText { display: flex; flex-direction: column; font-size: 1.05rem; line-height: 1.1; }
.brandText small { font-size: 0.56rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-text-muted); margin-top: 0.2rem; }
.nav { display: flex; gap: var(--space-2); }
.nav a { color: var(--color-text-muted); text-decoration: none; font-weight: 600; font-size: 0.85rem; padding: 0.5rem 0.75rem; border-radius: var(--radius-pill); }
.nav a:hover, .nav a.router-link-active { color: var(--color-primary-strong); background: var(--color-primary-soft); text-decoration: none; }
.main { flex: 1; width: 100%; max-width: 72rem; margin: 0 auto; padding: clamp(1.5rem, 4vw, 3rem); }
@media (max-width: 42rem) {
  .header { padding-block: var(--space-3); gap: 0.5rem 1rem; }
  .brandText small { display: none; }
  .nav { order: 3; width: 100%; }
  .header :global(.session-actions) { margin-left: auto; gap: 0.5rem; font-size: 0.875rem; }
}
</style>
