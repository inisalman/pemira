<script setup lang="ts">
const config = useRuntimeConfig()
</script>

<template>
  <div :class="$style.shell">
    <a class="skip-link" href="#main-content">Lewati navigasi</a>
    <header :class="$style.header">
      <div :class="$style.headerInner">
        <NuxtLink to="/" :class="$style.brand">
          <span :class="$style.brandMark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 12 2 2 4-4" /><rect x="3" y="4" width="18" height="16" rx="2" /></svg>
          </span>
          <span :class="$style.brandText">{{ config.public.appName }}<small>Poltekkes Kemenkes Jakarta I</small></span>
        </NuxtLink>
        <nav :class="$style.nav" aria-label="Navigasi informasi">
          <a href="/#tentang-pemira">Tentang</a>
          <a href="/#jadwal-voting">Jadwal</a>
          <NuxtLink to="/quick-count">Quick count</NuxtLink>
          <a href="/#tata-tertib">Tata tertib</a>
          <a href="/#panduan-voting">Panduan</a>
        </nav>
        <NuxtLink to="/admin/login" :class="$style.adminLink">Panel panitia</NuxtLink>
      </div>
    </header>
    <main id="main-content" :class="$style.main" tabindex="-1">
      <slot />
    </main>
    <footer :class="$style.footer">
      <div :class="$style.footerInner">
        <span>© PEMIRA · Poltekkes Kemenkes Jakarta I</span>
        <span>Hasil sementara bukan penetapan pemenang.</span>
      </div>
    </footer>
  </div>
</template>

<style module>
.shell { min-height: 100vh; display: flex; flex-direction: column; }
.header {
  position: sticky;
  top: 0;
  z-index: 30;
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-bg) 90%, transparent);
  backdrop-filter: blur(8px);
}
.headerInner { width: 100%; max-width: 72rem; min-height: 4.5rem; margin: 0 auto; display: flex; align-items: center; gap: var(--space-4); }
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 800;
  color: var(--color-primary-strong);
  text-decoration: none;
}
.brandMark { display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: 0.55rem; background: var(--color-primary); color: #fff; flex-shrink: 0; }
.brandText { display: flex; flex-direction: column; font-size: 1.05rem; line-height: 1.1; }
.brandText small { font-size: 0.56rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-text-muted); margin-top: 0.2rem; }
.nav { display: flex; gap: 0.3rem; margin-inline: auto; }
.nav a { min-height: 2.5rem; display: inline-flex; align-items: center; padding: 0.55rem 0.75rem; border-radius: var(--radius-pill); color: var(--color-text-muted); font-size: 0.85rem; font-weight: 500; text-decoration: none; }
.nav a:hover { color: var(--color-primary-strong); background: var(--color-primary-soft); }
.adminLink { margin-left: auto; display: inline-flex; align-items: center; min-height: 2.5rem; padding: 0.55rem 1.1rem; border: 1px solid var(--color-border-strong); border-radius: var(--radius-pill); color: var(--color-primary-strong); font-size: var(--text-sm); font-weight: 700; text-decoration: none; transition: background 140ms ease, border-color 140ms ease; }
.adminLink:hover { background: var(--color-primary-soft); border-color: var(--color-primary); }
.main {
  flex: 1;
  width: 100%;
  max-width: 72rem;
  margin: 0 auto;
  padding: clamp(1.5rem, 4vw, 3rem) var(--space-4);
}
.footer {
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}
.footerInner {
  width: 100%;
  max-width: 72rem;
  margin: 0 auto;
  padding: var(--space-6) var(--space-4);
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-4);
  color: var(--color-text-muted);
  font-size: 0.72rem;
}
@media (max-width: 58rem) { .nav { display: none; } .brandText small { display: none; } }
</style>
