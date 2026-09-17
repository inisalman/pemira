<script setup lang="ts">
type Election = { id: string; name: string; status: string; startsAt: string | null; endsAt: string | null }
const elections = ref<Election[]>([])
const loading = ref(true)
const error = ref('')
onMounted(async () => {
  try { elections.value = (await $fetch<{ elections: Election[] }>('/api/v1/public/elections')).elections }
  catch (cause) { error.value = apiErrorMessage(cause) }
  finally { loading.value = false }
})
</script>

<template>
  <section class="results-page">
    <header><h1>Hasil pemilihan</h1><p>Periode yang sudah dibuka dapat dilihat sebagai hasil sementara. Hasil resmi hanya tampil setelah ditetapkan panitia.</p></header>
    <AppAlert v-if="error" kind="error" :message="error" />
    <p v-if="loading" role="status">Memuat periode publik…</p>
    <AppAlert v-else-if="!elections.length && !error" message="Belum ada periode yang dapat dilihat." />
    <ul v-else class="period-list">
      <li v-for="election in elections" :key="election.id" class="period-item">
        <div><h2>{{ election.name }}</h2><p>{{ electionStatus(election.status) }}</p><p>{{ electionDate(election.startsAt) }} sampai {{ electionDate(election.endsAt) }}</p></div>
        <NuxtLink class="action-link" :to="`/quick-count/${election.id}`">{{ election.status === 'PUBLISHED' ? 'Lihat hasil resmi' : 'Lihat quick count' }}</NuxtLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.results-page { display: grid; gap: var(--space-6); padding-block: clamp(1rem, 4vw, 2.5rem); }.results-page > header { max-width: 44rem; }.results-page header p, .period-item p { color: var(--color-text-muted); }.period-list { list-style: none; padding: 0; margin: 0; display: grid; gap: var(--space-4); max-width: 54rem; }.period-item { display: flex; align-items: center; justify-content: space-between; gap: var(--space-6); padding: var(--card-padding); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-xl); box-shadow: var(--shadow-sm); }.period-item > div { min-width: 0; }.period-item h2 { font-size: var(--text-lg); margin-bottom: var(--space-2); overflow-wrap: anywhere; }.period-item p { margin: 0; font-size: var(--text-sm); }.period-item .action-link { flex-shrink: 0; }
@media (max-width: 42rem) { .period-item { align-items: stretch; flex-direction: column; gap: var(--space-4); }.period-item .action-link { width: 100%; } }
</style>
