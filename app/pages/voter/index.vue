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
    <PageHeader
      kicker="Portal pemilih"
      title="Hak pilih saya"
      lead="Kenali calon, tentukan pilihan, lalu konfirmasi suara Anda."
      icon="vote"
    >
      <template #actions>
        <AppButton variant="secondary" :loading="loading" @click="load">
          <AppIcon name="refresh" :size="18" /> Perbarui
        </AppButton>
      </template>
    </PageHeader>
    <AppAlert v-if="error" kind="error" :message="error" />
    <p v-if="loading" :class="$style.loading" role="status">Memuat periode dan hak pilih…</p>
    <div v-else-if="!elections.length && !error" :class="$style.emptyWrap">
      <AppEmptyState icon="inbox" title="Belum ada periode" description="Belum ada periode yang tersedia untuk akun ini. Hubungi panitia jika Anda seharusnya terdaftar." />
    </div>
    <section v-for="election in elections" :key="election.id" :class="$style.period">
      <div :class="$style.periodHeader">
        <div><span :class="$style.status"><AppIcon name="clock" :size="15" /> {{ electionStatus(election.status) }}</span><h2>{{ election.name }}</h2></div>
        <div v-if="election.contests.length" :class="$style.progress">
          <label :for="`progress-${election.id}`">{{ election.contests.filter(contest => contest.hasVoted).length }} dari {{ election.contests.length }} suara tercatat</label>
          <progress :id="`progress-${election.id}`" :value="election.contests.filter(contest => contest.hasVoted).length" :max="election.contests.length" />
        </div>
      </div>
      <dl :class="$style.dates"><div><dt><AppIcon name="calendar" :size="14" /> Mulai</dt><dd>{{ electionDate(election.startsAt) }}</dd></div><div><dt><AppIcon name="calendar" :size="14" /> Selesai</dt><dd>{{ electionDate(election.endsAt) }}</dd></div></dl>
      <AppAlert v-if="!election.contests.length" message="Anda terdaftar pada periode ini, tetapi belum memiliki hak pilih. Hubungi panitia untuk pemeriksaan." />
      <div :class="$style.grid">
        <article v-for="contest in election.contests" :key="contest.id" :class="$style.card">
          <div :class="$style.cardTop">
            <span :class="$style.orgMark" aria-hidden="true">{{ contestMark(contest.title).mark }}</span>
            <span :class="[$style.badge, { [$style.badgeDone]: contest.hasVoted }]">
              <AppIcon :name="contest.hasVoted ? 'check-circle' : 'clock'" :size="14" />
              {{ contest.hasVoted ? 'Sudah memilih' : 'Belum memilih' }}
            </span>
          </div>
          <small :class="$style.cardGroup">{{ contestMark(contest.title).group }}</small>
          <h3>{{ contest.title }}</h3>
          <p :class="$style.description">{{ contest.hasVoted ? 'Tanda terima tersedia. Terima kasih sudah menggunakan hak pilih Anda.' : 'Baca profil dan program calon sebelum menentukan pilihan.' }}</p>
          <NuxtLink :class="[$style.cardAction, { [$style.secondary]: contest.hasVoted }]" :to="`/voter/contests/${contest.id}`">{{ contest.hasVoted ? 'Lihat tanda terima' : 'Buka surat suara' }} <AppIcon name="arrow-right" :size="17" /></NuxtLink>
        </article>
      </div>
    </section>
  </section>
</template>

<style module>
.section { display: grid; }
.loading { margin: var(--space-6) 0 0; color: var(--color-text-muted); }
.emptyWrap { margin-top: var(--space-6); }
.periodHeader { display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
.periodHeader h2 { margin: 0.75rem 0 0; font-size: clamp(1.4rem, 3vw, 1.8rem); overflow-wrap: anywhere; }
.status { display: inline-flex; align-items: center; gap: 0.4rem; color: var(--color-primary-strong); background: var(--color-primary-soft); padding: 0.3rem 0.7rem; border-radius: var(--radius-pill); font-size: 0.875rem; font-weight: 600; }
.progress { display: grid; gap: 0.5rem; font-size: 0.875rem; color: var(--color-text-muted); }
.progress progress { width: 100%; height: 0.5rem; accent-color: var(--color-primary); }
.dates { display: flex; flex-wrap: wrap; gap: 1rem 3rem; margin-block: 1.5rem; font-size: 0.875rem; }
.dates dt { display: inline-flex; align-items: center; gap: 0.35rem; color: var(--color-text-muted); margin-bottom: 0.25rem; }
.dates dd { margin: 0; }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: var(--space-4);
  margin-top: var(--space-4);
}
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--card-padding);
  box-shadow: var(--shadow-sm);
  transition: border-color 140ms ease, transform 140ms ease, box-shadow 140ms ease;
}
.card:hover { border-color: var(--color-primary); transform: translateY(-2px); box-shadow: var(--shadow-md); }
.cardTop { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-3); }
.orgMark {
  display: grid; place-items: center; width: 2.75rem; height: 2.75rem; flex-shrink: 0;
  border-radius: 0.7rem; background: var(--color-primary-tint); color: var(--color-primary-strong);
  font-weight: 800; font-size: 0.78rem; letter-spacing: 0.02em;
}
.badge {
  display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.65rem;
  border-radius: var(--radius-pill); background: var(--color-surface-muted); color: var(--color-text-muted);
  border: 1px solid var(--color-border); font-size: 0.72rem; font-weight: 700;
}
.badge.badgeDone { background: var(--color-success-bg); color: var(--color-success); border-color: var(--color-success-bg); }
.cardGroup { color: var(--color-text-muted); font-size: 0.7rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
.period { margin-bottom: 3rem; padding-top: 2rem; border-top: 1px solid var(--color-border); }
.period:first-of-type { margin-top: var(--space-8); }
.card h3 { font-size: 1.3rem; margin: 0.25rem 0 0; overflow-wrap: anywhere; }
.description { flex: 1; color: var(--color-text-muted); font-size: 0.875rem; margin: 0.75rem 0 1.5rem; }
.cardAction { display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; min-height: 2.75rem; padding: 0.65rem 1rem; background: var(--color-primary); color: white; border-radius: var(--radius-pill); text-decoration: none; font-weight: 700; transition: background 140ms ease; }
.cardAction:hover { background: var(--color-primary-strong); color: white; }
.cardAction.secondary { background: var(--color-primary-soft); color: var(--color-primary-strong); }
.cardAction.secondary:hover { background: var(--color-primary-tint); }
@media (max-width: 34rem) { .dates { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }.card { min-height: 0; } }
</style>
