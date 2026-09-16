<script setup lang="ts">
const config = useRuntimeConfig()
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
  <section :class="$style.hero">
    <h1>{{ config.public.appName }}</h1>
    <p>Pemilihan umum mahasiswa. Periksa periode dan hasil yang sudah dibuka panitia.</p>
    <nav :class="$style.actions" aria-label="Navigasi utama">
      <NuxtLink to="/login" class="action-link">Masuk untuk memilih</NuxtLink>
      <NuxtLink to="/results" class="action-link">Lihat hasil</NuxtLink>
    </nav>
    <section :class="$style.periods" aria-labelledby="period-title">
      <h2 id="period-title">Periode yang tersedia</h2>
      <p v-if="loading" role="status">Memuat periode…</p>
      <AppAlert v-else-if="error" kind="error" :message="error" />
      <AppAlert v-else-if="!elections.length" message="Belum ada periode publik yang tersedia." />
      <ul v-else :class="$style.periodList">
        <li v-for="election in elections" :key="election.id" :class="$style.periodItem">
          <div><h3>{{ election.name }}</h3><p>{{ electionStatus(election.status) }}</p></div>
          <NuxtLink class="action-link" :to="`/quick-count/${election.id}`">Buka hasil</NuxtLink>
        </li>
      </ul>
    </section>
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
.periods { max-width: 42rem; margin: var(--space-8) auto 0; text-align: left; }.periods h2 { font-size: var(--text-xl); }.periodList { display: grid; gap: var(--space-3); list-style: none; padding: 0; }.periodItem { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius); background: var(--color-surface); }.periodItem h3 { margin: 0; font-size: var(--text-base); }.periodItem p { margin: var(--space-1) 0 0; color: var(--color-text-muted); font-size: var(--text-sm); }
@media (max-width: 42rem) { .periodItem { align-items: start; flex-direction: column; } }
</style>
