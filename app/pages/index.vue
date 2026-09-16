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
    <p :class="$style.eyebrow">PEMILIHAN KAMPUS</p>
    <h1>{{ config.public.appName }}</h1>
    <p :class="$style.lede">Pilih dengan tenang. Periksa calon, kirim satu suara, lalu simpan bukti pilihanmu.</p>
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
  padding: clamp(3rem, 10vw, 7rem) var(--space-4) var(--space-8);
  max-width: 60rem;
  margin: 0 auto;
}
.eyebrow { color: var(--color-primary); font-size: var(--text-sm); font-weight: 700; letter-spacing: 0.12em; margin: 0 0 var(--space-3); }
.hero h1 { font-size: clamp(2.5rem, 7vw, 4.5rem); letter-spacing: -0.04em; color: var(--color-text); margin-bottom: var(--space-4); }
.lede { max-width: 34rem; margin: 0 auto var(--space-6); color: var(--color-text-muted); font-size: var(--text-lg); }
.actions { display: flex; gap: var(--space-3); justify-content: center; flex-wrap: wrap; }
.periods { max-width: 42rem; margin: clamp(3rem, 8vw, 6rem) auto 0; text-align: left; }.periods h2 { font-size: var(--text-xl); }.periodList { display: grid; gap: var(--space-3); list-style: none; padding: 0; }.periodItem { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); padding: var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface); box-shadow: var(--shadow-sm); }.periodItem h3 { margin: 0; font-size: var(--text-base); }.periodItem p { margin: var(--space-1) 0 0; color: var(--color-text-muted); font-size: var(--text-sm); }
@media (max-width: 42rem) { .periodItem { align-items: start; flex-direction: column; } }
</style>
