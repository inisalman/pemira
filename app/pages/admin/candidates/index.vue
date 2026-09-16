<script setup lang="ts">
type Election = { id: string; name: string; status: string }
type Member = { name: string; position: 'CHAIR' | 'VICE_CHAIR' }
type Option = { id: string; contestId: string; number: number; photoKey: string | null; motto: string | null; vision: string | null; mission: string | null; programs: string | null; members: Member[] }
type Contest = { id: string; code: string; title: string; office: 'PAIR' | 'CHAIR' | 'VICE_CHAIR'; optionType: 'PAIR' | 'SINGLE'; departmentCode: string | null; departmentName: string | null; options: Option[] }

const { request } = useApi()
const elections = ref<Election[]>([])
const electionId = ref('')
const contests = ref<Contest[]>([])
const selectedContestId = ref('')
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const notice = ref('')
const dialogOpen = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ number: '1', chair: '', viceChair: '', motto: '', vision: '', mission: '', programs: '' })
const selectedFile = ref<File | null>(null)
const photoPreview = ref('')

const selectedContest = computed(() => contests.value.find(contest => contest.id === selectedContestId.value) ?? null)
const isPair = computed(() => selectedContest.value?.optionType === 'PAIR')

async function loadElections() {
  try {
    const result = await request<{ elections: Election[] }>('/api/v1/admin/elections')
    elections.value = result.elections.filter(election => election.status === 'DRAFT')
    electionId.value = elections.value[0]?.id ?? ''
    if (electionId.value) await loadCandidates()
  } catch (cause) { error.value = apiErrorMessage(cause) }
}

async function loadCandidates() {
  if (!electionId.value) return
  loading.value = true; error.value = ''
  try {
    const result = await $fetch<{ contests: Contest[] }>(`/api/v1/admin/elections/${encodeURIComponent(electionId.value)}/candidates`, { retry: 0, timeout: 15_000 })
    contests.value = result.contests
    selectedContestId.value = contests.value.some(contest => contest.id === selectedContestId.value) ? selectedContestId.value : contests.value[0]?.id ?? ''
  } catch (cause) { error.value = apiErrorMessage(cause) }
  finally { loading.value = false }
}

function newCandidate(contest: Contest) {
  selectedContestId.value = contest.id; editingId.value = null; selectedFile.value = null; photoPreview.value = ''; Object.assign(form, { number: String(contest.options.length + 1), chair: '', viceChair: '', motto: '', vision: '', mission: '', programs: '' }); dialogOpen.value = true
}

function editCandidate(option: Option, contest: Contest) {
  selectedContestId.value = contest.id; editingId.value = option.id
  selectedFile.value = null; photoPreview.value = option.photoKey ? `/api/v1/public/candidate-photos/${encodeURIComponent(option.photoKey)}` : ''
  const chair = option.members.find(member => member.position === 'CHAIR')?.name ?? ''
  const viceChair = option.members.find(member => member.position === 'VICE_CHAIR')?.name ?? ''
  Object.assign(form, { number: String(option.number), chair, viceChair, motto: option.motto ?? '', vision: option.vision ?? '', mission: option.mission ?? '', programs: option.programs ?? '' }); dialogOpen.value = true
}

function csrfToken() { const value = document.cookie.split('; ').find(item => item.startsWith('pemira_csrf='))?.slice(12); return value ? decodeURIComponent(value) : '' }

async function saveCandidate() {
  const contest = selectedContest.value
  if (!contest) return
  error.value = ''; notice.value = ''
  if (!form.chair.trim() || (isPair.value && !form.viceChair.trim())) { error.value = isPair.value ? 'Nama ketua dan wakil wajib diisi.' : 'Nama calon wajib diisi.'; return }
  saving.value = true
  try {
    const members: Member[] = isPair.value ? [{ name: form.chair.trim(), position: 'CHAIR' }, { name: form.viceChair.trim(), position: 'VICE_CHAIR' }] : [{ name: form.chair.trim(), position: contest.office === 'VICE_CHAIR' ? 'VICE_CHAIR' : 'CHAIR' }]
    const body = { number: Number(form.number), members, motto: form.motto.trim() || undefined, vision: form.vision.trim() || undefined, mission: form.mission.trim() || undefined, programs: form.programs.trim() || undefined }
    const result = editingId.value
      ? await $fetch<{ id?: string }>(`/api/v1/admin/options/${encodeURIComponent(editingId.value)}`, { method: 'PATCH', body, headers: { 'x-csrf-token': csrfToken() }, retry: 0 })
      : await request<{ id: string }>(`/api/v1/admin/contests/${encodeURIComponent(contest.id)}/options`, body)
    const optionId = editingId.value ?? result.id
    if (selectedFile.value && optionId) await uploadPhoto(optionId)
    dialogOpen.value = false; notice.value = editingId.value ? 'Data calon diperbarui.' : 'Calon ditambahkan.'; await loadCandidates()
  } catch (cause) { error.value = apiErrorMessage(cause) }
  finally { saving.value = false }
}

function onPhotoChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null
  selectedFile.value = file
  photoPreview.value = file ? URL.createObjectURL(file) : ''
}

async function uploadPhoto(optionId: string) {
  const body = new FormData()
  body.append('file', selectedFile.value!)
  await $fetch(`/api/v1/admin/options/${encodeURIComponent(optionId)}/photo`, { method: 'POST', body, headers: { 'x-csrf-token': csrfToken() }, retry: 0, timeout: 30_000 })
}

watch(electionId, () => { if (electionId.value) void loadCandidates() })
onMounted(loadElections)
</script>

<template>
  <section class="admin-candidates">
    <header class="page-header"><div><p class="eyebrow">DATA CALON</p><h1>Kandidat pemilihan</h1><p class="intro">Masukkan pasangan dan calon individu sebelum periode dikunci.</p></div><label class="period-select">Periode<select v-model="electionId"><option value="" disabled>Pilih periode DRAFT</option><option v-for="election in elections" :key="election.id" :value="election.id">{{ election.name }}</option></select></label></header>
    <AppAlert v-if="error" kind="error" :message="error" /><AppAlert v-if="notice" kind="success" :message="notice" />
    <div v-if="loading" role="status" class="state">Memuat kontes…</div>
    <div v-else-if="!electionId" class="state">Belum ada periode DRAFT. Buat periode terlebih dahulu.</div>
    <div v-else-if="!contests.length" class="state">Periode ini belum memiliki kontes.</div>
    <div v-else class="contest-list">
      <article v-for="contest in contests" :key="contest.id" class="contest" :class="{ selected: contest.id === selectedContestId }">
        <header class="contest-header"><div><p class="contest-code">{{ contest.code }}<span v-if="contest.departmentCode"> · {{ contest.departmentCode }}</span></p><h2>{{ contest.title }}</h2><p class="meta">{{ contest.optionType === 'PAIR' ? 'Setiap opsi berisi ketua dan wakil.' : `Calon ${contest.office === 'CHAIR' ? 'ketua' : 'wakil'} berdiri sendiri.` }}</p></div><AppButton variant="secondary" @click="newCandidate(contest)">Tambah calon</AppButton></header>
        <div v-if="!contest.options.length" class="empty-options">Belum ada calon untuk kontes ini.</div>
        <div v-else class="options"><article v-for="option in contest.options" :key="option.id" class="option"><div class="option-number" aria-label="Nomor urut">{{ option.number }}</div><img v-if="option.photoKey" class="option-photo" :src="`/api/v1/public/candidate-photos/${encodeURIComponent(option.photoKey)}`" alt=""><div class="option-copy"><h3>{{ option.members.map(member => member.name).join(' & ') }}</h3><p v-if="option.motto">{{ option.motto }}</p><span class="option-detail">{{ option.vision ? 'Visi terisi' : 'Visi belum diisi' }} · {{ option.photoKey ? 'Foto tersedia' : 'Foto belum diunggah' }}</span></div><AppButton variant="ghost" @click="editCandidate(option, contest)">Edit</AppButton></article></div>
      </article>
    </div>
    <AppDialog :open="dialogOpen" :title="editingId ? 'Edit kandidat' : 'Tambah kandidat'" confirm-label="Simpan" :loading="saving" @cancel="dialogOpen = false" @confirm="saveCandidate">
      <form class="candidate-form" @submit.prevent="saveCandidate"><p class="form-note">{{ selectedContest?.title }} · perubahan hanya boleh dilakukan saat DRAFT.</p><AppInput v-model="form.number" label="Nomor urut" type="number" required inputmode="numeric" /><AppInput v-model="form.chair" :label="isPair ? 'Nama ketua' : `Nama calon ${selectedContest?.office === 'VICE_CHAIR' ? 'wakil' : 'ketua'}`" required autocomplete="name" /><AppInput v-if="isPair" v-model="form.viceChair" label="Nama wakil" required autocomplete="name" /><label class="textarea-field">Moto<textarea v-model="form.motto" maxlength="500" rows="2" /></label><label class="textarea-field">Visi<textarea v-model="form.vision" maxlength="2000" rows="3" /></label><label class="textarea-field">Misi<textarea v-model="form.mission" maxlength="2000" rows="3" /></label><label class="textarea-field">Program (opsional)<textarea v-model="form.programs" maxlength="2000" rows="3" /></label><label class="file-field">Foto kandidat<input type="file" accept="image/jpeg,image/png,image/webp" @change="onPhotoChange"><img v-if="photoPreview" class="photo-preview" :src="photoPreview" alt="Pratinjau foto kandidat"></label><p class="photo-note">Foto diproses ulang ke WebP, dibatasi maksimal 1.400px, dan metadata EXIF dihapus.</p></form>
    </AppDialog>
  </section>
