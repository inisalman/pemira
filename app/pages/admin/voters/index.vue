<script setup lang="ts">
type Voter = {
  id: string
  voterType: 'STUDENT' | 'LECTURER'
  identifierType: 'NIM' | 'NIP_LOCAL'
  identifierValue: string
  name: string
  departmentCode: string | null
  departmentName: string | null
  activeStatus: boolean
}

type VoterList = { items: Voter[]; total: number; page: number; pageSize: number }
type ImportPreview = {
  batchId: string
  totalRows: number
  errorRows: { row: number; code: string; message: string }[]
  preview: { row: number; voterType: string; identifierType: string; identifierValue: string; name: string; departmentCode: string }[]
}

const { request } = useApi()
const voters = ref<Voter[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const search = ref('')
const voterType = ref('')
const departmentCode = ref('')
const activeStatus = ref('true')
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const notice = ref('')
const formOpen = ref(false)
const editing = ref(false)
const importOpen = ref(false)
const selectedFile = ref<File | null>(null)
const importLoading = ref(false)
const importPreview = ref<ImportPreview | null>(null)
const importError = ref('')
const form = reactive({
  voterType: 'STUDENT' as 'STUDENT' | 'LECTURER',
  identifierValue: '',
  name: '',
  departmentCode: 'KEP',
  activeStatus: true,
})

const departments = [
  { code: 'KEP', name: 'Keperawatan' },
  { code: 'KEB', name: 'Kebidanan' },
  { code: 'KG', name: 'Kesehatan Gigi' },
  { code: 'OP', name: 'Ortotik Prostetik' },
]

const rows = computed(() => voters.value.map(voter => ({
  ...voter,
  typeLabel: voter.voterType === 'STUDENT' ? 'Mahasiswa' : 'Dosen',
  identifierLabel: voter.identifierType === 'NIM' ? 'NIM' : 'NIP lokal',
  departmentLabel: voter.departmentName ? `${voter.departmentCode} · ${voter.departmentName}` : voter.departmentCode ?? '—',
  statusLabel: voter.activeStatus ? 'Aktif' : 'Nonaktif',
})))

const columns = [
  { key: 'name', label: 'Nama' },
  { key: 'identifier', label: 'Identitas' },
  { key: 'typeLabel', label: 'Jenis' },
  { key: 'departmentLabel', label: 'Jurusan' },
  { key: 'statusLabel', label: 'Status' },
  { key: 'actions', label: 'Aksi', align: 'end' as const },
]

function queryPath() {
  const params = new URLSearchParams({ page: String(page.value), pageSize: String(pageSize) })
  if (search.value.trim()) params.set('search', search.value.trim())
  if (voterType.value) params.set('voterType', voterType.value)
  if (departmentCode.value) params.set('departmentCode', departmentCode.value)
  if (activeStatus.value) params.set('activeStatus', activeStatus.value)
  return `/api/v1/admin/voters?${params.toString()}`
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const result = await $fetch<VoterList>(queryPath(), { retry: 0, timeout: 15_000 })
    voters.value = result.items
    total.value = result.total
  } catch (cause) {
    error.value = apiErrorMessage(cause)
  } finally {
    loading.value = false
  }
}

function resetPageAndLoad() {
  page.value = 1
  void load()
}

function openForm() {
  editing.value = false
  Object.assign(form, { voterType: 'STUDENT', identifierValue: '', name: '', departmentCode: 'KEP', activeStatus: true })
  formOpen.value = true
}

function openEdit(voter: Voter) {
  editing.value = true
  Object.assign(form, {
    voterType: voter.voterType,
    identifierValue: voter.identifierValue,
    name: voter.name,
    departmentCode: voter.departmentCode ?? 'KEP',
    activeStatus: voter.activeStatus,
  })
  formOpen.value = true
}

