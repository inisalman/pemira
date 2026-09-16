<script setup lang="ts">
definePageMeta({ layout: false })
useHead({
  title: 'PEMIRA | Poltekkes Kemenkes Jakarta I',
  link: [
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap' },
  ],
})
type Election = { id: string; name: string; status: string; startsAt: string | null; endsAt: string | null }
const elections = ref<Election[]>([])
const loading = ref(true)
const error = ref('')
const menuOpen = ref(false)
const current = computed(() => elections.value.find(e => e.status === 'OPEN') ?? elections.value[0])
const heroImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuCxNVczZGrj1RNZsJ5gCRFw5PtSa5S0ycQTK6cQ4nfgn2QgrhWR103vS6yQazOIw1Y2UGBYXMK79mDdah2kVh7xg2ppOOE9wsOxmaBggfoopkcVJNoV5_PwiWTKjvKv1f7JhfpaMUJAawLfyJRyVdmqxChmPvzo_Sd9IgRmchWmiMLy48Xh5PKxyb4_IWvcKSN_ayuITKN5Oz2qISoj9-raBcMPgs8TEwXVUWGlWP2znRMltSmbE-3a"
const tutorialImages = ["https://lh3.googleusercontent.com/aida-public/AB6AXuBzvsX85zuMvR4Z79pPN-nnlU7bG3DBw-aWSUAVyCIWKS7pXOdcYhSwn8O5txJ0etjJRBepYGHFf9HgM_cY3HwJlTvXZ0PQOV0QnItLFvSAZTcIYlq0GboaS9QHwkrUxaBu0CGLa8KD5PFV2zEZCN7XUtKXYqln4j6vJA6fGe40EFhyeJ0kL_3TvmbdjeJ1EJW7hjAPNhNwt-EIr8VU4YFJDa09fEvRYpr7Ys9P6phYLdXyT-moq8Yw","https://lh3.googleusercontent.com/aida-public/AB6AXuA9zK1yJTIMEJJmnK7FPcAwsXjiuFIDNoB_VQ5DPn4P2y4zGg4u-T4bfUNvE__9Uvc_Tcz9_ZRimOpIcVJEW3wMMyTSZkAmtJrYtnBzd-oM35YeYQl9ISATUvRY5yMQ7Cm5_GpsPgH3VYBIRRPtVAMq4oO4bK3CblxSnYiPf6JFYynOL4-TqvRRFiyLoLnbUTKcjulLLbwgGOSMrHKpuH3JMZm8VtveC8Ul0WgTp-5Mr5eCzsZrF8QQ"]
const links = [
  { label: 'Tentang Pemira', href: '#tentang-pemira' },
  { label: 'Jadwal Voting', href: '#jadwal-voting' },
  { label: 'Tata Tertib', href: '#tata-tertib' },
  { label: 'Panduan Voting', href: '#panduan-voting' },
]
const organizations = [
  { short: 'MPM', name: 'Majelis Permusyawaratan Mahasiswa', category: 'Lembaga legislatif', badge: 'Tingkat institusi', tone: 'green', description: 'Lembaga perwakilan mahasiswa yang menampung aspirasi, mengawasi jalannya organisasi kemahasiswaan, dan menyelenggarakan PEMIRA.' },
  { short: 'BEM', name: 'Badan Eksekutif Mahasiswa', category: 'Lembaga eksekutif pusat', badge: 'Presma & Wapresma', tone: 'amber', description: 'Badan eksekutif mahasiswa tingkat institusi yang menjalankan program kerja, menyalurkan aspirasi, dan menggerakkan kegiatan mahasiswa.' },
  { short: 'HIMA', name: 'Himpunan Mahasiswa Jurusan', category: 'Tingkat jurusan', badge: '4 jurusan', tone: 'teal', description: 'Wadah mahasiswa jurusan Keperawatan, Kebidanan, Kesehatan Gigi, dan Ortotik Prostetik untuk berkarya dan mengembangkan potensi bersama.' },
]
const categories = [
  { title: 'Jurusan Keperawatan', group: 'Himpunan mahasiswa', mark: 'KP', tone: 'green' },
  { title: 'Jurusan Kebidanan', group: 'Himpunan mahasiswa', mark: 'KB', tone: 'amber' },
  { title: 'Jurusan Kesehatan Gigi', group: 'Himpunan mahasiswa', mark: 'KG', tone: 'teal' },
  { title: 'Jurusan Ortotik Prostetik', group: 'Himpunan mahasiswa', mark: 'OP', tone: 'green' },
  { title: 'Badan Eksekutif Mahasiswa (BEM)', group: 'Eksekutif kampus', mark: 'BEM', tone: 'amber' },
  { title: 'Majelis Permusyawaratan Mahasiswa (MPM)', group: 'Legislatif mahasiswa', mark: 'MPM', tone: 'teal' },
]
const rules = [
  { title: 'Terdaftar sebagai pemilih', description: 'Gunakan NIM atau NIP lokal yang telah terdaftar pada daftar pemilih panitia.' },
  { title: 'Asas Luber Jurdil', description: 'Gunakan hak pilih secara langsung, umum, bebas, rahasia, jujur, dan adil. Hak suara tidak boleh diwakilkan.' },
  { title: 'Situs resmi panitia', description: 'Berikan suara melalui portal PEMIRA. Kontes yang dapat Anda ikuti tampil pada halaman hak pilih.' },
  { title: 'Jaga akses akun', description: 'Gunakan password yang dibagikan panitia. Jangan berikan password atau akses akun kepada orang lain.' },
  { title: 'Penetapan pilihan', description: 'Periksa calon, tinjau pilihan, lalu konfirmasi. Suara yang sudah tercatat tidak dapat diubah.' },
  { title: 'Larangan dalam pemilihan', description: 'Hindari intimidasi, politik uang, penyalahgunaan akun, dan tindakan yang mengganggu kebebasan pemilih.', danger: true },
]
async function load() {
  loading.value = true
  error.value = ''
  try { elections.value = (await $fetch<{ elections: Election[] }>('/api/v1/public/elections')).elections }
  catch { error.value = 'Jadwal belum dapat dimuat. Silakan coba lagi.' }
  finally { loading.value = false }
}
onMounted(load)
</script>

