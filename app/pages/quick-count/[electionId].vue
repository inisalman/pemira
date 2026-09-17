<script setup lang="ts">
type OptionResult = { optionId: string; number: number; label: string; photoKey: string | null; votes: number; percent: number }
type ContestResult = { contestId: string; title: string; totalBallots: number; eligible: number; participation: number; options: OptionResult[] }
type QuickCountPayload = { source: 'QUICK_COUNT'; results: ContestResult[]; updatedAt: string } | { source: 'OFFICIAL'; snapshot: { results?: ContestResult[] } | null }

const route = useRoute()
const results = ref<ContestResult[]>([])
const source = ref<'QUICK_COUNT' | 'OFFICIAL' | null>(null)
const updatedAt = ref<Date | null>(null)
const loading = ref(true)
const errorMessage = ref('')
const isStale = ref(false)
const failedPhotos = reactive(new Set<string>())
let refreshTimer: ReturnType<typeof setTimeout> | undefined
let retryDelay = 5_000

const formattedUpdatedAt = computed(() => updatedAt.value
  ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'medium' }).format(updatedAt.value)
  : 'Belum ada pembaruan')

function electionId(): string {
  const value = route.params.electionId
  return typeof value === 'string' ? value : Array.isArray(value) ? value[0] ?? '' : ''
}
function photoUrl(key: string) {
  return `/api/v1/public/candidate-photos/${encodeURIComponent(key)}`
}
function scheduleRefresh(delay = 5_000) {
  if (refreshTimer) clearTimeout(refreshTimer)
  if (!import.meta.client || document.hidden) return
  refreshTimer = setTimeout(() => void loadResults(false), delay)
}
function errorText(error: unknown): string {
  const typed = error as { data?: { error?: { message?: string } }; message?: string }
  return typed.data?.error?.message ?? typed.message ?? 'Hasil tidak dapat dimuat. Periksa koneksi lalu coba lagi.'
}
async function loadResults(showLoading = true) {
  if (showLoading) loading.value = true
  errorMessage.value = ''
  try {
    const payload = await $fetch<QuickCountPayload>(`/api/v1/public/quick-count/${encodeURIComponent(electionId())}`)
    source.value = payload.source
    results.value = payload.source === 'QUICK_COUNT' ? payload.results : payload.snapshot?.results ?? []
    updatedAt.value = payload.source === 'QUICK_COUNT' ? new Date(payload.updatedAt) : new Date()
    isStale.value = false
    retryDelay = 5_000
    scheduleRefresh()
  } catch (error) {
    errorMessage.value = errorText(error)
    isStale.value = results.value.length > 0
    scheduleRefresh(retryDelay)
    retryDelay = Math.min(retryDelay * 2, 60_000)
  } finally { loading.value = false }
}
function onVisibilityChange() {
  if (document.hidden) { if (refreshTimer) clearTimeout(refreshTimer); return }
  void loadResults(false)
}
watch(() => route.params.electionId, () => void loadResults(), { immediate: true })
onMounted(() => document.addEventListener('visibilitychange', onVisibilityChange))
onBeforeUnmount(() => { if (refreshTimer) clearTimeout(refreshTimer); document.removeEventListener('visibilitychange', onVisibilityChange) })
</script>

<template>
  <section :class="$style.page" aria-labelledby="quick-count-title">
    <header :class="$style.header">
      <div>
        <p :class="$style.eyebrow">Hasil pemilihan</p>
        <h1 id="quick-count-title">Quick Count</h1>
        <p :class="$style.description">Perolehan sementara diperbarui saat halaman ini terbuka.</p>
      </div>
      <div :class="$style.meta" aria-live="polite">
        <span :class="[$style.status, source === 'OFFICIAL' ? $style.official : $style.interim]">{{ source === 'OFFICIAL' ? 'Hasil resmi' : 'Hasil sementara' }}</span>
        <span>{{ formattedUpdatedAt }}</span>
      </div>
    </header>
    <AppAlert v-if="source === 'QUICK_COUNT'" kind="warning" message="Hasil ini belum ditetapkan panitia dan dapat berubah sampai periode ditutup." />
    <AppAlert v-if="isStale" kind="warning" message="Menampilkan pembaruan terakhir. Sistem akan mencoba memuat ulang secara otomatis." />
    <AppAlert v-if="errorMessage" kind="error" :message="errorMessage" />
    <div v-if="loading && !results.length" :class="$style.loading" role="status" aria-live="polite">Memuat hasil pemilihan…</div>
    <div v-else-if="!results.length && !errorMessage" :class="$style.empty" role="status"><h2>Belum ada hasil yang dapat ditampilkan</h2><p>Quick Count tersedia setelah periode pemilihan dibuka.</p></div>
    <div v-else :class="$style.list">
      <article v-for="contest in results" :key="contest.contestId" :class="$style.contest">
        <header :class="$style.contestHeader"><div><h2>{{ contest.title }}</h2><p>{{ contest.totalBallots }} suara masuk dari {{ contest.eligible }} hak pilih</p></div><strong>{{ contest.participation.toLocaleString('id-ID', { maximumFractionDigits: 2 }) }}% partisipasi</strong></header>
        <ol :class="$style.options" :aria-label="`Perolehan ${contest.title}`">
          <li v-for="option in contest.options" :key="option.optionId" :class="$style.option">
            <div :class="$style.optionPhotoWrap">
              <img v-if="option.photoKey && !failedPhotos.has(option.photoKey)" :class="$style.optionPhoto" :src="photoUrl(option.photoKey)" :alt="`Foto ${option.label}`" loading="lazy" decoding="async" @error="failedPhotos.add(option.photoKey)">
              <div v-else :class="$style.photoFallback" role="img" :aria-label="`Foto ${option.label} belum tersedia`"><small>Nomor</small><strong>{{ option.number }}</strong></div>
            </div>
            <div :class="$style.optionResult">
              <div :class="$style.optionTopline"><span :class="$style.number">{{ option.number }}</span><span :class="$style.label">{{ option.label }}</span><strong>{{ option.votes }} suara</strong></div>
              <div :class="$style.bar" role="progressbar" :aria-label="`Perolehan ${option.label}`" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="option.percent"><span :class="$style.fill" :style="{ width: `${Math.min(option.percent, 100)}%` }" /></div>
              <span :class="$style.percent">{{ option.percent.toLocaleString('id-ID', { maximumFractionDigits: 2 }) }}% dari suara kontes</span>
            </div>
          </li>
        </ol>
      </article>
    </div>
    <AppButton variant="secondary" :loading="loading" @click="loadResults()">Perbarui hasil</AppButton>
  </section>
