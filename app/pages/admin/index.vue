<script setup lang="ts">
const areas = [
  { to: '/admin/elections', code: 'PR', title: 'Periode pemilihan', text: 'Buat periode, atur jadwal, dan siapkan kontes.' },
  { to: '/admin/voters', code: 'DP', title: 'Data pemilih', text: 'Impor dan periksa DPT mahasiswa serta dosen.' },
  { to: '/admin/candidates', code: 'KN', title: 'Kandidat', text: 'Masukkan nomor urut, profil, dan foto calon.' },
  { to: '/admin/rights', code: 'HP', title: 'Hak pilih', text: 'Bangun hak dasar dan cek kesiapan periode.' },
  { to: '/admin/operations', code: 'OP', title: 'Operasional', text: 'Buka, jeda, atau tutup periode melalui alur persetujuan.' },
  { to: '/admin/reports', code: 'LP', title: 'Laporan', text: 'Baca rekap partisipasi, hasil, dan catatan audit.' },
]
</script>

<template>
  <section class="admin-page dashboard">
    <header class="page-header"><div><p class="eyebrow">Ruang panitia</p><h1>Kelola PEMIRA dengan urutan yang jelas.</h1><p class="intro">Mulai dari periode dan DPT, lengkapi kandidat, kemudian periksa hak pilih sebelum voting dibuka.</p></div></header>
    <section class="workflow" aria-labelledby="workflow-title"><div><p class="eyebrow">Alur kerja</p><h2 id="workflow-title">Persiapan sampai publikasi</h2></div><ol><li><strong>01</strong><span>Buat periode dan kontes</span></li><li><strong>02</strong><span>Siapkan DPT, kandidat, dan hak pilih</span></li><li><strong>03</strong><span>Operasikan voting dan baca laporan</span></li></ol></section>
    <section class="area-grid" aria-label="Menu kerja panitia"><NuxtLink v-for="area in areas" :key="area.to" :to="area.to" class="area-card"><span>{{ area.code }}</span><div><h2>{{ area.title }}</h2><p>{{ area.text }}</p></div><b aria-hidden="true">›</b></NuxtLink></section>
  </section>
</template>

<style scoped>
.dashboard { display: grid; gap: 1.5rem; }.workflow { display: grid; grid-template-columns: .75fr 1.25fr; gap: 2rem; padding: 1.75rem; border-radius: var(--radius-lg); background: var(--color-primary); color: white; }.workflow .eyebrow { color: #bff0dc; }.workflow h2 { margin: 0; font-size: 1.35rem; }.workflow ol { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 0; padding: 0; list-style: none; }.workflow li { display: grid; gap: .35rem; font-size: .8rem; }.workflow li strong { color: #bff0dc; font-size: .7rem; }.area-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }.area-card { display: grid; grid-template-columns: auto 1fr auto; gap: 1rem; align-items: start; padding: 1.35rem; border: 1px solid var(--color-border); border-radius: var(--radius-lg); color: var(--color-text); background: white; text-decoration: none; }.area-card:hover { border-color: var(--color-primary); box-shadow: var(--shadow-sm); color: var(--color-text); }.area-card > span { display: grid; place-items: center; width: 2.2rem; height: 2.2rem; border-radius: .5rem; color: var(--color-primary); background: var(--color-primary-soft); font-size: .65rem; font-weight: 800; }.area-card h2 { margin: .1rem 0 .45rem; font-size: 1rem; }.area-card p { margin: 0; color: var(--color-text-muted); font-size: .8rem; }.area-card b { color: var(--color-primary); font-size: 1.2rem; } @media(max-width:58rem){.workflow{grid-template-columns:1fr}.area-grid{grid-template-columns:repeat(2,minmax(0,1fr))}} @media(max-width:34rem){.workflow ol,.area-grid{grid-template-columns:1fr}}
</style>
