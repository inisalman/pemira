<script setup lang="ts">
const config = useRuntimeConfig()

const links = [
  { to: '/admin/elections', label: 'Periode' },
  { to: '/admin/voters', label: 'Pemilih' },
  { to: '/admin/candidates', label: 'Kandidat' },
  { to: '/admin/rights', label: 'Hak pilih' },
  { to: '/admin/operations', label: 'Operasional' },
  { to: '/admin/reports', label: 'Laporan' },
]
</script>

<template>
  <div :class="$style.shell">
    <a class="skip-link" href="#main-content">Lewati navigasi</a>
    <header :class="$style.header">
      <NuxtLink to="/admin" :class="$style.brand"><span :class="$style.brandMark">P</span><span>{{ config.public.appName }} <small>Admin</small></span></NuxtLink>
      <nav :class="$style.nav" aria-label="Navigasi admin">
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
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}
.brand { display: inline-flex; align-items: center; gap: var(--space-2); font-weight: 700; font-size: var(--text-lg); color: var(--color-primary); text-decoration: none; }
.brand small { color: var(--color-text-muted); font-size: var(--text-sm); font-weight: 600; }
.brandMark { display: grid; place-items: center; width: 1.75rem; height: 1.75rem; border-radius: 0.35rem; background: var(--color-primary); color: white; font-size: var(--text-sm); }
.toggle {
  display: none;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: var(--text-lg);
  padding: var(--space-1) var(--space-2);
  cursor: pointer;
}
.nav { display: flex; gap: var(--space-1); flex-wrap: wrap; }
.nav a { color: var(--color-text); text-decoration: none; font-weight: 500; }
.nav a { padding: 0.5rem 0.65rem; border-radius: var(--radius); }
.nav a:hover, .nav a.router-link-active { color: var(--color-primary); background: var(--color-primary-soft); text-decoration: none; }
.main { flex: 1; width: 100%; max-width: 72rem; margin: 0 auto; padding: var(--space-4); }

@media (max-width: 48rem) {
  .toggle { display: block; }
  .nav {
    flex-direction: column;
    width: 100%;
    order: 3;
  }
}
</style>
