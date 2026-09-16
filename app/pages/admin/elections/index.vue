<script setup lang="ts">
type Election = { id: string; name: string; status: string; startsAt: string | null; endsAt: string | null; configVersion: number }
type Contest = { id: string; code: string; title: string; office: 'PAIR' | 'CHAIR' | 'VICE_CHAIR'; optionType: 'PAIR' | 'SINGLE'; departmentCode: string | null; departmentName: string | null; options: unknown[] }

const DEPARTMENTS = [
  { code: 'KEP', name: 'Keperawatan' },
  { code: 'KEB', name: 'Kebidanan' },
  { code: 'KG', name: 'Kesehatan Gigi' },
  { code: 'OP', name: 'Ortotik Prostetik' },
]
const { request } = useApi()
const elections = ref<Election[]>([])
const name = ref('')
const startsAt = ref('')
const endsAt = ref('')
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const notice = ref('')
const columns = [{ key: 'name', label: 'Nama periode' }, { key: 'status', label: 'Status' }, { key: 'starts', label: 'Mulai' }, { key: 'ends', label: 'Selesai' }]
const rows = computed(() => elections.value.map(election => ({ id: election.id, name: election.name, status: electionStatus(election.status), starts: electionDate(election.startsAt), ends: electionDate(election.endsAt) })))
async function load() {
  loading.value = true; error.value = ''
  try { elections.value = (await request<{ elections: Election[] }>('/api/v1/admin/elections')).elections }
  catch (cause) { error.value = apiErrorMessage(cause) }
  finally { loading.value = false }
}
function toDate(value: string) { return value ? new Date(value).toISOString() : undefined }

// --- Kontes (pemilihan jabatan) ---
const draftElections = computed(() => elections.value.filter(election => election.status === 'DRAFT'))
const contestElectionId = ref('')
const contests = ref<Contest[]>([])
const loadingContests = ref(false)
const savingContest = ref(false)
const contestError = ref('')
const contestNotice = ref('')
const contestForm = reactive({ code: '', title: '', office: 'CHAIR', optionType: 'SINGLE', departmentCode: '' })

const contestDept = computed(() => DEPARTMENTS.find(dept => dept.code === contestForm.departmentCode) ?? null)

watch(contestElectionId, () => { if (contestElectionId.value) void loadContests() })
watch(draftElections, (list) => {
  if (!list.some(election => election.id === contestElectionId.value)) contestElectionId.value = list[0]?.id ?? ''
})
watch(contestForm, (form) => {
  if (form.office === 'PAIR' && form.optionType !== 'PAIR') form.optionType = 'PAIR'
  if (form.office !== 'PAIR') form.optionType = 'SINGLE'
})

async function loadContests() {
  loadingContests.value = true; contestError.value = ''
  try {
    const result = await $fetch<{ contests: Contest[] }>(`/api/v1/admin/elections/${encodeURIComponent(contestElectionId.value)}/candidates`, { retry: 0, timeout: 15_000 })
    contests.value = result.contests
  } catch (cause) { contestError.value = apiErrorMessage(cause) }
  finally { loadingContests.value = false }
}

const contestColumns = [{ key: 'code', label: 'Kode' }, { key: 'title', label: 'Judul' }, { key: 'type', label: 'Jenis' }, { key: 'department', label: 'Departemen' }, { key: 'options', label: 'Kandidat' }]
const contestRows = computed(() => contests.value.map(contest => ({
  id: contest.id,
  code: contest.code,
  title: contest.title,
  type: contest.optionType === 'PAIR' ? 'Pasangan ketua & wakil' : `Calon ${contest.office === 'CHAIR' ? 'ketua' : 'wakil'} tunggal`,
  department: contest.departmentName ?? '—',
  options: String(contest.options?.length ?? 0),
})))

