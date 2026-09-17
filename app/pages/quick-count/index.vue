<script setup lang="ts">
type Election = { id: string; name: string; status: string; startsAt: string | null; endsAt: string | null }

useHead({ title: 'Quick Count | PEMIRA' })
const elections = ref<Election[]>([])
const loading = ref(true)
const error = ref('')
const available = computed(() => elections.value.filter(election => ['OPEN', 'PAUSED', 'CLOSED', 'PUBLISHED'].includes(election.status)))

async function load() {
  loading.value = true
  error.value = ''
  try { elections.value = (await $fetch<{ elections: Election[] }>('/api/v1/public/elections')).elections }
  catch { error.value = 'Daftar quick count belum dapat dimuat. Periksa koneksi lalu coba lagi.' }
  finally { loading.value = false }
}
onMounted(load)
</script>

<template>
  <section class="quick-index" aria-labelledby="quick-count-list-title">
    <header class="page-heading">
      <p class="eyebrow">Hasil pemilihan</p>
      <h1 id="quick-count-list-title">Quick Count PEMIRA</h1>
      <p>Pilih periode untuk melihat partisipasi dan perolehan suara setiap kandidat.</p>
    </header>
    <AppAlert kind="warning" message="Quick count selama pemungutan suara masih bersifat sementara. Hasil resmi hanya berlaku setelah ditetapkan dan dipublikasikan panitia." />
    <AppAlert v-if="error" kind="error" :message="error" />
    <div v-if="loading" class="state" role="status">Memuat periode pemilihan…</div>
    <div v-else-if="!available.length" class="state">
      <h2>Quick count belum tersedia</h2>
      <p>Hasil sementara akan tampil setelah panitia membuka pemungutan suara.</p>
      <NuxtLink to="/" class="action-link">Kembali ke beranda</NuxtLink>
    </div>
    <div v-else class="period-list">
      <article v-for="election in available" :key="election.id" class="period-card">
        <div>
          <span class="status">{{ election.status === 'PUBLISHED' ? 'Hasil resmi' : electionStatus(election.status) }}</span>
          <h2>{{ election.name }}</h2>
          <dl><div><dt>Mulai</dt><dd>{{ electionDate(election.startsAt) }}</dd></div><div><dt>Selesai</dt><dd>{{ electionDate(election.endsAt) }}</dd></div></dl>
        </div>
        <NuxtLink :to="`/quick-count/${election.id}`" class="open-link">Lihat {{ election.status === 'PUBLISHED' ? 'hasil' : 'quick count' }}</NuxtLink>
      </article>
    </div>
    <AppButton v-if="error" variant="secondary" :loading="loading" @click="load">Coba lagi</AppButton>
  </section>
</template>

<style scoped>
.quick-index{display:grid;gap:var(--space-6);padding-block:clamp(1.5rem,5vw,3rem)}.page-heading{max-width:44rem}.eyebrow{margin:0 0 var(--space-2);color:var(--color-primary);font-size:var(--text-sm);font-weight:800;letter-spacing:.08em;text-transform:uppercase}.page-heading h1{margin:0 0 var(--space-3);font-size:clamp(2rem,5vw,3.25rem);letter-spacing:-.04em}.page-heading>p:last-child{margin:0;color:var(--color-text-muted);font-size:var(--text-lg)}.state{display:grid;justify-items:start;gap:var(--space-3);padding:var(--space-8);border:1px dashed var(--color-border-strong);border-radius:var(--radius-xl);background:var(--color-surface)}.state h2,.state p{margin:0}.state p{color:var(--color-text-muted)}.period-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--space-4)}.period-card{display:flex;justify-content:space-between;align-items:end;gap:var(--space-6);min-width:0;padding:var(--card-padding);border:1px solid var(--color-border);border-radius:var(--radius-xl);background:var(--color-surface);box-shadow:var(--shadow-sm)}.period-card>div{min-width:0}.status{display:inline-block;margin-bottom:var(--space-3);padding:.3rem .55rem;border-radius:var(--radius);background:var(--color-primary-soft);color:var(--color-primary-strong);font-size:.75rem;font-weight:700}.period-card h2{margin:0;font-size:var(--text-xl);overflow-wrap:anywhere}.period-card dl{display:flex;flex-wrap:wrap;gap:var(--space-3) var(--space-6);margin:var(--space-4) 0 0}.period-card dt{color:var(--color-text-muted);font-size:.75rem}.period-card dd{margin:.15rem 0 0;font-size:var(--text-sm);font-weight:600}.open-link{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;min-height:2.75rem;padding:.65rem 1rem;border-radius:var(--radius);background:var(--color-primary);color:white;font-weight:700;text-decoration:none}.open-link:hover{background:var(--color-primary-strong);color:white}.open-link:focus-visible{outline:none;box-shadow:var(--focus-ring)}
@media(max-width:58rem){.period-list{grid-template-columns:1fr}}
@media(max-width:34rem){.period-card{align-items:stretch;flex-direction:column}.open-link{width:100%}.state{padding:var(--space-6)}}
</style>
