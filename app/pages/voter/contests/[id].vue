<script setup lang="ts">
import type { VoterBallot } from '~~/shared/types/voter'
definePageMeta({ key: route => route.fullPath })
const route = useRoute()
const { request } = useApi()
const session = useSession()
const ballot = ref<VoterBallot | null>(null)
const selected = ref('')
const loading = ref(false)
const sending = ref(false)
const confirming = ref(false)
const uncertain = ref(false)
const error = ref('')
const notice = ref('')
const chosen = computed(() => ballot.value?.options.find(option => option.id === selected.value))
const locked = computed(() => !ballot.value?.canVote || loading.value || sending.value || uncertain.value)
const path = `/api/v1/voting/contests/${encodeURIComponent(String(route.params.id))}`

async function load(reconcile = false) {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    ballot.value = await request<VoterBallot>(path)
    uncertain.value = false
    if (ballot.value.contest.hasVoted) {
      selected.value = ''
      notice.value = 'Suara Anda sudah tercatat. Pilihan tidak ditampilkan pada tanda terima.'
    } else if (reconcile) {
      notice.value = 'Server belum mencatat suara Anda. Periksa pilihan sebelum mencoba mengirim kembali.'
    }
  } catch (cause) {
    if (isUnauthorized(cause)) await session.expire()
    else {
      error.value = apiErrorMessage(cause)
      if (reconcile) notice.value = 'Pemeriksaan belum berhasil. Coba periksa status lagi setelah koneksi pulih.'
    }
  } finally { loading.value = false }
}

async function submit() {
  if (locked.value || !chosen.value || !ballot.value) return
  sending.value = true
  error.value = ''
  try {
    const receipt = await request<{ status: string; receiptCode: string }>('/api/v1/voting/ballots', {
      contestId: ballot.value.contest.id, optionId: chosen.value.id,
    })
    if (receipt.status !== 'COMMITTED') throw new Error('Unconfirmed response')
    ballot.value.contest.hasVoted = true
    ballot.value.contest.receiptCode = receipt.receiptCode
    ballot.value.canVote = false
    selected.value = ''
    notice.value = 'Suara Anda sudah tercatat. Simpan kode tanda terima jika diperlukan.'
  } catch (cause) {
    uncertain.value = true
    notice.value = 'Kiriman belum dapat dipastikan. Sedang memeriksa status suara di server.'
    if (isUnauthorized(cause)) await session.expire()
    else await load(true)
  } finally {
    sending.value = false
    confirming.value = false
  }
}

onMounted(() => load())
</script>

<template>
  <section class="ballot-page">
    <NuxtLink to="/voter" class="action-link">Kembali ke hak pilih</NuxtLink>
    <p v-if="loading" role="status">Memeriksa surat suara…</p>
    <AppAlert v-if="error" kind="error" :message="error" />
    <AppAlert v-if="notice" :kind="ballot?.contest.hasVoted ? 'success' : 'info'" :message="notice" />
    <AppAlert v-if="uncertain" kind="warning" message="Status suara belum diketahui. Periksa status terlebih dahulu sebelum mengirim lagi." />
    <template v-if="ballot">
      <header class="ballot-heading">
        <p class="period-name">{{ ballot.election.name }}</p>
        <h1>{{ ballot.contest.title }}</h1>
        <p class="election-status">{{ electionStatus(ballot.election.status) }}</p>
      </header>
      <div v-if="ballot.contest.hasVoted" class="receipt-panel" role="status">
        <span class="receipt-check" aria-hidden="true">✓</span>
        <h2>Suara sudah tercatat</h2>
        <p>Kode tanda terima:</p>
        <p class="receipt">{{ ballot.contest.receiptCode }}</p>
        <p>Anda tidak dapat mengubah atau mengirim suara lagi untuk kontes ini.</p>
        <NuxtLink to="/voter" class="action-link">Kembali ke hak pilih</NuxtLink>
      </div>
      <template v-else>
        <AppAlert v-if="!ballot.canVote" kind="warning" message="Surat suara belum menerima kiriman. Pemilihan mungkin belum dimulai, dijeda, atau telah berakhir." />
        <div class="ballot-schedule"><div><span>Mulai pemilihan</span><strong>{{ electionDate(ballot.election.startsAt) }}</strong></div><div><span>Selesai pemilihan</span><strong>{{ electionDate(ballot.election.endsAt) }}</strong></div></div>
        <AppAlert v-if="!ballot.options.length" message="Belum ada calon yang tersedia. Hubungi panitia untuk pemeriksaan." />
        <form v-else @submit.prevent="confirming = true">
          <fieldset class="candidates" :disabled="locked">
            <legend>Pilih satu calon atau pasangan</legend>
            <article v-for="option in ballot.options" :key="option.id" class="candidate" :class="{ selected: selected === option.id }">
              <label class="candidate-choice">
                <input v-model="selected" type="radio" name="candidate" :value="option.id" required>
                <strong class="candidate-number"><small>Nomor urut</small>{{ String(option.number).padStart(2, '0') }}</strong>
                <span v-if="selected === option.id">Dipilih</span>
              </label>
              <ul class="members">
                <li v-for="member in option.members" :key="member.position"><span>{{ member.position === 'CHAIR' ? 'Ketua' : 'Wakil ketua' }}</span><strong>{{ member.name }}</strong></li>
              </ul>
              <p v-if="option.motto" class="motto">{{ option.motto }}</p>
              <details>
                <summary>Visi, misi, dan program nomor {{ option.number }}</summary>
                <h2>Visi</h2><p class="profile-text">{{ option.vision || 'Belum tersedia.' }}</p>
                <h2>Misi</h2><p class="profile-text">{{ option.mission || 'Belum tersedia.' }}</p>
                <template v-if="option.programs"><h2>Program</h2><p class="profile-text">{{ option.programs }}</p></template>
              </details>
            </article>
          </fieldset>
          <div class="review-bar">
            <div aria-live="polite"><strong>{{ chosen ? `Pilihan Anda: nomor ${chosen.number}` : 'Belum ada calon yang dipilih' }}</strong><p>{{ chosen ? chosen.members.map(member => member.name).join(' & ') : 'Pilih satu calon atau pasangan di atas.' }}</p><small>Pilihan yang sudah tercatat tidak dapat diubah.</small></div>
            <AppButton type="submit" :disabled="locked || !chosen">Tinjau pilihan</AppButton>
          </div>
        </form>
      </template>
    </template>
    <AppButton variant="secondary" :disabled="sending" :loading="loading" @click="load(uncertain)">Periksa status suara</AppButton>
    <AppDialog :open="confirming" title="Kirim suara ini?" confirm-label="Ya, kirim suara" cancel-label="Periksa lagi" :loading="sending" @cancel="confirming = false" @confirm="submit">
      <template v-if="chosen">
        <p>{{ ballot?.contest.title }}, nomor urut {{ chosen.number }}.</p>
        <p><strong>{{ chosen.members.map(member => member.name).join(' & ') }}</strong></p>
        <p>Pastikan pilihan sudah sesuai. Suara yang tercatat tidak dapat diubah.</p>
      </template>
      <p v-if="sending" role="status">Mengirim dan memeriksa suara…</p>
    </AppDialog>
  </section>