async function saveVoter() {
  error.value = ''
  notice.value = ''
  if (!form.identifierValue.trim() || !/^[0-9]+$/.test(form.identifierValue.trim())) {
    error.value = 'NIM/NIP lokal harus berupa angka.'
    return
  }
  if (!form.name.trim()) {
    error.value = 'Nama pemilih wajib diisi.'
    return
  }
  saving.value = true
  try {
    await request('/api/v1/admin/voters', {
      voterType: form.voterType,
      identifierType: form.voterType === 'STUDENT' ? 'NIM' : 'NIP_LOCAL',
      identifierValue: form.identifierValue.trim(),
      name: form.name.trim(),
      departmentCode: form.departmentCode,
      activeStatus: form.activeStatus,
    })
    formOpen.value = false
    notice.value = 'Data pemilih disimpan.'
    await load()
  } catch (cause) {
    error.value = apiErrorMessage(cause)
  } finally {
    saving.value = false
  }
}

function onFileChange(event: Event) {
  selectedFile.value = (event.target as HTMLInputElement).files?.[0] ?? null
  importPreview.value = null
  importError.value = ''
}

function csrfToken() {
  const value = document.cookie.split('; ').find(item => item.startsWith('pemira_csrf='))?.slice(12)
  return value ? decodeURIComponent(value) : ''
}

async function validateImport() {
  if (!selectedFile.value) {
    importError.value = 'Pilih berkas .xlsx terlebih dahulu.'
    return
  }
  importLoading.value = true
  importError.value = ''
  importPreview.value = null
  try {
    const body = new FormData()
    body.append('file', selectedFile.value)
    importPreview.value = await $fetch<ImportPreview>('/api/v1/admin/voters/import', {
      method: 'POST', body, headers: { 'x-csrf-token': csrfToken() }, retry: 0, timeout: 30_000,
    })
  } catch (cause) {
    importError.value = apiErrorMessage(cause)
  } finally {
    importLoading.value = false
  }
}

async function commitImport() {
  if (!selectedFile.value || !importPreview.value || importPreview.value.errorRows.length > 0) return
  importLoading.value = true
  importError.value = ''
  try {
    const body = new FormData()
    body.append('file', selectedFile.value)
    const result = await $fetch<{ added: number; updated: number; skipped: number }>(`/api/v1/admin/voters/import?mode=commit&batchId=${encodeURIComponent(importPreview.value.batchId)}`, {
      method: 'POST', body, headers: { 'x-csrf-token': csrfToken() }, retry: 0, timeout: 30_000,
    })
    importOpen.value = false
    importPreview.value = null
    selectedFile.value = null
    notice.value = `Impor selesai: ${result.added} ditambahkan, ${result.updated} diperbarui, ${result.skipped} dilewati.`
    await load()
  } catch (cause) {
    importError.value = apiErrorMessage(cause)
  } finally {
    importLoading.value = false
  }
}

async function downloadTemplate() {
  try {
    const blob = await $fetch<Blob>('/api/v1/admin/voters/template', { responseType: 'blob', retry: 0 })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'template-impor-pemilih.xlsx'
    anchor.click()
    URL.revokeObjectURL(url)
  } catch (cause) {
    error.value = apiErrorMessage(cause)
  }
}

watch([search, voterType, departmentCode, activeStatus], resetPageAndLoad)
onMounted(load)
</script>