</template>

<style scoped>
.admin-candidates { display: grid; gap: var(--space-6); }.page-header { display: flex; justify-content: space-between; align-items: end; gap: var(--space-6); flex-wrap: wrap; }.eyebrow, .contest-code { color: var(--color-primary); font-size: .75rem; font-weight: 700; letter-spacing: .08em; margin: 0 0 var(--space-2); }.page-header h1 { margin-bottom: var(--space-2); }.intro, .meta, .form-note, .photo-note { color: var(--color-text-muted); margin: 0; }.period-select, .textarea-field, .file-field { display: grid; gap: var(--space-1); font-size: var(--text-sm); font-weight: 600; }.period-select select, textarea { min-height: 2.75rem; border: 1px solid var(--color-text-muted); border-radius: var(--radius); background: var(--color-surface); color: var(--color-text); padding: var(--space-2) var(--space-3); font: inherit; }.period-select select { min-width: 16rem; }.state { padding: var(--space-8) var(--space-4); text-align: center; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); color: var(--color-text-muted); }.contest-list { display: grid; gap: var(--space-4); }.contest { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-4); }.contest.selected { border-color: var(--color-primary); }.contest-header { display: flex; justify-content: space-between; align-items: start; gap: var(--space-4); padding-bottom: var(--space-4); border-bottom: 1px solid var(--color-border); }.contest-header h2 { font-size: var(--text-lg); margin: 0 0 var(--space-1); }.contest-code { margin: 0; }.meta { font-size: var(--text-sm); }.empty-options { padding: var(--space-4) 0 0; color: var(--color-text-muted); }.options { display: grid; gap: var(--space-3); padding-top: var(--space-4); }.option { display: grid; grid-template-columns: auto auto minmax(0, 1fr) auto; align-items: center; gap: var(--space-3); }.option-number { display: grid; place-items: center; width: 2.5rem; height: 2.5rem; border-radius: 50%; background: var(--color-primary-soft); color: var(--color-primary-strong); font-weight: 700; }.option-photo { width: 3rem; height: 3rem; object-fit: cover; border-radius: var(--radius); background: var(--color-primary-soft); }.option-copy { min-width: 0; }.option-copy h3 { margin: 0 0 var(--space-1); font-size: var(--text-base); overflow-wrap: anywhere; }.option-copy p { margin: 0 0 var(--space-1); }.option-detail { font-size: var(--text-sm); color: var(--color-text-muted); }.candidate-form { display: grid; gap: var(--space-4); }.file-field input { padding: var(--space-2) 0; font: inherit; }.photo-preview { display: block; width: 9rem; height: 9rem; margin-top: var(--space-2); object-fit: cover; border-radius: var(--radius); border: 1px solid var(--color-border); }.photo-note { padding: var(--space-3); background: var(--color-warning-bg); color: var(--color-warning); border-radius: var(--radius); font-size: var(--text-sm); }.textarea-field textarea { resize: vertical; min-height: 5rem; }.period-select select:focus-visible, textarea:focus-visible, .file-field input:focus-visible { outline: none; box-shadow: var(--focus-ring); }
@media (max-width: 42rem) { .period-select, .period-select select { width: 100%; min-width: 0; }.contest-header { flex-direction: column; }.contest-header > * { width: 100%; }.contest-header button { width: 100%; }.option { grid-template-columns: auto minmax(0, 1fr); }.option > :last-child { grid-column: 2; justify-self: start; } }
</style>