async function saveContest() {
  contestError.value = ''; contestNotice.value = ''
  if (!contestElectionId.value) { contestError.value = 'Pilih periode DRAFT dulu.'; return }
  if (!contestForm.code.trim() || contestForm.code.trim().length < 2) { contestError.value = 'Kode kontes minimal 2 karakter.'; return }
  if (!contestForm.title.trim() || contestForm.title.trim().length < 3) { contestError.value = 'Judul kontes minimal 3 karakter.'; return }
  if (contestForm.office === 'PAIR' && contestForm.departmentCode) { contestError.value = 'Kontes BEM/MPM tidak terikat departemen. Kosongkan departemen.'; return }
  savingContest.value = true
  try {
    const body = {
      code: contestForm.code.trim(),
      title: contestForm.title.trim(),
      office: contestForm.office as 'PAIR' | 'CHAIR' | 'VICE_CHAIR',
      optionType: contestForm.optionType as 'PAIR' | 'SINGLE',
      scopeDepartmentId: contestDept.value?.id ?? null,
    }
    await request(`/api/v1/admin/elections/${encodeURIComponent(contestElectionId.value)}/contests`, body)
    Object.assign(contestForm, { code: '', title: '', office: 'CHAIR', optionType: 'SINGLE', departmentCode: '' })
    contestNotice.value = 'Kontes ditambahkan.'
    await loadContests()
  } catch (cause) { contestError.value = apiErrorMessage(cause) }
  finally { savingContest.value = false }
}
async function create() {
  error.value = ''; notice.value = ''
  if (!name.value.trim()) { error.value = 'Nama periode wajib diisi.'; return }
  if (startsAt.value && endsAt.value && new Date(endsAt.value) <= new Date(startsAt.value)) { error.value = 'Waktu selesai harus setelah waktu mulai.'; return }
  saving.value = true
  try {
    await request('/api/v1/admin/elections', { name: name.value.trim(), startsAt: toDate(startsAt.value), endsAt: toDate(endsAt.value) })
    name.value = startsAt.value = endsAt.value = ''
    notice.value = 'Periode baru disimpan sebagai DRAFT.'
    await load()
  } catch (cause) { error.value = apiErrorMessage(cause) }
  finally { saving.value = false }
}
onMounted(load)
</script>

<template>
  <section class="admin-page admin-elections">
    <header class="page-header"><div><p class="eyebrow">PERSIAPAN PEMILIHAN</p><h1>Periode pemilihan</h1><p class="intro">Buat periode lalu lengkapi kontes dan calon sebelum mengajukan pemeriksaan kesiapan.</p></div></header>
    <AppAlert v-if="error" kind="error" :message="error" />
    <AppAlert v-if="notice" kind="success" :message="notice" />
    <form class="create-form" @submit.prevent="create">
      <h2>Buat periode</h2>
      <div class="form-fields">
        <AppInput v-model="name" label="Nama periode" required hint="Gunakan nama yang akan dibaca pemilih." />
        <div class="dates"><label>Mulai <input v-model="startsAt" type="datetime-local" :disabled="saving"></label><label>Selesai <input v-model="endsAt" type="datetime-local" :disabled="saving"></label></div>
        <AppButton type="submit" :loading="saving">Simpan periode</AppButton>
      </div>
    </form>
    <div v-if="loading" role="status">Memuat periode…</div>
    <AppTable v-else :columns="columns" :rows="rows" empty-message="Belum ada periode. Buat periode pertama di formulir ini." />

    <div class="contest-panel">
      <h2>Kontes</h2>
      <p class="contest-intro">Daftar jabatan yang diperebutkan dalam satu periode. Kandidat diisi di halaman Kandidat pemilihan.</p>
      <AppAlert v-if="contestError" kind="error" :message="contestError" />
      <AppAlert v-if="contestNotice" kind="success" :message="contestNotice" />
      <div v-if="!draftElections.length" class="state">Belum ada periode DRAFT. Kontes hanya ditambah saat periode masih draft.</div>
      <template v-else>
        <form class="contest-form" @submit.prevent="saveContest">
          <label class="period-select">Periode
            <select v-model="contestElectionId">
              <option value="" disabled>Pilih periode DRAFT</option>
              <option v-for="election in draftElections" :key="election.id" :value="election.id">{{ election.name }}</option>
            </select>
          </label>
          <AppInput v-model="contestForm.code" label="Kode" required hint="Singkatan unik, mis. BEM, HIMA_KEP_CHAIR" />
          <AppInput v-model="contestForm.title" label="Judul" required hint="Judul yang dibaca pemilih, mis. Ketua dan wakil BEM" />
          <label class="field">Jenis opsi
            <select v-model="contestForm.office">
              <option value="PAIR">Pasangan ketua & wakil (PAIR)</option>
              <option value="CHAIR">Calon ketua tunggal</option>
              <option value="VICE_CHAIR">Calon wakil tunggal</option>
            </select>
          </label>
          <label class="field">Departemen<span v-if="contestForm.office !== 'PAIR'" class="hint-inline"> (wajib untuk kontes hima)</span>
            <select v-model="contestForm.departmentCode" :required="contestForm.office !== 'PAIR'">
              <option value="">Tidak terikat departemen</option>
              <option v-for="dept in DEPARTMENTS" :key="dept.code" :value="dept.code">{{ dept.name }}</option>
            </select>
          </label>
          <AppButton type="submit" :loading="savingContest">Tambah kontes</AppButton>
        </form>
        <div v-if="loadingContests" role="status" class="state">Memuat kontes…</div>
        <AppTable v-else :columns="contestColumns" :rows="contestRows" empty-message="Periode ini belum memiliki kontes." />
      </template>
    </div>
  </section>
