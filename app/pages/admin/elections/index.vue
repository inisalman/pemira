<script setup lang="ts">
// Placeholder admin elections page — real data in PH-3 (P3-01).
const columns = [
  { key: 'name', label: 'Nama periode' },
  { key: 'status', label: 'Status' },
  { key: 'starts_at', label: 'Mulai' },
  { key: 'ends_at', label: 'Selesai' },
]
const rows: Record<string, unknown>[] = []
</script>

<template>
  <section>
    <h1>Periode Pemilihan</h1>
    <AppTable :columns="columns" :rows="rows" empty-message="Belum ada periode. Buat periode baru saat fase PH-3." />
  </section>
</template>
