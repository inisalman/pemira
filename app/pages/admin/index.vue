<script setup lang="ts">
type Election = { id: string; name: string; status: string }
type ContestResult = {
  code: string
  title: string
  totalBallots: number
  eligible: number
  participation: number
  options: { number: number; label: string; votes: number; percent: number }[]
}
type Stats = {
  status: string
  totals: { eligible: number; participating: number; ballots: number }
  results: ContestResult[]
  anomalies: string[]
}

const { request } = useApi()
const elections = ref<Election[]>([])
const electionId = ref('')
const stats = ref<Stats | null>(null)
const loading = ref(true)
const error = ref('')
const currentElection = computed(() => elections.value.find(election => election.id === electionId.value))
const averageParticipation = computed(() => {
  const contests = stats.value?.results.filter(contest => contest.eligible > 0) ?? []
  if (!contests.length) return 0
  return Math.round((contests.reduce((total, contest) => total + contest.participation, 0) / contests.length) * 100) / 100
})
const groupedResults = computed(() => {
  const results = stats.value?.results ?? []
  const definitions = [
    { key: 'BEM', title: 'BEM', description: 'Badan Eksekutif Mahasiswa', matches: (contest: ContestResult) => contest.code === 'BEM' },
    { key: 'MPM', title: 'MPM', description: 'Majelis Permusyawaratan Mahasiswa', matches: (contest: ContestResult) => contest.code === 'MPM' },
    { key: 'HIMA', title: 'HIMA', description: 'Himpunan Mahasiswa per jurusan', matches: (contest: ContestResult) => contest.code.startsWith('HIMA_') },
  ]
  const known = new Set(results.filter(contest => definitions.some(group => group.matches(contest))).map(contest => contest.code))
  const groups = definitions.map(group => ({ ...group, contests: results.filter(group.matches) }))
  const other = results.filter(contest => !known.has(contest.code))
  if (other.length) groups.push({ key: 'OTHER', title: 'Kontes lainnya', description: 'Kontes tambahan pada periode ini', matches: () => false, contests: other })
  return groups.filter(group => group.contests.length)
})
function barWidth(value: number) { return `${Math.min(100, Math.max(0, value))}%` }
async function loadStats() {
  if (!electionId.value) { stats.value = null; loading.value = false; return }
  loading.value = true; error.value = ''
  try {
    stats.value = await request<Stats>(`/api/v1/admin/elections/${encodeURIComponent(electionId.value)}/statistics`)
  } catch (cause) { error.value = apiErrorMessage(cause) }
  finally { loading.value = false }
}
async function loadElections() {
  loading.value = true; error.value = ''
  try {
    elections.value = (await request<{ elections: Election[] }>('/api/v1/admin/elections')).elections
    electionId.value = elections.value[0]?.id ?? ''
    await loadStats()
  } catch (cause) { error.value = apiErrorMessage(cause); loading.value = false }
}
watch(electionId, (next, previous) => { if (next && previous) void loadStats() })
onMounted(loadElections)
</script>