<template>
  <div class="portal">
    <a class="skip-link" href="#portal-content">Lewati navigasi</a>
    <header class="portal-header">
      <div class="container header-inner">
        <NuxtLink to="/" class="brand"><span class="brand-symbol" aria-hidden="true">P</span><span>PEMIRA<small>Poltekkes Kemenkes Jakarta I</small></span></NuxtLink>
        <nav class="desktop-nav" aria-label="Navigasi portal"><a v-for="link in links" :key="link.href" :href="link.href">{{ link.label }}</a></nav>
        <NuxtLink to="/login" class="button primary header-cta">Mulai Voting / Cek Hak Suara</NuxtLink>
        <button class="menu-toggle" :aria-expanded="menuOpen" aria-controls="portal-menu" @click="menuOpen = !menuOpen">Menu</button>
      </div>
      <nav v-if="menuOpen" id="portal-menu" class="mobile-nav container" aria-label="Navigasi mobile"><a v-for="link in links" :key="link.href" :href="link.href" @click="menuOpen = false">{{ link.label }}</a><NuxtLink to="/login">Mulai voting / cek hak suara</NuxtLink></nav>
    </header>
    <main id="portal-content" tabindex="-1">
      <div class="announcement"><div class="container"><span>Pemberitahuan</span><p v-if="current">{{ current.name }} · <strong>{{ electionStatus(current.status) }}</strong>. Periksa jadwal dan hak pilih Anda sebelum memilih.</p><p v-else>Informasi jadwal PEMIRA diumumkan melalui portal ini. Persiapkan akun pemilih Anda.</p></div></div>
      <section class="hero">
        <div class="container">
          <div class="hero-grid">
            <div class="hero-copy">
              <p class="eyebrow-tag">Demokrasi Kampus · Pesta Demokrasi Mahasiswa</p>
              <h1>Pemilihan Raya Mahasiswa <span>Poltekkes Kemenkes</span> Jakarta I</h1>
              <p class="hero-description">Situs Pemilihan Raya Mahasiswa Poltekkes Jakarta I. Wujudkan kepemimpinan berintegritas, berdedikasi tinggi, dan representatif bagi seluruh civitas akademika.</p>
              <div class="hero-actions"><a class="button primary" href="#jadwal-voting">Lihat Jadwal Pemungutan Suara <span aria-hidden="true">↓</span></a><a class="button soft" href="https://instagram.com/MPMPOLTEKKESJAKARTA1" target="_blank" rel="noopener noreferrer">Instagram MPM</a></div>
              <div class="hero-notes"><span>Satu suara per kontes</span><span>Pilihan melalui akun terdaftar</span></div>
            </div>
            <figure class="hero-photo">
              <img :src="heroImage" alt="Ilustrasi mahasiswa berpartisipasi dalam PEMIRA" fetchpriority="high" width="640" height="520">
              <figcaption><span class="calendar-mark" aria-hidden="true">▦</span><div><strong>{{ current?.startsAt ? electionDate(current.startsAt) : 'Bersiap untuk PEMIRA' }}</strong><small>{{ current ? current.name : 'Periksa hak pilih melalui akun Anda' }}</small></div><span class="badge green">{{ current ? electionStatus(current.status) : 'Info pemilihan' }}</span></figcaption>
            </figure>
          </div>
          <div class="metrics">
            <article><p>Jurusan / program</p><strong>4</strong><span>Jurusan di Poltekkes Jakarta I</span></article>
            <article><p>Organisasi mahasiswa</p><strong>MPM · BEM · HIMA</strong><span>Wadah perwakilan mahasiswa</span></article>
            <article><p>Jadwal pelaksanaan</p><strong class="metric-date">{{ loading ? 'Memuat…' : current?.startsAt ? electionDate(current.startsAt) : 'Menunggu jadwal' }}</strong><span>Sesuai periode dari panitia</span></article>
            <article><p>Asas pemilihan</p><strong>Luber Jurdil</strong><span>Gunakan suara dengan tanggung jawab</span></article>
          </div>
        </div>
      </section>
      <section id="tentang-pemira" class="section about">
        <div class="container about-grid">
          <div>
            <p class="eyebrow">Mengenal lebih dekat</p><h2>Apa sih PEMIRA itu?</h2>
            <p class="lead"><strong>Pemilihan Raya (PEMIRA)</strong> adalah pesta demokrasi mahasiswa Poltekkes Kemenkes Jakarta I untuk menentukan kepemimpinan organisasi kemahasiswaan.</p>
            <p>Melalui PEMIRA, mahasiswa memilih perwakilan di <strong>Majelis Permusyawaratan Mahasiswa (MPM)</strong>, pemimpin <strong>Badan Eksekutif Mahasiswa (BEM)</strong>, serta pimpinan <strong>Himpunan Mahasiswa (HIMA)</strong> di setiap jurusan.</p>
            <div class="mission"><p class="eyebrow">Amanah kepemimpinan</p><p>Kenali calon dan programnya. Pilih pemimpin yang siap membawa aspirasi mahasiswa dan bertanggung jawab atas amanahnya.</p></div>
            <div class="values"><article><h3>Demokratis</h3><p>Gunakan hak pilih sendiri, sesuai hati nurani.</p></article><article><h3>Transparan</h3><p>Ikuti hasil yang dipublikasikan panitia.</p></article></div>
          </div>
          <div class="organization-list"><article v-for="org in organizations" :key="org.short" class="organization">
            <div class="org-heading"><span class="org-icon" :class="org.tone">{{ org.short }}</span><div><p class="eyebrow">{{ org.category }}</p><h3>{{ org.short }} ({{ org.name }})</h3></div><span class="badge" :class="org.tone">{{ org.badge }}</span></div><p>{{ org.description }}</p>
          </article></div>
        </div>
      </section>
      <section id="jadwal-voting" class="section tinted">
        <div class="container">
          <div class="section-heading"><div><p class="eyebrow">Jadwal resmi & bilik suara</p><h2>Jadwal Pemungutan Suara</h2><p>Periksa periode yang tersedia, lalu masuk untuk melihat kontes sesuai hak pilih Anda.</p></div><NuxtLink to="/results" class="button white">Lihat hasil pemilihan</NuxtLink></div>
          <div class="period-info" aria-live="polite">
            <p v-if="loading">Memuat jadwal pemilihan…</p>
            <div v-else-if="error" class="load-error"><p>{{ error }}</p><button class="button soft" @click="load">Coba lagi</button></div>
            <p v-else-if="!elections.length">Jadwal belum diumumkan. Informasi periode akan tampil di sini setelah tersedia.</p>
            <article v-for="election in elections" v-else :key="election.id"><div><strong>{{ election.name }}</strong><p>{{ electionDate(election.startsAt) }} sampai {{ electionDate(election.endsAt) }}</p></div><span class="badge green">{{ electionStatus(election.status) }}</span></article>
          </div>
          <div class="category-grid"><article v-for="category in categories" :key="category.mark" class="category-card">
            <p class="card-kicker">Pilihan sesuai daftar pemilih</p>
            <div class="category-title"><span class="org-icon" :class="category.tone">{{ category.mark }}</span><div><p class="eyebrow">{{ category.group }}</p><h3>{{ category.title }}</h3></div></div>
            <p>Pemilihan perwakilan {{ category.title }}. Jadwal dan surat suara tersedia sesuai periode serta hak pilih akun Anda.</p>
            <NuxtLink to="/login" class="button" :class="category.tone === 'amber' ? 'ochre' : 'primary'">Masuk untuk cek hak pilih <span aria-hidden="true">›</span></NuxtLink>
          </article></div>
        </div>
      </section>
      <section id="tata-tertib" class="section">
        <div class="container"><div class="section-heading"><div><p class="eyebrow">Panduan pemilih</p><h2>Tata Tertib Pemilihan Raya</h2><p>Jaga integritas, kerahasiaan, dan kelancaran pemilihan dengan mengikuti ketentuan berikut.</p></div></div>
          <div class="rules-grid"><article v-for="(rule, index) in rules" :key="rule.title" class="rule-card" :class="{ danger: rule.danger }"><span class="rule-number">{{ String(index + 1).padStart(2, '0') }}</span><h3>{{ rule.title }}</h3><p>{{ rule.description }}</p></article></div>
        </div>
      </section>
      <section id="panduan-voting" class="section tinted">
        <div class="container"><div class="guide-heading"><p class="eyebrow-tag">Panduan Praktis Pemilih</p><h2>Panduan Cara Voting</h2><p>Pahami alur pemilihan agar hak suara Anda tercatat dengan benar.</p></div>
          <div class="steps"><article><strong>1</strong><div><h3>Siapkan akun</h3><p>Gunakan NIM atau NIP lokal dan password yang dibagikan panitia.</p></div></article><article><strong>2</strong><div><h3>Buka surat suara</h3><p>Pilih kontes yang tersedia, lalu baca profil dan program calon.</p></div></article><article><strong>3</strong><div><h3>Pilih & konfirmasi</h3><p>Tinjau pilihan, kirim suara, lalu simpan kode tanda terima.</p></div></article></div>
          <div class="tutorials"><article v-for="(name, index) in ['Himpunan Mahasiswa (HIMA)', 'Badan Eksekutif Mahasiswa (BEM)']" :key="name" class="tutorial">
            <img :src="tutorialImages[index]" :alt="'Ilustrasi panduan pemilihan ' + name" width="640" height="360" loading="lazy">
            <p class="eyebrow">Panduan pemilih {{ String(index + 1).padStart(2, '0') }}</p><h3>Panduan Voting {{ name }}</h3><p>Ikuti langkah pemilihan melalui dashboard hak pilih Anda.</p>
            <details><summary>Baca panduan voting</summary><ol><li>Masuk ke akun pemilih.</li><li>Buka kontes {{ index === 0 ? 'HIMA sesuai jurusan' : 'BEM' }} yang tersedia.</li><li>Baca profil calon, lalu pilih satu calon atau pasangan.</li><li>Tekan “Tinjau pilihan”, periksa kembali, lalu kirim suara.</li><li>Pastikan status “Suara sudah tercatat” muncul.</li></ol></details>
          </article></div>
        </div>
      </section>
      <section class="section help-section"><div class="container"><div class="help-banner"><div><p class="eyebrow-tag">Bantuan pemilih</p><h2>Mengalami Kendala Saat Memilih?</h2><p>Hubungi panitia melalui kanal MPM untuk bantuan akses akun atau pemeriksaan daftar pemilih. Jangan bagikan password Anda.</p></div><div class="help-actions"><a class="button gold" href="https://instagram.com/MPMPOLTEKKESJAKARTA1" target="_blank" rel="noopener noreferrer">DM Instagram MPM</a><a class="button help-link" href="#panduan-voting">Baca panduan pemilih</a></div></div></div></section>
    </main>
    <footer class="portal-footer"><div class="container"><div class="footer-grid"><div><h3>PEMIRA</h3><p>Pemilihan Raya Mahasiswa<br>Poltekkes Kemenkes Jakarta I</p></div><div><h3>Informasi pemilihan</h3><a href="#jadwal-voting">Jadwal voting</a><a href="#tata-tertib">Tata tertib</a><NuxtLink to="/results">Hasil pemilihan</NuxtLink></div><div><h3>Kanal MPM</h3><a href="https://instagram.com/MPMPOLTEKKESJAKARTA1" target="_blank" rel="noopener noreferrer">Instagram MPM</a><a href="#panduan-voting">Panduan pemilih</a></div><div><h3>Akses portal</h3><NuxtLink to="/login">Masuk sebagai pemilih</NuxtLink><NuxtLink to="/admin">Panel panitia & admin</NuxtLink></div></div><div class="footer-bottom"><span>PEMIRA · Poltekkes Kemenkes Jakarta I</span><span>Hasil sementara bukan penetapan pemenang.</span></div></div></footer>
  </div>
