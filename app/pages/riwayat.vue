<script setup lang="ts">
import riwayat from '~/data/riwayat.json'

type Daily = { date: string; votes: number }
type Period = {
  id: string
  name: string
  organizer: string
  year: string
  votingStart: string
  votingEnd: string
  stats: { validVotes: number; uniqueVoters: number; votingDays: number }
  daily: Daily[]
  notes: string
  results: unknown | null
}
type BarGeom = { h: number; x: number; y: number; valueY: number; dayX: number; barWidth: number }
type ChartData = { max: number; geom: BarGeom[] }

useHead({ title: 'Riwayat Pemira | PEMIRA' })
const periods = (riwayat as { periods: Period[] }).periods

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const CHART = { width: 640, left: 24, right: 24, baseline: 170, maxBar: 140, labelY: 192 }

function tanggalID(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS_ID[m - 1]} ${y}`
}
function dayLabel(iso: string) {
  return Number(iso.split('-')[2])
}
function statLabel(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`
}
function barGeom(daily: Daily[], max: number, index: number): BarGeom {
  const plot = CHART.width - CHART.left - CHART.right
  const slot = plot / Math.max(daily.length, 1)
  const barWidth = Math.min(56, slot * 0.58)
  const h = max ? Math.max(3, Math.round((daily[index].votes / max) * CHART.maxBar)) : 3
  const x = CHART.left + slot * index + (slot - barWidth) / 2
  const y = CHART.baseline - h
  return { h, x, y, valueY: Math.max(14, y - 8), dayX: CHART.left + slot * index + slot / 2, barWidth }
}

// Precompute geometri batang per periode agar template ringan.
const charts = new Map<string, ChartData>()
for (const period of periods) {
  const max = Math.max(...period.daily.map(d => d.votes), 1)
  charts.set(period.id, { max, geom: period.daily.map((_, i) => barGeom(period.daily, max, i)) })
}
function chartOf(period: Period): ChartData {
  return charts.get(period.id) ?? { max: 1, geom: [] }
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

      <figure class="chart">
        <figcaption>Partisipasi per hari</figcaption>
        <svg
          :viewBox="`0 0 ${CHART.width} 230`"
          role="img"
          :aria-label="`Grafik partisipasi per hari ${period.name}: ${period.daily.map(d => `${tanggalID(d.date)} ${d.votes} suara`).join(', ')}.`"
          preserveAspectRatio="xMidYMid meet"
        >
          <line
            :x1="CHART.left - 8" :y1="CHART.baseline"
            :x2="CHART.width - CHART.right + 8" :y2="CHART.baseline"
            class="axis" stroke-width="1"
          />
          <g v-for="(g, i) in chartOf(period).geom" :key="period.daily[i].date">
            <rect :x="g.x" :y="g.y" :width="g.barWidth" :height="g.h" rx="6" class="bar" />
            <text :x="g.dayX" :y="g.valueY" text-anchor="middle" class="bar-value">{{ period.daily[i].votes }}</text>
            <text :x="g.dayX" :y="CHART.labelY" text-anchor="middle" class="bar-day">{{ dayLabel(period.daily[i].date) }}</text>
          </g>
        </svg>
        <p class="chart-caption">Tanggal {{ tanggalID(period.daily[0]?.date ?? period.votingStart) }} – {{ tanggalID(period.daily[period.daily.length - 1]?.date ?? period.votingEnd) }}, angka di atas batang = suara masuk hari itu.</p>
      </figure>

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
.key-stats{display:flex;flex-wrap:wrap;gap:var(--space-3) var(--space-6);margin:0;padding:var(--space-4) var(--space-5);border:1px solid var(--color-border);border-radius:var(--radius-lg);background:var(--color-surface-muted)}
.key-stats dt{color:var(--color-text-muted);font-size:.75rem;font-weight:600}
.key-stats dd{margin:.15rem 0 0;font-size:1.35rem;font-weight:800;color:var(--color-primary-strong)}
.chart{margin:0;display:grid;gap:var(--space-2)}
.chart figcaption{font-size:.85rem;font-weight:700;color:var(--color-text)}
.chart svg{width:100%;height:auto;display:block}
.chart .bar{fill:var(--color-primary)}
.chart .axis{stroke:var(--color-border-strong)}
.chart .bar-value{font-size:15px;font-weight:700;fill:var(--color-text)}
.chart .bar-day{font-size:13px;fill:var(--color-text-muted)}
.chart-caption{margin:0;font-size:.78rem;color:var(--color-text-muted)}
.results-strip{margin:0;padding:.6rem 1rem;border:1px dashed var(--color-border-strong);border-radius:var(--radius-pill);color:var(--color-text-muted);font-size:.85rem}
.card-notes{color:var(--color-text-muted);font-size:.78rem}
@media(max-width:40rem){.card-head{align-items:flex-start}.year-badge{min-width:3.6rem;padding:.45rem .7rem;font-size:.95rem}.key-stats dd{font-size:1.15rem}}
</style>