<template>
  <section class="admin-voters">
    <header class="page-header">
      <div>
        <p class="eyebrow">DATA PEMILIH</p>
        <h1>Daftar pemilih</h1>
        <p class="intro">Siapkan DPT mahasiswa dan dosen sebelum hak pilih dibentuk.</p>
      </div>
      <div class="header-actions">
        <AppButton variant="secondary" @click="importOpen = true">Impor Excel</AppButton>
        <AppButton @click="openForm">Tambah pemilih</AppButton>
      </div>
    </header>

    <AppAlert v-if="error" kind="error" :message="error" />
    <AppAlert v-if="notice" kind="success" :message="notice" />

    <section class="filters" aria-labelledby="filter-title">
      <h2 id="filter-title">Filter data</h2>
      <div class="filter-grid">
        <AppInput v-model="search" label="Cari nama atau identitas" type="search" inputmode="search" hint="Pencarian diterapkan otomatis." />
        <label class="select-field">Jenis pemilih<select v-model="voterType"><option value="">Semua jenis</option><option value="STUDENT">Mahasiswa</option><option value="LECTURER">Dosen</option></select></label>
        <label class="select-field">Jurusan<select v-model="departmentCode"><option value="">Semua jurusan</option><option v-for="department in departments" :key="department.code" :value="department.code">{{ department.code }} · {{ department.name }}</option></select></label>
        <label class="select-field">Status<select v-model="activeStatus"><option value="">Semua status</option><option value="true">Aktif</option><option value="false">Nonaktif</option></select></label>
      </div>
    </section>

    <div class="table-heading"><h2>Hasil pemilih</h2><span>{{ total }} data</span></div>
    <AppTable :columns="columns" :rows="rows" :loading="loading" empty-message="Belum ada pemilih dengan filter ini.">
      <template #cell-identifier="{ row }"><span class="identifier"><strong>{{ row.identifierLabel }}</strong> {{ row.identifierValue }}</span></template>
      <template #cell-statusLabel="{ value }"><span :class="['status', value === 'Aktif' ? 'active' : 'inactive']">{{ value }}</span></template>
      <template #cell-actions="{ row }">
        <div class="row-actions">
          <button class="row-action" type="button" @click="openEdit(row as Voter)">Edit</button>
        </div>
      </template>
    </AppTable>
    <AppPagination v-model:page="page" :page-size="pageSize" :total="total" @update:page="load" />

    <AppDialog :open="formOpen" :title="editing ? 'Edit pemilih' : 'Tambah pemilih'" confirm-label="Simpan" :loading="saving" @cancel="formOpen = false" @confirm="saveVoter">
      <form class="dialog-form" @submit.prevent="saveVoter">
        <p class="dialog-copy">Data dengan identitas yang sama akan diperbarui, bukan digandakan.</p>
        <AppInput v-model="form.identifierValue" :label="form.voterType === 'STUDENT' ? 'NIM' : 'NIP lokal'" required inputmode="numeric" autocomplete="off" :disabled="editing" />
        <label class="select-field">Jenis pemilih<select v-model="form.voterType"><option value="STUDENT">Mahasiswa</option><option value="LECTURER">Dosen</option></select></label>
        <AppInput v-model="form.name" label="Nama lengkap" required autocomplete="name" />
        <label class="select-field">Jurusan<select v-model="form.departmentCode"><option v-for="department in departments" :key="department.code" :value="department.code">{{ department.code }} · {{ department.name }}</option></select></label>
        <label class="check-field"><input v-model="form.activeStatus" type="checkbox"> Akun pemilih aktif</label>
      </form>
    </AppDialog>

    <AppDialog :open="importOpen" title="Impor DPT" :confirm-label="importPreview ? 'Commit impor' : 'Validasi berkas'" :loading="importLoading" :danger="false" @cancel="importOpen = false" @confirm="importPreview ? commitImport() : validateImport()">
      <div class="dialog-form">
        <p class="dialog-copy">Gunakan template resmi. Identitas dibaca sebagai teks agar nol di depan tetap tersimpan.</p>
        <button class="text-link" type="button" @click="downloadTemplate">Unduh template XLSX</button>
        <label class="file-field">Berkas XLSX<input type="file" accept=".xlsx" @change="onFileChange"></label>
        <AppAlert v-if="importError" kind="error" :message="importError" />
        <div v-if="importPreview" class="preview" aria-live="polite">
          <h3>Pratinjau {{ importPreview.totalRows }} baris valid</h3>
          <AppAlert v-if="importPreview.errorRows.length" kind="warning" :message="`${importPreview.errorRows.length} baris perlu diperbaiki sebelum commit.`" />
          <ul v-if="importPreview.errorRows.length" class="error-list"><li v-for="row in importPreview.errorRows.slice(0, 8)" :key="`${row.row}-${row.code}`">Baris {{ row.row }}: {{ row.message }}</li></ul>
          <div v-else class="preview-table" role="region" aria-label="Pratinjau data impor" tabindex="0"><table><thead><tr><th>Baris</th><th>Identitas</th><th>Nama</th><th>Jurusan</th></tr></thead><tbody><tr v-for="row in importPreview.preview" :key="row.row"><td>{{ row.row }}</td><td>{{ row.identifierValue }}</td><td>{{ row.name }}</td><td>{{ row.departmentCode }}</td></tr></tbody></table></div>
        </div>
      </div>
    </AppDialog>
  </section>