<template>
  <section class="admin-page dashboard">
    <header class="page-header"><div><p class="eyebrow">Ringkasan</p><h1>Statistik periode pemilihan</h1><p class="intro">Pantau partisipasi dan perolehan suara seluruh kontes dalam satu halaman.</p></div></header>
    <section class="monitor" aria-labelledby="monitor-title">
      <header class="monitor-header">
        <div><p class="eyebrow">Pantauan pemilihan</p><h2 id="monitor-title">Statistik periode</h2><p>Lihat partisipasi dan perolehan suara agregat tanpa membuka data pilihan pemilih.</p></div>
        <div class="monitor-controls">
          <label>Periode<select v-model="electionId" :disabled="loading"><option v-if="!elections.length" value="">Belum ada periode</option><option v-for="election in elections" :key="election.id" :value="election.id">{{ election.name }} · {{ election.status }}</option></select></label>
          <AppButton variant="secondary" :loading="loading" :disabled="!electionId" @click="loadStats">Perbarui</AppButton>
        </div>
      </header>
      <AppAlert v-if="error" kind="error" :message="error" />
      <div v-if="loading" class="monitor-state" role="status">Memuat statistik pemilihan…</div>
      <div v-else-if="!stats" class="monitor-state">Belum ada periode yang dapat dipantau.</div>
      <template v-else>
        <section class="metric-grid" aria-label="Ringkasan statistik">
          <article><span>Status periode</span><strong class="status-value">{{ electionStatus(stats.status) }}</strong><small>{{ currentElection?.name }}</small></article>
          <article><span>Pemilih dalam DPT</span><strong>{{ stats.totals.eligible.toLocaleString('id-ID') }}</strong><small>akun pemilih terdaftar</small></article>
          <article><span>Suara masuk</span><strong>{{ stats.totals.ballots.toLocaleString('id-ID') }}</strong><small>dari seluruh kontes</small></article>
          <article><span>Rata-rata partisipasi</span><strong>{{ averageParticipation }}%</strong><small>dihitung per kontes</small></article>
        </section>
        <AppAlert v-if="stats.anomalies.length" kind="warning" :message="`${stats.anomalies.length} anomali rekonsiliasi perlu diperiksa di halaman laporan.`" />
        <div v-if="!groupedResults.length" class="chart-empty">Belum ada kontes pada periode ini.</div>
        <section v-else class="result-groups" aria-label="Statistik seluruh kontes">
          <section v-for="group in groupedResults" :key="group.key" class="result-group">
            <header class="group-header"><div><p class="group-code">{{ group.title }}</p><h3>{{ group.description }}</h3></div><span>{{ group.contests.length }} kontes</span></header>
            <div class="contest-grid">
              <article v-for="contest in group.contests" :key="contest.code" class="contest-card">
                <header><div><p>{{ contest.code }}</p><h4>{{ contest.title }}</h4></div><strong>{{ contest.totalBallots }} suara</strong></header>
                <section class="participation" :aria-label="`Partisipasi ${contest.title}`">
                  <div class="bar-label"><span>Partisipasi</span><strong>{{ contest.participation }}%</strong></div>
                  <div class="bar-track participation-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="contest.participation"><span :style="{ width: barWidth(contest.participation) }" /></div>
                  <small>{{ contest.totalBallots }} dari {{ contest.eligible }} hak digunakan</small>
                </section>
                <div v-if="!contest.options.length" class="candidate-empty">Belum ada kandidat pada kontes ini.</div>
                <ol v-else class="vote-bars" :aria-label="`Perolehan suara ${contest.title}`">
                  <li v-for="option in contest.options" :key="option.number">
                    <div class="bar-label"><span><b>Nomor {{ option.number }}</b><small>{{ option.label }}</small></span><strong>{{ option.votes }} · {{ option.percent }}%</strong></div>
                    <div class="bar-track vote-track" role="progressbar" :aria-label="`Perolehan nomor ${option.number}`" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="option.percent"><span :style="{ width: barWidth(option.percent) }" /></div>
                  </li>
                </ol>
              </article>
            </div>
          </section>
        </section>
        <div class="report-link"><NuxtLink class="action-link" to="/admin/reports">Buka laporan dan audit lengkap</NuxtLink></div>
      </template>
    </section>
  </section>
</template>

