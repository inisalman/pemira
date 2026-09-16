<script setup lang="ts">
import type { VoterElection, VoterContest } from '~~/shared/types/voter'
const { request } = useApi()
const session = useSession()
const elections = ref<(VoterElection & { contests: VoterContest[] })[]>([])
const loading = ref(true)
const error = ref('')
async function load() {
  loading.value = true
  error.value = ''
  try { elections.value = (await request<{ elections: typeof elections.value }>('/api/v1/voting/elections')).elections }
  catch (cause) {
    if (isUnauthorized(cause)) await session.expire()
    else error.value = apiErrorMessage(cause)
  } finally { loading.value = false }
}
onMounted(load)
</script>

<template>
  <section>
    <h1>Hak pilih saya</h1>
    <p>Setiap kontes memiliki surat suara sendiri. Periksa calon sebelum mengirim suara.</p>
    <AppAlert v-if="error" kind="error" :message="error" />
    <p v-if="loading" role="status">Memuat periode dan hak pilih…</p>
    <AppAlert v-else-if="!elections.length && !error" message="Belum ada periode yang tersedia untuk akun ini. Hubungi panitia jika Anda seharusnya terdaftar." />
    <section v-for="election in elections" :key="election.id" :class="$style.period">
      <h2>{{ election.name }}</h2>
      <p><strong>{{ electionStatus(election.status) }}</strong></p>
      <p>Mulai: {{ electionDate(election.startsAt) }}<br>Selesai: {{ electionDate(election.endsAt) }}</p>
      <p>{{ election.contests.filter(contest => contest.hasVoted).length }} dari {{ election.contests.length }} kontes sudah dipilih.</p>
      <AppAlert v-if="!election.contests.length" message="Anda terdaftar pada periode ini, tetapi belum memiliki hak pilih. Hubungi panitia untuk pemeriksaan." />
      <div :class="$style.grid">
        <article v-for="contest in election.contests" :key="contest.id" :class="$style.card">
          <h3>{{ contest.title }}</h3>
          <p>{{ contest.hasVoted ? 'Suara sudah tercatat' : 'Belum memilih' }}</p>
          <NuxtLink class="action-link" :to="`/voter/contests/${contest.id}`">{{ contest.hasVoted ? 'Lihat status suara' : 'Buka surat suara' }}</NuxtLink>
        </article>
      </div>
    </section>
    <AppButton variant="secondary" :loading="loading" @click="load">Perbarui hak pilih</AppButton>
  </section>
</template>

<style module>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: var(--space-4);
  margin-top: var(--space-4);
}
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}
.period { margin-block: var(--space-8); }
.card h3 { font-size: var(--text-lg); }
.card p { color: var(--color-text-muted); }
</style>