</template>

<style scoped>
.admin-voters { display: grid; gap: var(--space-6); }
.page-header { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--space-6); flex-wrap: wrap; }
.eyebrow { margin: 0 0 var(--space-2); color: var(--color-primary); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; }
.page-header h1 { margin-bottom: var(--space-2); }
.intro, .dialog-copy, .table-heading span { color: var(--color-text-muted); }
.intro { margin: 0; }
.header-actions, .dialog-actions { display: flex; gap: var(--space-3); flex-wrap: wrap; }
.filters { border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface); padding: var(--space-4); }
.filters h2, .table-heading h2 { font-size: var(--text-lg); margin: 0; }
.filter-grid { display: grid; grid-template-columns: 2fr repeat(3, minmax(10rem, 1fr)); gap: var(--space-4); margin-top: var(--space-4); }
.select-field, .file-field { display: grid; gap: var(--space-1); font-size: var(--text-sm); font-weight: 600; }
.select-field select { width: 100%; min-height: 2.75rem; border: 1px solid var(--color-text-muted); border-radius: var(--radius); background: var(--color-surface); color: var(--color-text); padding: var(--space-2) var(--space-3); font: inherit; }
.select-field select:focus-visible, .file-field input:focus-visible { box-shadow: var(--focus-ring); outline: none; }
.table-heading { display: flex; align-items: baseline; gap: var(--space-3); }
.identifier { white-space: nowrap; }
.status { display: inline-flex; align-items: center; min-height: 1.75rem; padding: 0 var(--space-2); border-radius: var(--radius); font-size: var(--text-sm); font-weight: 600; }
.status.active { background: var(--color-success-bg); color: var(--color-success); }
.status.inactive { background: var(--color-danger-bg); color: var(--color-danger); }
.row-actions { display: flex; justify-content: flex-end; }
.row-action { min-height: 2.75rem; padding: var(--space-2) var(--space-3); border: 1px solid var(--color-primary); border-radius: var(--radius); background: var(--color-surface); color: var(--color-primary); font: inherit; font-weight: 600; cursor: pointer; }
.row-action:hover { background: var(--color-primary-soft); }
.dialog-form { display: grid; gap: var(--space-4); }
.dialog-copy { margin: 0; font-size: var(--text-sm); }
.check-field { display: flex; align-items: center; gap: var(--space-2); min-height: 2.75rem; }
.check-field input { width: 1.15rem; height: 1.15rem; accent-color: var(--color-primary); }
.text-link { width: fit-content; padding: 0; border: 0; background: none; color: var(--color-primary); text-decoration: underline; font: inherit; font-weight: 600; cursor: pointer; min-height: 2.75rem; }
.file-field input { padding: var(--space-2) 0; font: inherit; }
.preview { display: grid; gap: var(--space-3); }
.preview h3 { font-size: var(--text-base); margin: 0; }
.preview-table { overflow-x: auto; border: 1px solid var(--color-border); border-radius: var(--radius); }
.preview-table table { width: 100%; min-width: 32rem; border-collapse: collapse; font-size: var(--text-sm); }
.preview-table th, .preview-table td { padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); text-align: start; }
.preview-table th { background: var(--color-primary-soft); }
.error-list { margin: 0; padding-left: var(--space-6); color: var(--color-danger); font-size: var(--text-sm); }
@media (max-width: 60rem) { .filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .filter-grid > :first-child { grid-column: 1 / -1; } }
@media (max-width: 42rem) { .filter-grid { grid-template-columns: 1fr; } .filter-grid > :first-child { grid-column: auto; } .header-actions { width: 100%; } .header-actions > * { flex: 1; } }
</style>