<style scoped>
.dashboard { display: grid; gap: 1.5rem; }
.monitor { display:grid; gap:var(--space-6); padding:var(--card-padding); border:1px solid var(--color-border); border-radius:var(--radius-xl); background:var(--color-surface); box-shadow:var(--shadow-sm); }
.monitor-header { display:flex; justify-content:space-between; align-items:end; gap:var(--space-6); }
.monitor-header h2 { margin:0 0 var(--space-1); font-size:var(--text-xl); }.monitor-header p,.metric-grid small,.chart-empty { margin:0; color:var(--color-text-muted); }
.monitor-controls { display:flex; align-items:end; gap:var(--space-3); flex-wrap:wrap; }.monitor-controls label { display:grid; gap:var(--space-1); color:var(--color-text); font-size:var(--text-sm); font-weight:700; }.monitor select { min-width:15rem; min-height:2.75rem; padding:var(--space-2) var(--space-3); border:1px solid var(--color-border-strong); border-radius:var(--radius); background:var(--color-surface); color:var(--color-text); font:inherit; }.monitor select:focus-visible { outline:none; box-shadow:var(--focus-ring); }
.monitor-state,.chart-empty { padding:var(--space-8) var(--space-4); border:1px dashed var(--color-border-strong); border-radius:var(--radius-lg); text-align:center; }
.metric-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:var(--space-3); }.metric-grid article { display:grid; align-content:start; gap:.2rem; min-height:7rem; padding:var(--space-4); border:1px solid var(--color-border); border-radius:var(--radius-lg); background:var(--color-surface-muted); }.metric-grid span { color:var(--color-text-muted); font-size:var(--text-sm); }.metric-grid strong { color:var(--color-primary-strong); font-size:clamp(1.45rem,2.5vw,2rem); line-height:1.2; }.metric-grid .status-value { font-size:var(--text-xl); }
.result-groups,.result-group { display:grid; gap:var(--space-6); }.result-group { padding-top:var(--space-2); }.group-header { display:flex; justify-content:space-between; align-items:end; gap:var(--space-4); padding-bottom:var(--space-3); border-bottom:2px solid var(--color-border); }.group-header h3 { margin:0; font-size:var(--text-lg); }.group-header>span { color:var(--color-text-muted); font-size:var(--text-sm); }.group-code { margin:0 0 .2rem; color:var(--color-primary); font-size:.75rem; font-weight:800; letter-spacing:.08em; }.contest-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:var(--space-4); }.contest-card { display:grid; align-content:start; gap:var(--space-4); min-width:0; padding:var(--card-padding); border:1px solid var(--color-border); border-radius:var(--radius-lg); background:var(--color-surface); box-shadow:var(--shadow-sm); }.contest-card>header { display:flex; justify-content:space-between; align-items:start; gap:var(--space-4); }.contest-card>header p { margin:0 0 .2rem; color:var(--color-primary); font-size:.72rem; font-weight:800; }.contest-card h4 { margin:0; font-size:var(--text-base); }.contest-card>header>strong { flex-shrink:0; color:var(--color-primary-strong); font-size:var(--text-sm); }.participation { padding:var(--space-3); border-radius:var(--radius); background:var(--color-surface-muted); }.participation small { display:block; margin-top:.45rem; color:var(--color-text-muted); font-size:.7rem; }.vote-bars { display:grid; gap:var(--space-3); margin:0; padding:0; list-style:none; }.bar-label { display:flex; justify-content:space-between; align-items:end; gap:var(--space-3); margin-bottom:.4rem; }.bar-label>span { min-width:0; }.bar-label b,.bar-label small { display:block; }.bar-label b { font-size:.78rem; }.bar-label small { overflow:hidden; color:var(--color-text-muted); font-size:.7rem; text-overflow:ellipsis; white-space:nowrap; }.bar-label>strong { flex-shrink:0; font-size:.78rem; }.bar-track { height:.65rem; overflow:hidden; border-radius:.2rem; background:#e3e5ee; }.bar-track span { display:block; min-width:0; height:100%; background:var(--color-primary); transition:width .2s ease; }.vote-track span { background:#b77a0d; }.candidate-empty { padding:var(--space-4); border:1px dashed var(--color-border-strong); border-radius:var(--radius); color:var(--color-text-muted); text-align:center; font-size:var(--text-sm); }.report-link { display:flex; justify-content:flex-end; padding-top:var(--space-2); border-top:1px solid var(--color-border); }
@media(max-width:68rem){.metric-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.contest-grid{grid-template-columns:1fr}}
@media(max-width:58rem){.monitor-header{align-items:stretch;flex-direction:column}.monitor-controls,.monitor-controls label,.monitor-controls select{width:100%}}
@media(max-width:34rem){.metric-grid{grid-template-columns:1fr}.metric-grid article{min-height:0}.group-header,.contest-card>header{align-items:stretch;flex-direction:column}.report-link .action-link{width:100%;text-align:center}}
@media(prefers-reduced-motion:reduce){.bar-track span{transition:none}}
</style>