</template>

<style scoped>
.portal {
  --green: #005d42;
  --ink: #131b2e;
  --muted: #48544e;
  --line: #e4e8e5;
  font-family: 'Plus Jakarta Sans', var(--font-sans);
  color: var(--ink);
  background: #faf8ff;
  line-height: 1.65;
}
.portal :is(h1, h2, h3, p, figure) { margin: 0; }
.portal h1, .portal h2, .portal h3 { line-height: 1.25; }
.portal a { text-decoration: none; }
.portal button { cursor: pointer; }
.portal :is(a, button, summary):focus-visible { outline: 3px solid #855300; outline-offset: 4px; box-shadow: none; }
.portal section[id] { scroll-margin-top: 6.5rem; }
.container { width: min(100% - 4rem, 1216px); margin-inline: auto; }
.portal-header { position: sticky; top: 0; z-index: 30; border-bottom: 1px solid var(--line); background: #fff; }
.header-inner { min-height: 80px; display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; }
.brand { display: flex; align-items: center; gap: 0.65rem; flex-shrink: 0; color: var(--green); font-size: 1.15rem; font-weight: 800; line-height: 1.2; }
.brand-symbol { font-size: 1.35rem; border-bottom: 3px solid var(--green); }
.brand small { display: block; margin-top: 0.3rem; color: var(--muted); font-size: 0.57rem; letter-spacing: 0.07em; text-transform: uppercase; font-weight: 600; }
.desktop-nav { display: flex; gap: 0.25rem; }
.desktop-nav a { padding: 0.7rem; color: var(--muted); font-size: 0.8rem; font-weight: 500; white-space: nowrap; }
.desktop-nav a:hover { color: var(--green); background: #f2f3ff; border-radius: 0.5rem; }
.button { display: inline-flex; align-items: center; justify-content: center; gap: 0.75rem; min-height: 44px; padding: 0.75rem 1.15rem; border: 0; border-radius: 0.5rem; font: inherit; font-size: 0.8rem; font-weight: 700; text-align: center; transition: background-color 150ms; }
.primary { background: #047857; color: #fff; }
.primary:hover { background: var(--green); color: #fff; }
.soft { background: #eaedff; color: var(--green); }
.soft:hover { background: #e2e7ff; }
.white { background: white; color: var(--green); }
.ochre { background: #855300; color: white; }
.ochre:hover { background: #653e00; color: white; }
.menu-toggle { display: none; min-height: 44px; padding: 0.5rem 0.8rem; border: 1px solid var(--line); border-radius: 0.5rem; color: var(--green); background: white; font: inherit; }
.mobile-nav { display: grid; padding-block: 0.75rem; }
.mobile-nav a { padding: 0.65rem; color: var(--green); }
.announcement { padding-block: 0.55rem; background: #e2e7ff; font-size: 0.75rem; color: var(--muted); }
.announcement .container { display: flex; justify-content: center; align-items: center; gap: 0.7rem; }
.announcement span { background: #fea619; color: #4b3000; padding: 0.15rem 0.4rem; border-radius: 0.2rem; font-size: 0.6rem; font-weight: 800; text-transform: uppercase; }
.hero { padding: 5.5rem 0 4rem; background: linear-gradient(115deg, #e1faf0 0%, #fff 35%, #fff 70%, #fff1e2 100%); }
.hero-grid { display: grid; grid-template-columns: 1.2fr 1fr; align-items: center; gap: 3rem; }
.eyebrow-tag { display: inline-block; background: #e2efea; color: var(--green); padding: 0.25rem 0.65rem; border-radius: 1rem; font-size: 0.65rem; font-weight: 600; }
.hero h1 { margin-top: 1.25rem; font-size: clamp(2.3rem, 3.8vw, 3.5rem); letter-spacing: -0.045em; font-weight: 800; }
.hero h1 span { color: var(--green); }
.hero .hero-description { margin-top: 1.25rem; color: var(--muted); font-size: 1rem; line-height: 1.8; max-width: 37rem; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1.6rem; }
.hero-notes { display: flex; flex-wrap: wrap; gap: 1.5rem; margin-top: 1.65rem; font-size: 0.7rem; color: var(--muted); }
.hero-photo { position: relative; padding: 0.9rem; border-radius: 1rem; background: #eaedff; box-shadow: 0 10px 18px #131b2e1a; }
.hero-photo > img { display: block; width: 100%; height: 370px; object-fit: cover; border-radius: 0.6rem; }
.hero-photo figcaption { position: absolute; bottom: 1.6rem; left: 1.6rem; right: 1.6rem; display: flex; align-items: center; gap: 0.7rem; padding: 0.9rem; background: #fffffff2; border-radius: 0.6rem; }
.hero-photo figcaption strong { display: block; font-size: 0.9rem; }
.hero-photo figcaption small { display: block; font-size: 0.65rem; color: var(--muted); }
.calendar-mark { padding: 0.45rem; color: var(--green); background: #e2efea; border-radius: 0.3rem; }
.badge { display: inline-block; padding: 0.2rem 0.55rem; border-radius: 1rem; font-size: 0.65rem; font-weight: 600; }
.green { background: #d7f6e7; color: #00513a; }
.amber { background: #ffecd5; color: #653e00; }
.teal { background: #d9f8f3; color: #005049; }
.hero-photo .badge { margin-left: auto; flex-shrink: 0; }
.metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1.4rem; margin-top: 3.5rem; }
.metrics article { padding: 1.5rem; border-radius: 0.75rem; background: #fff; box-shadow: 0 1px 2px #131b2e08; }
.metrics p { color: var(--muted); font-size: 0.65rem; letter-spacing: 0.04em; text-transform: uppercase; }
.metrics strong { display: block; margin-top: 1rem; font-size: 1.6rem; line-height: 1.3; letter-spacing: -0.03em; }
.metrics .metric-date { font-size: 1.1rem; }
.metrics span { display: block; color: var(--muted); font-size: 0.7rem; margin-top: 0.3rem; }
.section { padding-block: 4rem; }
.eyebrow { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: var(--green); }
.portal h2 { font-size: clamp(1.8rem, 3vw, 2.5rem); letter-spacing: -0.04em; margin: 0.4rem 0 1rem; }
.portal h3 { font-size: 1rem; font-weight: 700; }
.about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; }
.about p:not(.eyebrow) { color: var(--muted); font-size: 0.9rem; }
.about .lead { margin-bottom: 1rem; font-size: 1rem; }
.mission { margin-top: 1.3rem; padding: 1.5rem; border-radius: 0.65rem; background: #f2f3ff; }
.mission p + p { margin-top: 0.5rem; font-style: italic; }
.values { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
.values article { padding: 1.1rem; border-radius: 0.5rem; background: white; }
.values p { margin-top: 0.4rem; }
.organization-list { display: grid; gap: 1rem; align-content: start; }
.organization { padding: 1.5rem; border-radius: 0.8rem; background: white; }
.org-heading { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.9rem; }
.org-icon { flex-shrink: 0; display: grid; place-items: center; width: 2.8rem; height: 2.8rem; border-radius: 0.65rem; font-weight: 800; font-size: 0.75rem; }
.org-heading .badge { margin-left: auto; white-space: nowrap; }
.org-heading h3 { margin-top: 0.25rem; font-size: 0.95rem; }
.org-heading .eyebrow { font-size: 0.55rem; }
.tinted { background: #f2f3ff; }
.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 2rem; margin-bottom: 2rem; }
.section-heading p:not(.eyebrow) { max-width: 48rem; color: var(--muted); font-size: 0.95rem; }
.section-heading .button { flex-shrink: 0; }
.period-info { margin-bottom: 1.5rem; font-size: 0.85rem; color: var(--muted); }
.period-info article { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem; margin-bottom: 0.5rem; background: white; border-radius: 0.5rem; }
.load-error { display: flex; align-items: center; flex-wrap: wrap; gap: 1rem; }
.category-grid, .rules-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.5rem; }
.category-card { display: flex; flex-direction: column; padding: 1.5rem; border-radius: 0.9rem; background: white; }
.card-kicker { font-size: 0.65rem; color: var(--green); margin-bottom: 1.3rem !important; }
.category-title { display: flex; gap: 0.8rem; align-items: center; }
.category-title .eyebrow { font-size: 0.6rem; color: var(--muted); }
.category-title h3 { margin-top: 0.3rem; }
.category-card > p:not(.card-kicker) { font-size: 0.8rem; color: var(--muted); margin: 1rem 0 1.5rem; flex: 1; }
.category-card .button { justify-content: space-between; font-size: 0.75rem; }
.rule-card { padding: 1.5rem; border-radius: 0.75rem; background: white; }
.rule-number { display: grid; place-items: center; width: 2.4rem; height: 2.4rem; margin-bottom: 1rem; border-radius: 50%; color: var(--green); background: #e2efea; font-size: 0.8rem; }
.rule-card p { color: var(--muted); font-size: 0.85rem; margin-top: 0.5rem; }
.rule-card.danger { background: #fcecef; }
.danger h3 { color: #93000a; }
.danger .rule-number { color: white; background: #ba1a1a; }
.guide-heading { text-align: center; margin: 0 auto 2rem; max-width: 42rem; }
.guide-heading > p:last-child { color: var(--muted); }
.steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem; }
.steps article { display: flex; align-items: start; gap: 1rem; padding: 1.5rem; border-radius: 0.8rem; background: white; }
.steps strong { display: grid; place-items: center; flex-shrink: 0; width: 2.6rem; height: 2.6rem; background: var(--green); color: white; font-size: 1.25rem; border-radius: 0.5rem; }
.steps p { color: var(--muted); font-size: 0.8rem; margin-top: 0.4rem; }
.tutorials { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
.tutorial { padding: 1.5rem; border-radius: 0.8rem; background: white; }
.tutorial > img { width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 0.5rem; display: block; margin-bottom: 1.25rem; }
.tutorial h3 { margin: 0.4rem 0 0.6rem; font-size: 1.15rem; }
.tutorial > p:not(.eyebrow), .tutorial ol { font-size: 0.85rem; color: var(--muted); }
.tutorial details { margin-top: 1rem; }
.tutorial summary { cursor: pointer; color: var(--green); min-height: 44px; padding-block: 0.6rem; font-size: 0.85rem; font-weight: 600; }
.tutorial ol { padding-left: 1.2rem; }
.tutorial li + li { margin-top: 0.6rem; }
.help-section { background: white; }
.help-banner { display: grid; grid-template-columns: 1.8fr 1fr; gap: 3rem; align-items: center; padding: 3.5rem; border-radius: 1.3rem; color: white; background: linear-gradient(115deg, #005d42, #00665b); box-shadow: 0 5px 10px #131b2e15; }
.help-banner .eyebrow-tag { background: #ffffff20; color: white; }
.help-banner h2 { font-size: clamp(1.8rem, 2.6vw, 2.5rem); }
.help-banner p:last-child { font-size: 0.95rem; color: #e3f2ec; }
.help-actions { display: grid; gap: 0.75rem; }
.gold { background: #fea619; color: #402800; }
.gold:hover { background: #ffb95f; color: #402800; }
.help-link { background: #ffffff18; color: white; }
.help-link:hover { background: #ffffff28; color: white; }
.portal-footer { padding-top: 2.5rem; }
.footer-grid { display: grid; grid-template-columns: 1.3fr 1fr 1fr 1fr; gap: 2rem; padding-bottom: 2.5rem; }
.footer-grid h3 { font-size: 0.9rem; margin-bottom: 0.75rem; }
.footer-grid p, .footer-grid a { color: var(--muted); font-size: 0.75rem; }
.footer-grid a { display: block; padding-block: 0.6rem; }
.footer-grid a:hover { text-decoration: underline; }
.footer-bottom { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; padding-block: 1.2rem; border-top: 1px solid var(--line); font-size: 0.65rem; color: var(--muted); }
@media (max-width: 1120px) {
  .desktop-nav { display: none; }
  .menu-toggle { display: block; }
  .header-cta { margin-left: auto; }
  .hero-grid { gap: 2rem; }
  .org-heading { flex-wrap: wrap; }
  .org-heading > div { flex: 1; }
  .org-heading .badge { margin-left: 0; }
  .hero-photo .badge { display: none; }
}
@media (max-width: 800px) {
  .container { width: calc(100% - 3rem); }
  .hero { padding-top: 3rem; }
  .hero-grid, .about-grid { grid-template-columns: 1fr; }
  .hero-copy { max-width: 40rem; }
  .hero-photo { width: min(100%, 36rem); margin-inline: auto !important; }
  .hero-photo > img { height: 350px; }
  .metrics, .category-grid, .rules-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .steps { grid-template-columns: 1fr; gap: 0.75rem; }
  .help-banner { grid-template-columns: 1fr; padding: 2rem; gap: 1.5rem; }
  .help-actions { grid-template-columns: 1fr 1fr; }
  .footer-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 520px) {
  .container { width: calc(100% - 2rem); }
  .header-inner { min-height: 72px; gap: 0.75rem; }
  .header-cta { display: none; }
  .brand small { font-size: 0.52rem; }
  .announcement .container { align-items: start; flex-direction: column; gap: 0.4rem; }
  .hero h1 { font-size: 2.3rem; }
  .hero-actions { display: grid; }
  .hero-photo > img { height: 300px; }
  .hero-photo figcaption { left: 1.3rem; right: 1.3rem; bottom: 1.3rem; padding: 0.6rem; }
  .hero-photo figcaption strong { font-size: 0.8rem; }
  .metrics { gap: 0.75rem; margin-top: 2rem; }
  .metrics article { padding: 1rem; }
  .metrics strong { font-size: 1.2rem; }
  .metrics .metric-date { font-size: 1rem; }
  .section { padding-block: 3rem; }
  .section-heading { align-items: start; flex-direction: column; gap: 1rem; }
  .category-grid, .rules-grid, .tutorials { grid-template-columns: 1fr; gap: 1rem; }
  .help-banner { padding: 1.5rem; }
  .help-actions { grid-template-columns: 1fr; }
  .footer-grid { gap: 1.5rem; }
}
</style>
