<script setup lang="ts">
import riwayat from '~/data/riwayat.json'

type Period = {
  id: string
  name: string
  organizer: string
  year: string
  votingStart: string
  votingEnd: string
  stats: { validVotes: number; uniqueVoters: number; votingDays: number }
  notes: string
  results: unknown | null
}

useHead({ title: 'Riwayat Pemira | PEMIRA' })
const periods = (riwayat as { periods: Period[] }).periods

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function tanggalID(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS_ID[m - 1]} ${y}`
}
function statLabel(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`
}
</script>

<template>
  <section class="riwayat" aria-labelledby="riwayat-title">
    <PageHeader
      kicker="Arsip pemilihan"
      title="Riwayat Pemira"
      lead="Periode-periode pemira sebelumnya, sepanjang data yang tercatat panitia."
      icon="calendar"
    />

    <div v-if="!periods.length" class="state">
      <p>Belum ada periode yang diarsipkan.</p>
      <NuxtLink to="/" class="action-link">Kembali ke beranda</NuxtLink>
    </div>

    <article v-for="period in periods" :key="period.id" class="period-card">
      <header class="card-head">
        <span class="year-badge">{{ period.year }}</span>
        <div class="head-text">
          <h2>{{ period.name }}</h2>
          <p class="meta">{{ period.organizer }} · {{ tanggalID(period.votingStart) }} – {{ tanggalID(period.votingEnd) }}</p>
        </div>
      </header>

      <dl class="key-stats">
        <div><dt>Total suara</dt><dd>{{ period.stats.validVotes }}</dd></div>
        <div><dt>Pemilih unik</dt><dd>{{ period.stats.uniqueVoters }}</dd></div>
        <div><dt>Masa voting</dt><dd>{{ statLabel(period.stats.votingDays, 'hari', 'hari') }}</dd></div>
      </dl>

      <p v-if="!period.results" class="results-strip">Data hasil belum diarsipkan.</p>

      <footer class="card-notes">{{ period.notes }}</footer>
    </article>
  </section>
</template>

<style scoped>
.riwayat{display:grid;gap:var(--space-6);padding-block:clamp(1.5rem,5vw,3rem)}
.state{display:grid;justify-items:center;gap:var(--space-2);padding:clamp(2rem,5vw,3.5rem);border:1px dashed var(--color-border-strong);border-radius:var(--radius-xl);background:var(--color-surface)}
.state p{margin:0;color:var(--color-text-muted)}
.action-link{margin-top:var(--space-2);color:var(--color-primary);font-weight:700;text-decoration:none}
.period-card{display:grid;gap:var(--space-5);padding:var(--card-padding);border:1px solid var(--color-border);border-radius:var(--radius-xl);background:var(--color-surface);box-shadow:var(--shadow-sm)}
.card-head{display:flex;align-items:center;gap:var(--space-4)}
.year-badge{flex-shrink:0;display:grid;place-items:center;min-width:4.5rem;padding:.55rem .9rem;border-radius:var(--radius-pill);background:var(--color-primary);color:var(--color-primary-contrast);font-weight:800;font-size:1.05rem;letter-spacing:.02em}
.head-text{min-width:0}
.head-text h2{margin:0;font-size:var(--text-xl);overflow-wrap:anywhere}
.head-text .meta{margin:.25rem 0 0;color:var(--color-text-muted);font-size:.9rem}
.key-stats{display:flex;flex-wrap:wrap;gap:var(--space-3) var(--space-6);margin:0;padding:var(--space-5) var(--space-5) var(--space-4);border:1px solid var(--color-border);border-radius:var(--radius-lg);background:var(--color-surface-muted)}
.key-stats dt{color:var(--color-text-muted);font-size:.75rem;font-weight:600}
.key-stats dd{margin:.15rem 0 0;font-size:1.35rem;font-weight:800;color:var(--color-primary-strong)}
.results-strip{margin:0;padding:.6rem 1rem;border:1px dashed var(--color-border-strong);border-radius:var(--radius-pill);color:var(--color-text-muted);font-size:.85rem}
.card-notes{color:var(--color-text-muted);font-size:.78rem}
@media(max-width:40rem){.card-head{align-items:flex-start}.year-badge{min-width:3.6rem;padding:.45rem .7rem;font-size:.95rem}.key-stats dd{font-size:1.15rem}}
</style>
