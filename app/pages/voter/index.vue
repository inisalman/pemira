<script setup lang="ts">
// Placeholder voter dashboard — wired to real rights data in PH-5 (P5-01).
</script>

<template>
  <section>
    <h1>Dashboard Pemilih</h1>
    <AppAlert kind="info" message="Halaman pratinjau — data hak suara dihubungkan pada fase PH-5." />
    <div :class="$style.grid">
      <div v-for="i in 4" :key="i" :class="$style.card">
        <h2>Kontes {{ i }}</h2>
        <p>Belum dibuka</p>
      </div>
    </div>
  </section>
</template>

<style module>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: var(--space-4);
  margin-top: var(--space-4);
}
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}
.card h2 { font-size: var(--text-lg); }
.card p { color: var(--color-text-muted); }
</style>