</template>

<style scoped>
.admin-elections { display: grid; gap: var(--space-6); }
.admin-elections header p { color: var(--color-text-muted); }
.create-form { max-width: 44rem; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-6); background: var(--color-surface); box-shadow: var(--shadow-sm); }
.create-form h2 { font-size: var(--text-lg); }
.dates { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-4); }
.dates label { display: grid; gap: var(--space-1); font-size: var(--text-sm); font-weight: 600; }
.dates input { border: 1px solid var(--color-text-muted); border-radius: var(--radius); color: var(--color-text); font: inherit; min-height: 2.75rem; padding: var(--space-2); min-width: 0; }
@media (max-width: 42rem) { .dates { grid-template-columns: 1fr; } }
.contest-panel { max-width: 72rem; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-6); background: var(--color-surface); box-shadow: var(--shadow-sm); display: grid; gap: var(--space-4); }
.contest-panel h2 { font-size: var(--text-lg); }
.contest-intro { color: var(--color-text-muted); margin: 0; }
.contest-form { display: grid; grid-template-columns: minmax(12rem, 1fr) minmax(10rem, 1fr) minmax(16rem, 2fr) minmax(14rem, 1.5fr) minmax(14rem, 1.5fr) auto; gap: var(--space-3); align-items: end; }
.field, .period-select { display: grid; gap: var(--space-1); font-size: var(--text-sm); font-weight: 600; }
.field select, .period-select select { min-height: 2.75rem; border: 1px solid var(--color-text-muted); border-radius: var(--radius); background: var(--color-surface); color: var(--color-text); padding: var(--space-2) var(--space-3); font: inherit; min-width: 0; }
.hint-inline { font-weight: 400; color: var(--color-text-muted); }
.state { padding: var(--space-6) var(--space-4); text-align: center; background: var(--color-surface); border: 1px dashed var(--color-border); border-radius: var(--radius); color: var(--color-text-muted); }
.contest-form button { align-self: end; }
@media (max-width: 64rem) { .contest-form { grid-template-columns: 1fr 1fr; } }
@media (max-width: 42rem) { .contest-form { grid-template-columns: 1fr; } .contest-form button { width: 100%; } .field select, .period-select select { min-width: 0; width: 100%; } }
</style>
