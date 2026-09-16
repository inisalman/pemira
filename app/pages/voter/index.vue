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
    <header :class="$style.intro">
      <p :class="$style.eyebrow">Portal pemilih</p>
      <h1>Hak pilih saya</h1>
      <p>Kenali calon, tentukan pilihan, lalu konfirmasi suara Anda.</p>
    </header>
    <AppAlert v-if="error" kind="error" :message="error" />
    <p v-if="loading" role="status">Memuat periode dan hak pilih…</p>
    <AppAlert v-else-if="!elections.length && !error" message="Belum ada periode yang tersedia untuk akun ini. Hubungi panitia jika Anda seharusnya terdaftar." />
    <section v-for="election in elections" :key="election.id" :class="$style.period">
      <div :class="$style.periodHeader">
        <div><span :class="$style.status">{{ electionStatus(election.status) }}</span><h2>{{ election.name }}</h2></div>
        <div v-if="election.contests.length" :class="$style.progress">
          <label :for="`progress-${election.id}`">{{ election.contests.filter(contest => contest.hasVoted).length }} dari {{ election.contests.length }} suara tercatat</label>
          <progress :id="`progress-${election.id}`" :value="election.contests.filter(contest => contest.hasVoted).length" :max="election.contests.length" />
        </div>
      </div>
      <dl :class="$style.dates"><div><dt>Mulai</dt><dd>{{ electionDate(election.startsAt) }}</dd></div><div><dt>Selesai</dt><dd>{{ electionDate(election.endsAt) }}</dd></div></dl>
      <AppAlert v-if="!election.contests.length" message="Anda terdaftar pada periode ini, tetapi belum memiliki hak pilih. Hubungi panitia untuk pemeriksaan." />
      <div :class="$style.grid">
        <article v-for="contest in election.contests" :key="contest.id" :class="$style.card">
          <p :class="[$style.cardStatus, { [$style.complete]: contest.hasVoted }]">{{ contest.hasVoted ? 'Suara sudah tercatat' : 'Belum memilih' }}</p>
          <h3>{{ contest.title }}</h3>
          <p :class="$style.description">{{ contest.hasVoted ? 'Tanda terima tersedia. Terima kasih sudah menggunakan hak pilih Anda.' : 'Baca profil dan program calon sebelum menentukan pilihan.' }}</p>
          <NuxtLink :class="[$style.cardAction, { [$style.secondary]: contest.hasVoted }]" :to="`/voter/contests/${contest.id}`">{{ contest.hasVoted ? 'Lihat tanda terima' : 'Buka surat suara' }}</NuxtLink>
        </article>
      </div>
    </section>
    <AppButton variant="secondary" :loading="loading" @click="load">Perbarui hak pilih</AppButton>
  </section>
</template>

<style module>
.intro { padding: clamp(1rem, 4vw, 3rem) 0 2rem; max-width: 42rem; }
.intro h1 { font-size: clamp(2rem, 5vw, 3rem); letter-spacing: -0.04em; margin-bottom: 0.75rem; }
.intro p { color: var(--color-text-muted); margin: 0; }
.intro .eyebrow { color: var(--color-primary); font-weight: 700; margin-bottom: 0.75rem; }
.periodHeader { display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
.periodHeader h2 { margin: 0.75rem 0 0; font-size: clamp(1.4rem, 3vw, 1.8rem); overflow-wrap: anywhere; }
.status { color: var(--color-primary-strong); background: var(--color-primary-soft); padding: 0.3rem 0.65rem; border-radius: 0.4rem; font-size: 0.875rem; font-weight: 600; }
.progress { display: grid; gap: 0.5rem; font-size: 0.875rem; color: var(--color-text-muted); }
.progress progress { width: 100%; height: 0.5rem; accent-color: var(--color-primary); }
.dates { display: flex; flex-wrap: wrap; gap: 1rem 3rem; margin-block: 1.5rem; font-size: 0.875rem; }
.dates dt { color: var(--color-text-muted); margin-bottom: 0.25rem; }
.dates dd { margin: 0; }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: var(--space-4);
  margin-top: var(--space-4);
}
.card {
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}
.period { margin-bottom: 3rem; padding-top: 2rem; border-top: 1px solid var(--color-border); }
.card h3 { font-size: 1.3rem; margin: 1rem 0 0; overflow-wrap: anywhere; }
.cardStatus { margin: 0; font-size: 0.875rem; color: var(--color-text-muted); }
.cardStatus.complete { color: var(--color-success); font-weight: 600; }
.description { flex: 1; color: var(--color-text-muted); font-size: 0.875rem; margin-bottom: 1.5rem; }
.cardAction { display: flex; align-items: center; justify-content: center; min-height: 2.75rem; padding: 0.65rem 1rem; background: var(--color-primary); color: white; border-radius: var(--radius); text-decoration: none; font-weight: 600; }
.cardAction:hover { background: var(--color-primary-strong); color: white; }
.cardAction.secondary { background: var(--color-primary-soft); color: var(--color-primary-strong); }
</style>
