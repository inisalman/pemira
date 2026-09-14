<script setup lang="ts">
const config = useRuntimeConfig()
</script>

<template>
  <section :class="$style.hero">
    <h1>{{ config.public.appName }}</h1>
    <p>Pemilihan umum mahasiswa — halaman informasi periode, calon, dan quick count.</p>
    <nav :class="$style.actions" aria-label="Navigasi utama">
      <NuxtLink to="/login"><AppButton as="span">Masuk untuk memilih</AppButton></NuxtLink>
      <NuxtLink to="/results"><AppButton variant="secondary" as="span">Lihat hasil</AppButton></NuxtLink>
    </nav>
  </section>
</template>

<style module>
.hero {
  text-align: center;
  padding: var(--space-8) var(--space-4);
}
.hero h1 { font-size: 2rem; color: var(--color-primary); }
.hero p { color: var(--color-text-muted); margin-bottom: var(--space-6); }
.actions { display: flex; gap: var(--space-3); justify-content: center; flex-wrap: wrap; }
</style>