</template>

<style scoped>
.ballot-page { display: grid; gap: 1.5rem; max-width: 62rem; margin: auto; }
.ballot-heading h1 { font-size: clamp(1.8rem, 5vw, 3rem); letter-spacing: -0.04em; overflow-wrap: anywhere; }
.election-status { display: inline-block; margin: 0; padding: 0.35rem 0.75rem; border-radius: 0.4rem; background: var(--color-primary-soft); color: var(--color-primary-strong); font-size: 0.875rem; }
.ballot-schedule { display: flex; flex-wrap: wrap; gap: 1rem 3rem; padding: 1.25rem 1.5rem; border-radius: var(--radius-lg); background: #f0f1fa; }
.ballot-schedule div { display: grid; gap: 0.3rem; font-size: 0.875rem; }
.ballot-schedule span { color: var(--color-text-muted); }
.review-bar { display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; margin-top: 1.5rem; padding: 1.5rem; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: white; }
.review-bar > div { min-width: 0; overflow-wrap: anywhere; }
.review-bar p { margin: 0.3rem 0; }
.review-bar small { color: var(--color-text-muted); }
.review-bar button { flex-shrink: 0; }
.ballot-page > .action-link { justify-self: start; }
.period-name { color: var(--color-primary-strong); font-weight: 600; margin-bottom: 0.5rem; }
.candidates { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.25rem; border: 0; padding: 0; margin: 0; min-width: 0; align-items: start; }
.candidates legend { font-weight: 600; margin-bottom: 1rem; }
.candidate { border: 2px solid var(--color-border); border-radius: var(--radius-lg); background: white; padding: 1.5rem; min-width: 0; overflow-wrap: anywhere; }
.candidate.selected { border-color: var(--color-primary); background: #f3faf6; }
.candidate-number { display: grid; gap: 0.2rem; margin-right: auto; font-size: 2rem; line-height: 1.2; }
.candidate-number small { font-size: 0.875rem; font-weight: 500; color: var(--color-text-muted); }
.candidate-choice:has(input:disabled) { cursor: default; }
.candidate-choice { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; min-height: 2.75rem; cursor: pointer; color: var(--color-primary-strong); }
.candidate-choice input { width: 1.25rem; height: 1.25rem; accent-color: var(--color-primary); }
.members { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr)); gap: 1rem; padding: 0; list-style: none; }
.members li { display: grid; gap: 0.25rem; }
.members span { color: var(--color-text-muted); font-size: 0.875rem; }
.members strong { font-size: 1.2rem; }
.motto { color: var(--color-text-muted); }
summary { cursor: pointer; min-height: 2.75rem; padding-block: 0.5rem; color: var(--color-primary-strong); }
details h2 { font-size: 1rem; margin: 1rem 0 0; }
.profile-text { white-space: pre-wrap; }
.receipt-panel { padding: clamp(1.5rem, 5vw, 3rem); text-align: center; background: white; border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
.receipt-check { display: grid; place-items: center; margin: 0 auto 1.25rem; width: 3rem; height: 3rem; border-radius: 50%; background: var(--color-success-bg); color: var(--color-success); font-size: 1.5rem; }
.receipt { padding: 1rem; background: #f0f1fa; border-radius: var(--radius); font-family: monospace; }
@media (max-width: 42rem) { .candidates { grid-template-columns: 1fr; } .review-bar { align-items: stretch; flex-direction: column; } .candidate { padding: 1rem; } }
</style>
