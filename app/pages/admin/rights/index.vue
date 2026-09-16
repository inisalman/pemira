<script setup lang="ts">
type Election = { id: string; name: string; status: string; configVersion: number }
type RightRow = { code: string; title: string; office: string; granted: string; rolled: string; refused: string }
const { request } = useApi()
const elections = ref<Election[]>([])
const electionId = ref('')
const rights = ref<RightRow[]>([])
const readiness = ref<{ ready: boolean; problems: string[] } | null>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const notice = ref('')

async function loadElections() {
  try {
    const result = await request<{ elections: Election[] }>('/api/v1/admin/elections')
    elections.value = result.elections.filter(election => ['DRAFT', 'READY'].includes(election.status))
    electionId.value = elections.value[0]?.id ?? ''
    if (electionId.value) await loadData()
  } catch (cause) { error.value = apiErrorMessage(cause) }
}
async function loadData() {
  if (!electionId.value) return
  loading.value = true; error.value = ''
  try {
    const [rightResult, readinessResult] = await Promise.all([
      $fetch<RightRow[]>(`/api/v1/admin/elections/${encodeURIComponent(electionId.value)}/rights`, { retry: 0 }),
      $fetch<{ ready: boolean; problems: string[] }>(`/api/v1/admin/elections/${encodeURIComponent(electionId.value)}/readiness`, { retry: 0 }),
    ])
    rights.value = rightResult; readiness.value = readinessResult
  } catch (cause) { error.value = apiErrorMessage(cause) }
  finally { loading.value = false }
}
async function buildDefaults() {
  if (!electionId.value) return
  saving.value = true; error.value = ''; notice.value = ''
  try {
    const result = await request<{ rolled: number; rights: number }>(`/api/v1/admin/elections/${encodeURIComponent(electionId.value)}/rights`, { action: 'BUILD_DEFAULT' })
    notice.value = `${result.rolled} pemilih dimasukkan ke DPT dan ${result.rights} hak pilih dibentuk.`
    await loadData()
  } catch (cause) { error.value = apiErrorMessage(cause) }
  finally { saving.value = false }
}
async function markReady() {
  if (!electionId.value || !readiness.value?.ready) return
  saving.value = true; error.value = ''; notice.value = ''
  try { await request(`/api/v1/admin/elections/${encodeURIComponent(electionId.value)}/ready`, {}); notice.value = 'Periode dikunci sebagai READY.'; await loadElections() }
  catch (cause) { error.value = apiErrorMessage(cause) }
  finally { saving.value = false }
}
watch(electionId, () => { if (electionId.value) void loadData() })
onMounted(loadElections)
</script>

<template>
  <section class="admin-page admin-rights">
    <header class="page-header"><div><p class="eyebrow">HAK PILIH</p><h1>DPT dan kesiapan</h1><p class="intro">Periksa cakupan hak pilih sebelum periode dibuka.</p></div><label class="period-select">Periode<select v-model="electionId"><option value="" disabled>Pilih periode</option><option v-for="election in elections" :key="election.id" :value="election.id">{{ election.name }} · {{ election.status }}</option></select></label></header>
    <AppAlert v-if="error" kind="error" :message="error" /><AppAlert v-if="notice" kind="success" :message="notice" />
    <div v-if="loading" class="state" role="status">Memuat ringkasan…</div>
    <template v-else-if="electionId">
      <section class="actions"><div><h2>Bangun hak dasar</h2><p>Masukkan pemilih aktif ke DPT dan beri hak BEM/MPM serta Hima sesuai jurusan. Proses ini aman dijalankan ulang.</p></div><div class="action-group"><NuxtLink class="action-link" :to="`/admin/rights/matrix?election=${electionId}`">Atur per pemilih</NuxtLink><AppButton :loading="saving" :disabled="elections.find(e => e.id === electionId)?.status !== 'DRAFT'" @click="buildDefaults">Bangun hak dasar</AppButton></div></section>
      <section class="readiness" :class="readiness?.ready ? 'ready' : 'not-ready'"><div><h2>{{ readiness?.ready ? 'Siap dikunci' : 'Belum siap dikunci' }}</h2><p>{{ readiness?.ready ? 'Semua syarat periode terpenuhi.' : 'Perbaiki item berikut sebelum mengubah status ke READY.' }}</p></div><AppButton v-if="readiness?.ready" :loading="saving" @click="markReady">Kunci sebagai READY</AppButton><ul v-else><li v-for="problem in readiness?.problems" :key="problem">{{ problem }}</li></ul></section>
      <div class="table-heading"><h2>Ringkasan per kontes</h2><span>{{ rights.length }} kontes</span></div>
      <div v-if="!rights.length" class="state">Belum ada kontes pada periode ini.</div><div v-else class="table-wrap"><table><thead><tr><th>Kontes</th><th>Masuk DPT</th><th>Hak diberikan</th><th>Belum punya hak</th></tr></thead><tbody><tr v-for="row in rights" :key="row.code"><th scope="row">{{ row.title }}</th><td>{{ row.rolled }}</td><td>{{ row.granted }}</td><td>{{ row.refused }}</td></tr></tbody></table></div>
    </template>
    <div v-else class="state">Belum ada periode DRAFT atau READY.</div>
  </section>
