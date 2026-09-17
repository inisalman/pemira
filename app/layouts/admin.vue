<script setup lang="ts">
const config = useRuntimeConfig()
const route = useRoute()
const menuOpen = ref(false)
const links = [
  { to: '/admin', label: 'Ringkasan', code: 'RS' },
  { to: '/admin/elections', label: 'Periode', code: 'PR' },
  { to: '/admin/voters', label: 'Pemilih', code: 'DP' },
  { to: '/admin/candidates', label: 'Kandidat', code: 'KN' },
  { to: '/admin/rights', label: 'Hak pilih', code: 'HP' },
  { to: '/admin/operations', label: 'Operasional', code: 'OP' },
  { to: '/admin/reports', label: 'Laporan', code: 'LP' },
]
function closeMenu() { menuOpen.value = false }
</script>

<template>
  <div :class="$style.shell">
    <a class="skip-link" href="#main-content">Lewati navigasi</a>
    <header :class="$style.mobileHeader">
      <NuxtLink to="/admin" :class="$style.brand"><span :class="$style.brandMark">P</span><span>{{ config.public.appName }}<small>Ruang panitia</small></span></NuxtLink>
      <button :class="$style.menuButton" type="button" :aria-expanded="menuOpen" aria-controls="admin-navigation" @click="menuOpen = !menuOpen">Menu</button>
    </header>
    <aside :class="[$style.sidebar, { [$style.open]: menuOpen }]">
      <div :class="$style.sidebarBrand"><NuxtLink to="/admin" :class="$style.brand" @click="closeMenu"><span :class="$style.brandMark">P</span><span>{{ config.public.appName }}<small>Ruang panitia</small></span></NuxtLink><p>Kelola periode, pemilih, dan hasil PEMIRA dalam satu ruang kerja.</p></div>
      <nav id="admin-navigation" :class="$style.nav" aria-label="Navigasi admin"><NuxtLink v-for="link in links" :key="link.to" :to="link.to" @click="closeMenu"><span :class="$style.navMark" aria-hidden="true">{{ link.code }}</span>{{ link.label }}</NuxtLink></nav>
      <div :class="$style.sidebarFooter"><SessionActions /></div>
    </aside>
    <main
      id="main-content"
      :class="[$style.main, { [$style.fullWidth]: route.path === '/admin/rights/matrix' }]"
      tabindex="-1"
    ><slot /></main>
  </div>
</template>

<style module>
.shell { min-height: 100vh; display: grid; grid-template-columns: 17rem minmax(0, 1fr); background: #faf8ff; }
.sidebar { position: sticky; top: 0; display: flex; flex-direction: column; height: 100vh; padding: 1.5rem 1rem; border-right: 1px solid var(--color-border); background: white; }
.sidebarBrand { padding: .25rem .5rem 1.5rem; }.sidebarBrand p { margin: 1rem 0 0; color: var(--color-text-muted); font-size: .78rem; line-height: 1.55; }
.brand { display: inline-flex; align-items: center; gap: .65rem; color: var(--color-primary); font-weight: 800; line-height: 1.1; text-decoration: none; }.brand small { display: block; margin-top: .28rem; color: var(--color-text-muted); font-size: .62rem; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; }.brandMark { display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: .45rem; background: var(--color-primary); color: white; }
.nav { display: grid; gap: .3rem; }.nav a { display: flex; align-items: center; gap: .7rem; min-height: 2.75rem; padding: .55rem .65rem; border-radius: .5rem; color: var(--color-text-muted); font-size: .86rem; font-weight: 700; text-decoration: none; }.nav a:hover, .nav a.router-link-active { background: var(--color-primary-soft); color: var(--color-primary-strong); }.navMark { display: grid; place-items: center; width: 1.8rem; height: 1.8rem; border-radius: .35rem; background: #f0f1fa; color: var(--color-primary); font-size: .58rem; font-weight: 800; }.nav a.router-link-active .navMark { background: var(--color-primary); color: white; }
.sidebarFooter { margin-top: auto; padding: 1rem .5rem 0; border-top: 1px solid var(--color-border); }.sidebarFooter :global(.session-actions) { display: grid; gap: .5rem; }.sidebarFooter :global(.session-actions a) { min-height: 2.25rem; font-size: .8rem; }.sidebarFooter :global(.session-actions button) { width: 100%; }
.main { min-width: 0; padding: clamp(1.5rem, 4vw, 3rem); }.main > * { width: min(100%, 76rem); margin-inline: auto; }
.main.fullWidth { padding-inline: clamp(1rem, 2.5vw, 2rem); }
.main.fullWidth > * { width: 100%; max-width: none; }
.mobileHeader { display: none; }
@media (max-width: 58rem) { .shell { display: block; }.mobileHeader { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; justify-content: space-between; min-height: 4rem; padding: .75rem 1rem; border-bottom: 1px solid var(--color-border); background: white; }.menuButton { min-height: 2.75rem; padding: .5rem .75rem; border: 1px solid var(--color-border); border-radius: var(--radius); background: white; color: var(--color-primary-strong); font: inherit; font-weight: 700; }.sidebar { position: fixed; z-index: 20; top: 4rem; left: 0; width: min(18rem, 88vw); height: calc(100dvh - 4rem); transform: translateX(-105%); box-shadow: var(--shadow-md); transition: transform .15s ease; }.sidebar.open { transform: translateX(0); }.main { padding: 1.25rem 1rem 2rem; }.sidebarBrand { display: none; } }
</style>
