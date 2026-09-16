<script setup lang="ts">
type Election = { id: string; name: string; status: string; startsAt: string | null; endsAt: string | null; configVersion: number }
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
  <section class="admin-elections">
    <header><h1>Periode pemilihan</h1><p>Buat periode lalu lengkapi kontes dan calon sebelum mengajukan pemeriksaan kesiapan.</p></header>
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
  </section>
</template>

<style scoped>
.admin-elections { display: grid; gap: var(--space-6); }
.admin-elections header p { color: var(--color-text-muted); }
.create-form { max-width: 44rem; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-4); background: var(--color-surface); }
.create-form h2 { font-size: var(--text-lg); }
.dates { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-4); }
.dates label { display: grid; gap: var(--space-1); font-size: var(--text-sm); font-weight: 600; }
.dates input { border: 1px solid var(--color-text-muted); border-radius: var(--radius); color: var(--color-text); font: inherit; min-height: 2.75rem; padding: var(--space-2); min-width: 0; }
@media (max-width: 42rem) { .dates { grid-template-columns: 1fr; } }
</style>