</template>

<style scoped>
.admin-rights { display: grid; gap: var(--space-6); }.page-header { display:flex; justify-content:space-between; align-items:end; gap:var(--space-6); flex-wrap:wrap; }.eyebrow { margin:0 0 var(--space-2); color:var(--color-primary); font-size:.75rem; font-weight:700; letter-spacing:.08em; }.page-header h1 { margin-bottom:var(--space-2); }.intro, .actions p, .readiness p, .table-heading span { margin:0; color:var(--color-text-muted); }.period-select { display:grid; gap:var(--space-1); font-size:var(--text-sm); font-weight:600; }.period-select select { min-width:18rem; min-height:2.75rem; padding:var(--space-2) var(--space-3); border:1px solid var(--color-text-muted); border-radius:var(--radius); background:var(--color-surface); color:var(--color-text); font:inherit; }.actions, .readiness { display:flex; align-items:center; justify-content:space-between; gap:var(--space-6); padding:var(--space-4); border:1px solid var(--color-border); border-radius:var(--radius-lg); background:var(--color-surface); }.actions h2, .readiness h2, .table-heading h2 { margin:0 0 var(--space-1); font-size:var(--text-lg); }.readiness.ready { border-color:var(--color-success); background:var(--color-success-bg); }.readiness.not-ready { border-color:var(--color-warning); background:var(--color-warning-bg); align-items:start; }.readiness ul { margin:var(--space-3) 0 0; padding-left:var(--space-6); }.table-heading { display:flex; align-items:baseline; gap:var(--space-3); }.table-wrap { overflow-x:auto; }.table-wrap table { width:100%; border-collapse:collapse; background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius); font-size:var(--text-sm); }.table-wrap th, .table-wrap td { padding:var(--space-3); border-bottom:1px solid var(--color-border); text-align:start; }.table-wrap thead th { background:var(--color-primary-soft); }.table-wrap tbody th { font-weight:600; }.state { padding:var(--space-8) var(--space-4); text-align:center; color:var(--color-text-muted); background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius); }
.admin-rights { display: grid; gap: var(--space-6); }.page-header { display:flex; justify-content:space-between; align-items:end; gap:var(--space-6); flex-wrap:wrap; }.eyebrow { margin:0 0 var(--space-2); color:var(--color-primary); font-size:.75rem; font-weight:700; letter-spacing:.08em; }.page-header h1 { margin-bottom:var(--space-2); }.intro, .actions p, .readiness p, .table-heading span { margin:0; color:var(--color-text-muted); }.period-select { display:grid; gap:var(--space-1); font-size:var(--text-sm); font-weight:600; }.period-select select { min-width:18rem; min-height:2.75rem; padding:var(--space-2) var(--space-3); border:1px solid var(--color-text-muted); border-radius:var(--radius); background:var(--color-surface); color:var(--color-text); font:inherit; }.actions, .readiness { display:flex; align-items:center; justify-content:space-between; gap:var(--space-6); padding:var(--space-4); border:1px solid var(--color-border); border-radius:var(--radius-lg); background:var(--color-surface); }.action-group { display:flex; align-items:center; gap:var(--space-3); flex-wrap:wrap; }.actions h2, .readiness h2, .table-heading h2 { margin:0 0 var(--space-1); font-size:var(--text-lg); }.readiness.ready { border-color:var(--color-success); background:var(--color-success-bg); }.readiness.not-ready { border-color:var(--color-warning); background:var(--color-warning-bg); align-items:start; }.readiness ul { margin:var(--space-3) 0 0; padding-left:var(--space-6); }.table-heading { display:flex; align-items:baseline; gap:var(--space-3); }.table-wrap { overflow-x:auto; }.table-wrap table { width:100%; border-collapse:collapse; background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius); font-size:var(--text-sm); }.table-wrap th, .table-wrap td { padding:var(--space-3); border-bottom:1px solid var(--color-border); text-align:start; }.table-wrap thead th { background:var(--color-primary-soft); }.table-wrap tbody th { font-weight:600; }.state { padding:var(--space-8) var(--space-4); text-align:center; color:var(--color-text-muted); background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius); }
@media (max-width:42rem) { .period-select, .period-select select { width:100%; min-width:0; }.actions, .readiness { align-items:stretch; flex-direction:column; }.actions button, .readiness button { width:100%; } }
</style>