</template>

<style module>
.page { display: grid; gap: var(--space-6); padding-block: var(--space-4); }
.header { display: flex; gap: var(--space-4); justify-content: space-between; align-items: end; border-bottom: 2px solid var(--color-primary); padding-bottom: var(--space-4); }
.eyebrow { color: var(--color-primary); font-size: var(--text-sm); font-weight: 700; margin: 0 0 var(--space-1); }.header h1 { font-size: clamp(1.8rem, 4vw, 2.5rem); margin-bottom: var(--space-2); }.description { color: var(--color-text-muted); margin: 0; }
.meta { display: grid; gap: var(--space-2); color: var(--color-text-muted); font-size: var(--text-sm); text-align: right; }.status { justify-self: end; border-radius: var(--radius); font-weight: 700; padding: var(--space-1) var(--space-2); }.interim { color: #674400; background: var(--color-warning-bg); }.official { color: #155c2e; background: var(--color-success-bg); }
.loading, .empty { background: var(--color-surface); border: 1px dashed var(--color-border-strong); border-radius: var(--radius-lg); padding: var(--space-6); }.empty h2 { font-size: var(--text-lg); }.empty p { color: var(--color-text-muted); margin-bottom: 0; }
.list { display: grid; gap: var(--space-4); }.contest { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: var(--card-padding); box-shadow: var(--shadow-sm); }.contestHeader { display: flex; justify-content: space-between; gap: var(--space-4); padding-bottom: var(--space-4); border-bottom: 1px solid var(--color-border); }.contestHeader h2 { font-size: var(--text-lg); margin-bottom: var(--space-1); }.contestHeader p, .percent { color: var(--color-text-muted); font-size: var(--text-sm); }.contestHeader p { margin: 0; }.contestHeader strong { color: var(--color-primary-strong); white-space: nowrap; }
.options { display: grid; gap: var(--space-4); list-style: none; padding: 0; margin: var(--space-4) 0 0; }.option { display: grid; grid-template-columns:7rem minmax(0,1fr); gap:var(--space-4); align-items:center; padding:var(--space-3); border:1px solid var(--color-border); border-radius:var(--radius-lg); background:var(--color-surface-muted); }.optionPhotoWrap { display:grid; place-items:center; align-self:start; width:7rem; min-height:5.25rem; border:1px solid var(--color-border); border-radius:var(--radius); background:var(--color-surface); }.optionPhoto { display:block; width:100%; height:auto; border-radius:calc(var(--radius) - 1px); }.photoFallback { display:grid; place-content:center; justify-items:center; min-height:5.25rem; color:var(--color-primary-strong); }.photoFallback small { font-size:.65rem; }.photoFallback strong { font-size:1.75rem; line-height:1; }.optionResult { display:grid; gap:var(--space-2); min-width:0; }.optionTopline { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: var(--space-2); align-items: center; }.number { align-items: center; background: var(--color-primary-soft); border-radius: var(--radius); color: var(--color-primary-strong); display: inline-flex; font-weight: 700; height: 2rem; justify-content: center; min-width: 2rem; }.label { font-weight: 600; min-width: 0; overflow-wrap: anywhere; }.bar { background: #d9e4df; border-radius: 0.25rem; height: 0.75rem; overflow: hidden; }.fill { background: var(--color-primary); display: block; height: 100%; }.percent { display:block; }
@media (max-width: 42rem) { .page { gap: var(--space-4); }.header, .contestHeader { align-items: start; flex-direction: column; }.meta { text-align: left; }.status { justify-self: start; }.contest { padding: var(--space-3); }.contestHeader strong { white-space: normal; }.option { grid-template-columns:5.5rem minmax(0,1fr);gap:var(--space-3);padding:var(--space-2)}.optionPhotoWrap { width:5.5rem;min-height:4rem }.photoFallback { min-height:4rem }.optionTopline { grid-template-columns:auto minmax(0,1fr) }.optionTopline>strong { grid-column:2 }.number { grid-row:1/3 } }
</style>
