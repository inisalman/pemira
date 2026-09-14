<script setup lang="ts">
// Placeholder quick count page — wired to the cached public endpoint in PH-6 (P6-03).
const route = useRoute()
</script>

<template>
  <section>
    <h1>Quick Count</h1>
    <AppAlert kind="info" message="Halaman pratinjau — data agregat dihubungkan pada fase PH-6." />
    <p>Periode: {{ route.params.electionId }}</p>
    <p><strong>Hasil sementara, belum ditetapkan panitia.</strong></p>
  </section>
</template>
