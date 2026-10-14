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
const links = [
  { label: 'Tentang', href: '#tentang-pemira' },
  { label: 'Jadwal', href: '#jadwal-voting' },
  { label: 'Quick count', href: '/quick-count' },
  { label: 'Tata tertib', href: '#tata-tertib' },
  { label: 'Panduan', href: '#panduan-voting' },
]
const organizations = [
  { short: 'MPM', name: 'Majelis Permusyawaratan Mahasiswa', category: 'Legislatif · tingkat institusi', description: 'Lembaga perwakilan mahasiswa yang menampung aspirasi, mengawasi organisasi kemahasiswaan, dan menyelenggarakan PEMIRA.' },
  { short: 'BEM', name: 'Badan Eksekutif Mahasiswa', category: 'Eksekutif · Presma & Wapresma', description: 'Badan eksekutif tingkat institusi yang menjalankan program kerja, menyalurkan aspirasi, dan menggerakkan kegiatan mahasiswa.' },
  { short: 'HIMA', name: 'Himpunan Mahasiswa Jurusan', category: 'Perwakilan · 4 jurusan', description: 'Wadah mahasiswa jurusan Keperawatan, Kebidanan, Kesehatan Gigi, dan Ortotik Prostetik untuk berkarya bersama.' },
]
const categories = [
  { title: 'Keperawatan', group: 'Himpunan Mahasiswa', mark: 'KP' },
  { title: 'Kebidanan', group: 'Himpunan Mahasiswa', mark: 'KB' },
  { title: 'Kesehatan Gigi', group: 'Himpunan Mahasiswa', mark: 'KG' },
  { title: 'Ortotik Prostetik', group: 'Himpunan Mahasiswa', mark: 'OP' },
  { title: 'Badan Eksekutif Mahasiswa', group: 'Eksekutif kampus', mark: 'BEM' },
  { title: 'Majelis Permusyawaratan Mahasiswa', group: 'Legislatif mahasiswa', mark: 'MPM' },
]
const rules = [
  { title: 'Terdaftar sebagai pemilih', description: 'Gunakan NIM atau NIP lokal yang telah terdaftar pada daftar pemilih panitia.' },
  { title: 'Asas Luber Jurdil', description: 'Gunakan hak pilih secara langsung, umum, bebas, rahasia, jujur, dan adil. Hak suara tidak boleh diwakilkan.' },
  { title: 'Situs resmi panitia', description: 'Berikan suara melalui portal PEMIRA. Kontes yang dapat Anda ikuti tampil pada halaman hak pilih.' },
  { title: 'Jaga akses akun', description: 'Gunakan password yang dibagikan panitia. Jangan berikan password atau akses akun kepada orang lain.' },
  { title: 'Penetapan pilihan', description: 'Periksa calon, tinjau pilihan, lalu konfirmasi. Suara yang sudah tercatat tidak dapat diubah.' },
  { title: 'Larangan dalam pemilihan', description: 'Hindari intimidasi, politik uang, penyalahgunaan akun, dan tindakan yang mengganggu kebebasan pemilih.', danger: true },
]
const steps = [
  { title: 'Siapkan akun', description: 'Gunakan NIM atau NIP lokal dan password yang dibagikan panitia.' },
  { title: 'Buka surat suara', description: 'Pilih kontes yang tersedia, lalu baca profil dan program calon.' },
  { title: 'Pilih & konfirmasi', description: 'Tinjau pilihan, kirim suara, lalu simpan kode tanda terima.' },
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
    <header class="masthead">
      <div class="container head-inner">
        <NuxtLink to="/" class="brand">
          <span class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 12 2 2 4-4" /><rect x="3" y="4" width="18" height="16" rx="2" /></svg>
          </span>
          <span class="brand-text">PEMIRA<small>Poltekkes Kemenkes Jakarta I</small></span>
        </NuxtLink>
        <nav class="desktop-nav" aria-label="Navigasi portal">
          <a v-for="link in links" :key="link.href" :href="link.href">{{ link.label }}</a>
        </nav>
        <NuxtLink to="/login" class="btn btn-solid head-cta">Masuk untuk memilih</NuxtLink>
        <button class="menu-toggle" :aria-expanded="menuOpen" aria-controls="portal-menu" @click="menuOpen = !menuOpen">
          <span aria-hidden="true" />Menu
        </button>
      </div>
      <nav v-if="menuOpen" id="portal-menu" class="mobile-nav container" aria-label="Navigasi mobile">
        <a v-for="link in links" :key="link.href" :href="link.href" @click="menuOpen = false">{{ link.label }}</a>
        <NuxtLink to="/login" class="btn btn-solid mobile-cta" @click="menuOpen = false">Masuk untuk memilih</NuxtLink>
      </nav>
    </header>

    <main id="portal-content" tabindex="-1">
      <!-- HERO -->
      <section class="hero">
        <div class="container hero-grid">
          <div class="hero-copy">
            <p class="status-line" aria-live="polite">
              <span class="dot" :class="{ live: current?.status === 'OPEN' }" aria-hidden="true" />
              <template v-if="loading">Memuat status pemilihan…</template>
              <template v-else-if="current">{{ current.name }} — {{ electionStatus(current.status) }}</template>
              <template v-else>Pendaftaran dan jadwal diumumkan melalui portal ini</template>
            </p>
            <h1>Pemilihan Raya Mahasiswa<br>Poltekkes Kemenkes <em>Jakarta&nbsp;I</em></h1>
            <p class="hero-lead">Satu suara menentukan arah kepemimpinan mahasiswa. Pilih perwakilan MPM, BEM, dan HIMA secara langsung, bebas, dan rahasia melalui portal resmi panitia.</p>
            <div class="hero-actions">
              <NuxtLink to="/login" class="btn btn-solid">Masuk untuk memilih</NuxtLink>
              <a class="btn btn-line" href="#jadwal-voting">Lihat jadwal pemungutan</a>
            </div>
            <dl class="hero-facts">
              <div><dt>Jurusan</dt><dd>4</dd></div>
              <div><dt>Organisasi</dt><dd>MPM · BEM · HIMA</dd></div>
              <div><dt>Asas</dt><dd>Luber Jurdil</dd></div>
            </dl>
          </div>

          <!-- Surat suara stylized, murni CSS/SVG, bukan stock image -->
          <aside class="ballot" aria-hidden="true">
            <div class="ballot-head">
              <span>SURAT SUARA</span>
              <span class="ballot-seal">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 3.5 8 8 11 4.5-3 8-6 8-11V5z" /><path d="m9 12 2 2 4-4" /></svg>
              </span>
            </div>
            <ul class="ballot-options">
              <li class="is-marked"><span class="box"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-11" /></svg></span><span class="line line-1" /></li>
              <li><span class="box" /><span class="line line-2" /></li>
              <li><span class="box" /><span class="line line-3" /></li>
            </ul>
            <div class="ballot-foot">
              <span>{{ current ? electionStatus(current.status) : 'Menunggu jadwal' }}</span>
              <span>{{ current?.startsAt ? electionDate(current.startsAt) : '—' }}</span>
            </div>
          </aside>
        </div>
      </section>

      <!-- TENTANG -->
      <section id="tentang-pemira" class="section">
        <div class="container section-grid">
          <div class="section-lead">
            <p class="kicker">Tentang PEMIRA</p>
            <h2>Pesta demokrasi mahasiswa Poltekkes Jakarta I</h2>
            <p>Melalui PEMIRA, mahasiswa memilih perwakilan di <strong>MPM</strong>, pimpinan <strong>BEM</strong>, serta pengurus <strong>HIMA</strong> di setiap jurusan. Kenali calon dan programnya, lalu pilih pemimpin yang siap mengemban amanah.</p>
            <div class="pillars">
              <div><h3>Langsung &amp; rahasia</h3><p>Hak pilih digunakan sendiri sesuai hati nurani, tanpa diwakilkan.</p></div>
              <div><h3>Transparan</h3><p>Hasil quick count dan penetapan dipublikasikan terbuka oleh panitia.</p></div>
            </div>
          </div>
          <ul class="org-list">
            <li v-for="org in organizations" :key="org.short">
              <span class="org-mark">{{ org.short }}</span>
              <div>
                <p class="org-cat">{{ org.category }}</p>
                <h3>{{ org.name }}</h3>
                <p class="org-desc">{{ org.description }}</p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <!-- JADWAL -->
      <section id="jadwal-voting" class="section band">
        <div class="container">
          <div class="band-head">
            <div>
              <p class="kicker">Jadwal resmi</p>
              <h2>Jadwal pemungutan suara</h2>
              <p class="muted">Periksa periode yang tersedia, lalu masuk untuk melihat kontes sesuai hak pilih Anda.</p>
            </div>
            <div class="band-actions">
              <NuxtLink to="/quick-count" class="btn btn-line">Quick count</NuxtLink>
              <NuxtLink to="/results" class="btn btn-ghost">Hasil resmi</NuxtLink>
            </div>
          </div>

          <div class="schedule" aria-live="polite">
            <p v-if="loading" class="muted">Memuat jadwal pemilihan…</p>
            <div v-else-if="error" class="schedule-error">
              <p>{{ error }}</p>
              <button class="btn btn-line" @click="load">Coba lagi</button>
            </div>
            <p v-else-if="!elections.length" class="muted">Jadwal belum diumumkan. Informasi periode akan tampil di sini setelah tersedia.</p>
            <ol v-else class="schedule-list">
              <li v-for="election in elections" :key="election.id">
                <div class="sl-main">
                  <strong>{{ election.name }}</strong>
                  <span>{{ electionDate(election.startsAt) }} — {{ electionDate(election.endsAt) }}</span>
                </div>
                <span class="status-pill" :class="{ open: election.status === 'OPEN' }">{{ electionStatus(election.status) }}</span>
              </li>
            </ol>
          </div>

          <ul class="contest-grid">
            <li v-for="category in categories" :key="category.mark">
              <NuxtLink to="/login" class="contest-card">
                <span class="contest-mark">{{ category.mark }}</span>
                <span class="contest-body">
                  <small>{{ category.group }}</small>
                  <strong>{{ category.title }}</strong>
                </span>
                <span class="contest-go" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </span>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </section>

      <!-- TATA TERTIB -->
      <section id="tata-tertib" class="section">
        <div class="container">
          <div class="band-head">
            <div>
              <p class="kicker">Panduan pemilih</p>
              <h2>Tata tertib pemilihan</h2>
              <p class="muted">Jaga integritas, kerahasiaan, dan kelancaran pemilihan dengan mengikuti ketentuan berikut.</p>
            </div>
          </div>
          <ol class="rules">
            <li v-for="(rule, index) in rules" :key="rule.title" :class="{ danger: rule.danger }">
              <span class="rule-no">{{ String(index + 1).padStart(2, '0') }}</span>
              <div>
                <h3>{{ rule.title }}</h3>
                <p>{{ rule.description }}</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <!-- PANDUAN -->
      <section id="panduan-voting" class="section band">
        <div class="container">
          <div class="band-head center">
            <div>
              <p class="kicker">Alur pemilihan</p>
              <h2>Cara memberikan suara</h2>
              <p class="muted">Tiga langkah agar hak suara Anda tercatat dengan benar.</p>
            </div>
          </div>
          <ol class="steps">
            <li v-for="(step, index) in steps" :key="step.title">
              <span class="step-no">{{ index + 1 }}</span>
              <h3>{{ step.title }}</h3>
              <p>{{ step.description }}</p>
            </li>
          </ol>
          <details class="guide-detail">
            <summary>Rincian langkah pemilihan HIMA &amp; BEM</summary>
            <ol>
              <li>Masuk ke akun pemilih menggunakan NIM / NIP lokal.</li>
              <li>Buka kontes HIMA sesuai jurusan atau kontes BEM yang tersedia.</li>
              <li>Baca profil calon, lalu pilih satu calon atau pasangan.</li>
              <li>Tekan “Tinjau pilihan”, periksa kembali, lalu kirim suara.</li>
              <li>Pastikan status “Suara sudah tercatat” muncul dan simpan tanda terima.</li>
            </ol>
          </details>
        </div>
      </section>

      <!-- BANTUAN -->
      <section class="section">
        <div class="container">
          <div class="help">
            <div class="help-copy">
              <p class="kicker light">Bantuan pemilih</p>
              <h2>Mengalami kendala saat memilih?</h2>
              <p>Hubungi panitia melalui kanal MPM untuk bantuan akses akun atau pemeriksaan daftar pemilih. Jangan pernah membagikan password Anda kepada siapa pun.</p>
            </div>
            <div class="help-actions">
              <a class="btn btn-accent" href="https://instagram.com/MPMPOLTEKKESJAKARTA1" target="_blank" rel="noopener noreferrer">Instagram MPM</a>
              <a class="btn btn-on-dark" href="#panduan-voting">Baca panduan</a>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="portal-footer">
      <div class="container footer-grid">
        <div class="footer-brand">
          <span class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 12 2 2 4-4" /><rect x="3" y="4" width="18" height="16" rx="2" /></svg>
          </span>
          <p>Pemilihan Raya Mahasiswa<br>Poltekkes Kemenkes Jakarta I</p>
        </div>
        <nav aria-label="Informasi pemilihan"><h3>Pemilihan</h3><a href="#jadwal-voting">Jadwal voting</a><a href="#tata-tertib">Tata tertib</a><NuxtLink to="/quick-count">Quick count</NuxtLink><NuxtLink to="/results">Hasil resmi</NuxtLink></nav>
        <nav aria-label="Kanal MPM"><h3>Kanal MPM</h3><a href="https://instagram.com/MPMPOLTEKKESJAKARTA1" target="_blank" rel="noopener noreferrer">Instagram MPM</a><a href="#panduan-voting">Panduan pemilih</a></nav>
        <nav aria-label="Akses portal"><h3>Portal</h3><NuxtLink to="/login">Masuk sebagai pemilih</NuxtLink><NuxtLink to="/admin">Panel panitia</NuxtLink></nav>
      </div>
      <div class="container footer-bottom">
        <span>© PEMIRA · Poltekkes Kemenkes Jakarta I</span>
        <span>Hasil sementara bukan penetapan pemenang.</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.portal {
  --green: #0b5c43;
  --green-deep: #073f2e;
  --ink: #14201b;
  --muted: #5a6b63;
  --line: #e3e9e5;
  --paper: #fbfcfb;
  --accent: #c2410c;
  font-family: 'Plus Jakarta Sans', var(--font-sans);
  color: var(--ink);
  background: var(--paper);
  line-height: 1.6;
}
.portal :is(h1, h2, h3, p, dl, dd, ol, ul, figure) { margin: 0; }
.portal ol, .portal ul { list-style: none; padding: 0; }
.portal a { text-decoration: none; color: inherit; }
.portal button { cursor: pointer; }
.portal :is(a, button, summary):focus-visible { outline: 2px solid var(--green); outline-offset: 3px; }
.portal section[id] { scroll-margin-top: 5.5rem; }
.container { width: min(100% - 3rem, 1120px); margin-inline: auto; }
.muted { color: var(--muted); }

h1, h2, h3 { letter-spacing: -0.03em; }

/* Buttons */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; min-height: 46px; padding: 0.7rem 1.25rem; border: 1px solid transparent; border-radius: 999px; font: inherit; font-size: 0.9rem; font-weight: 600; text-align: center; transition: background 140ms ease, color 140ms ease, border-color 140ms ease; }
.portal .btn-solid { background: var(--green); color: #ffffff; font-weight: 700; }
.portal .btn-solid:hover { background: var(--green-deep); color: #ffffff; }
.portal .btn-line { background: transparent; color: var(--green-deep); border-color: var(--line); }
.portal .btn-line:hover { border-color: var(--green); background: #fff; color: var(--green-deep); }
.portal .btn-ghost { background: transparent; color: var(--green-deep); }
.portal .btn-ghost:hover { text-decoration: underline; }
.portal .btn-accent { background: var(--accent); color: #fff; }
.portal .btn-accent:hover { background: #9a330a; color: #fff; }
.portal .btn-on-dark { background: rgba(255,255,255,0.16); color: #fff; border-color: rgba(255,255,255,0.55); }
.portal .btn-on-dark:hover { background: rgba(255,255,255,0.28); border-color: #fff; color: #fff; }

/* Masthead */
.masthead { position: sticky; top: 0; z-index: 30; background: rgba(251,252,251,0.9); backdrop-filter: blur(8px); border-bottom: 1px solid var(--line); }
.head-inner { display: flex; align-items: center; gap: 1.5rem; min-height: 72px; }
.brand { display: inline-flex; align-items: center; gap: 0.6rem; font-weight: 800; color: var(--green-deep); }
.brand-mark { display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: 0.55rem; background: var(--green); color: #fff; flex-shrink: 0; }
.brand-text { display: flex; flex-direction: column; font-size: 1.05rem; line-height: 1.1; }
.brand-text small { font-size: 0.56rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-top: 0.2rem; }
.desktop-nav { display: flex; gap: 0.3rem; margin-right: auto; margin-left: 1rem; }
.desktop-nav a { padding: 0.55rem 0.75rem; border-radius: 999px; font-size: 0.85rem; font-weight: 500; color: var(--muted); }
.desktop-nav a:hover { color: var(--green-deep); background: #eef3f0; }
.menu-toggle { display: none; align-items: center; gap: 0.5rem; min-height: 44px; padding: 0.5rem 0.9rem; border: 1px solid var(--line); border-radius: 999px; background: #fff; font: inherit; font-weight: 600; color: var(--green-deep); }
.menu-toggle span { width: 16px; height: 2px; background: currentColor; box-shadow: 0 5px 0 currentColor, 0 -5px 0 currentColor; }
.mobile-nav { display: grid; gap: 0.15rem; padding-block: 0.75rem; }
.mobile-nav a { padding: 0.7rem 0.5rem; border-radius: 0.5rem; font-weight: 600; color: var(--green-deep); }
.mobile-nav a:hover { background: #eef3f0; }
.mobile-cta { margin-top: 0.5rem; width: 100%; }
.mobile-cta:hover { background: var(--green-deep); }

/* Hero */
.hero { position: relative; padding: clamp(3rem, 7vw, 5.5rem) 0 clamp(3rem, 6vw, 4.5rem); overflow: hidden; }
.hero::before { content: ''; position: absolute; inset: 0; background:
    radial-gradient(42rem 32rem at 85% -10%, #e8f3ee 0%, transparent 60%),
    linear-gradient(var(--paper), var(--paper)); z-index: -1; }
.hero-grid { display: grid; grid-template-columns: 1.25fr 0.85fr; align-items: center; gap: clamp(2rem, 5vw, 4rem); }
.status-line { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; font-weight: 600; color: var(--green-deep); }
.status-line .dot { width: 0.5rem; height: 0.5rem; border-radius: 50%; background: var(--muted); }
.status-line .dot.live { background: var(--green); box-shadow: 0 0 0 4px #0b5c4322; }
.hero h1 { margin-top: 1.1rem; font-size: clamp(2.4rem, 5.2vw, 4rem); font-weight: 800; line-height: 1.05; letter-spacing: -0.045em; }
.hero h1 em { font-style: normal; color: var(--green); }
.hero-lead { margin-top: 1.35rem; max-width: 34rem; font-size: 1.05rem; color: var(--muted); }
.hero-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1.75rem; }
.hero-facts { display: flex; flex-wrap: wrap; gap: 2.5rem; margin-top: 2.25rem; padding-top: 1.75rem; border-top: 1px solid var(--line); }
.hero-facts dt { font-size: 0.7rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--muted); }
.hero-facts dd { margin-top: 0.3rem; font-size: 1.1rem; font-weight: 700; letter-spacing: -0.02em; }

/* Ballot illustration */
.ballot { display: flex; flex-direction: column; gap: 1.1rem; padding: 1.5rem; background: #fff; border: 1px solid var(--line); border-radius: 1rem; box-shadow: 0 24px 60px -32px #0b5c4355; transform: rotate(-1.4deg); }
.ballot-head { display: flex; align-items: center; justify-content: space-between; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.12em; color: var(--green-deep); padding-bottom: 1rem; border-bottom: 2px solid var(--ink); }
.ballot-seal { display: grid; place-items: center; width: 1.9rem; height: 1.9rem; border-radius: 50%; color: var(--green); background: #e8f3ee; }
.ballot-options { display: grid; gap: 0.9rem; }
.ballot-options li { display: flex; align-items: center; gap: 0.9rem; padding: 0.85rem; border: 1px solid var(--line); border-radius: 0.65rem; }
.ballot-options li.is-marked { border-color: var(--green); background: #f1f8f4; }
.ballot-options .box { display: grid; place-items: center; width: 1.6rem; height: 1.6rem; border: 2px solid var(--line); border-radius: 0.35rem; color: #fff; flex-shrink: 0; }
.ballot-options li.is-marked .box { background: var(--green); border-color: var(--green); }
.ballot-options .line { height: 0.55rem; border-radius: 999px; background: #eef1ef; }
.ballot-options .line-1 { width: 70%; background: #cfe4d8; }
.ballot-options .line-2 { width: 55%; }
.ballot-options .line-3 { width: 62%; }
.ballot-foot { display: flex; justify-content: space-between; font-size: 0.68rem; color: var(--muted); padding-top: 1rem; border-top: 1px dashed var(--line); }

/* Section scaffolding */
.section { padding-block: clamp(3rem, 6vw, 4.5rem); }
.band { background: #f3f7f4; border-block: 1px solid var(--line); }
.kicker { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--green); }
.kicker.light { color: #cde9df; }
.section h2 { margin-top: 0.5rem; font-size: clamp(1.75rem, 3.4vw, 2.5rem); }
.section-grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(2rem, 5vw, 4rem); align-items: start; }
.section-lead > p { margin-top: 1rem; color: var(--muted); font-size: 1rem; max-width: 32rem; }
.pillars { display: grid; gap: 1.25rem; margin-top: 2rem; }
.pillars h3 { font-size: 1rem; }
.pillars p { margin-top: 0.35rem; color: var(--muted); font-size: 0.9rem; }

/* Organizations */
.org-list { display: grid; gap: 1rem; }
.org-list li { display: flex; gap: 1.1rem; padding: 1.4rem; background: #fff; border: 1px solid var(--line); border-radius: 0.9rem; }
.org-mark { display: grid; place-items: center; width: 3rem; height: 3rem; flex-shrink: 0; border-radius: 0.7rem; background: var(--green); color: #fff; font-weight: 800; font-size: 0.78rem; letter-spacing: 0.02em; }
.org-cat { font-size: 0.68rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--muted); }
.org-list h3 { margin: 0.3rem 0 0.4rem; font-size: 1.05rem; }
.org-desc { color: var(--muted); font-size: 0.88rem; }

/* Band head */
.band-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 2rem; margin-bottom: 2rem; flex-wrap: wrap; }
.band-head.center { justify-content: center; text-align: center; }
.band-head .muted { margin-top: 0.75rem; max-width: 42rem; }
.band-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; }

/* Schedule */
.schedule { margin-bottom: 2.5rem; }
.schedule-error { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; }
.schedule-list { display: grid; gap: 0.75rem; }
.schedule-list li { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.1rem 1.25rem; background: #fff; border: 1px solid var(--line); border-radius: 0.75rem; }
.sl-main { display: grid; gap: 0.2rem; }
.sl-main strong { font-size: 1rem; }
.sl-main span { font-size: 0.82rem; color: var(--muted); }
.status-pill { padding: 0.3rem 0.75rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700; color: #3a4a43; background: #eef1ef; border: 1px solid #d4ddd7; }
.status-pill.open { color: #fff; background: var(--green); border-color: var(--green); }

/* Contest grid */
.contest-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.contest-card { display: flex; align-items: center; gap: 1rem; height: 100%; padding: 1.3rem; background: #fff; border: 1px solid var(--line); border-radius: 0.9rem; transition: border-color 140ms ease, transform 140ms ease; }
.contest-card:hover { border-color: var(--green); transform: translateY(-2px); }
.contest-mark { display: grid; place-items: center; width: 3rem; height: 3rem; flex-shrink: 0; border-radius: 0.7rem; background: #eef3f0; color: var(--green-deep); font-weight: 800; font-size: 0.8rem; }
.contest-body { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.contest-body small { font-size: 0.68rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); }
.contest-body strong { font-size: 0.98rem; }
.contest-go { color: var(--green); flex-shrink: 0; transition: transform 140ms ease; }
.contest-card:hover .contest-go { transform: translateX(3px); }

/* Rules */
.rules { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.rules li { display: flex; gap: 1rem; padding: 1.4rem; background: #fff; border: 1px solid var(--line); border-radius: 0.9rem; }
.rule-no { font-size: 1.1rem; font-weight: 800; color: var(--green); font-variant-numeric: tabular-nums; }
.rules h3 { font-size: 1rem; }
.rules p { margin-top: 0.4rem; color: var(--muted); font-size: 0.86rem; }
.rules li.danger { border-color: #f3c9c0; background: #fdf3f1; }
.rules li.danger .rule-no { color: var(--accent); }

/* Steps */
.steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; counter-reset: step; }
.steps li { position: relative; padding: 1.75rem 1.4rem 1.4rem; background: #fff; border: 1px solid var(--line); border-radius: 0.9rem; }
.step-no { display: grid; place-items: center; width: 2.4rem; height: 2.4rem; border-radius: 0.6rem; background: var(--green); color: #fff; font-weight: 800; font-size: 1.1rem; margin-bottom: 1rem; }
.steps h3 { font-size: 1.05rem; }
.steps p { margin-top: 0.4rem; color: var(--muted); font-size: 0.88rem; }
.guide-detail { max-width: 48rem; margin: 2rem auto 0; padding: 1.25rem 1.5rem; background: #fff; border: 1px solid var(--line); border-radius: 0.9rem; }
.guide-detail summary { font-weight: 700; color: var(--green-deep); min-height: 44px; display: flex; align-items: center; }
.guide-detail ol { list-style: decimal; padding-left: 1.25rem; margin-top: 0.75rem; display: grid; gap: 0.5rem; color: var(--muted); font-size: 0.9rem; }

/* Help */
.help { display: grid; grid-template-columns: 1.6fr 1fr; align-items: center; gap: 2.5rem; padding: clamp(2rem, 4vw, 3.25rem); border-radius: 1.25rem; color: #fff; background:
    radial-gradient(30rem 20rem at 100% 0%, #0e6e50 0%, transparent 70%),
    linear-gradient(135deg, var(--green-deep), var(--green)); }
.help h2 { margin-top: 0.5rem; color: #fff; }
.help p { margin-top: 0.9rem; color: #e4f1ea; font-size: 0.95rem; max-width: 36rem; }
.help-actions { display: grid; gap: 0.75rem; }

/* Footer */
.portal-footer { border-top: 1px solid var(--line); padding-top: 2.75rem; }
.footer-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 2rem; padding-bottom: 2.5rem; }
.footer-brand { display: grid; gap: 0.9rem; align-content: start; }
.footer-brand p { color: var(--muted); font-size: 0.82rem; }
.footer-grid h3 { font-size: 0.8rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--ink); margin-bottom: 0.5rem; }
.footer-grid nav a { display: block; padding-block: 0.5rem; color: var(--muted); font-size: 0.85rem; }
.footer-grid nav a:hover { color: var(--green-deep); }
.footer-bottom { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; padding-block: 1.25rem; border-top: 1px solid var(--line); font-size: 0.72rem; color: var(--muted); }

@media (max-width: 980px) {
  .desktop-nav { display: none; }
  .menu-toggle { display: inline-flex; margin-left: auto; }
  .head-cta { display: none; }
  .hero-grid, .section-grid, .help { grid-template-columns: 1fr; }
  .ballot { max-width: 24rem; margin-inline: auto; order: -1; }
  .contest-grid, .rules, .steps { grid-template-columns: repeat(2, 1fr); }
  .footer-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 560px) {
  .container { width: calc(100% - 2rem); }
  .hero-facts { gap: 1.5rem; }
  .hero-actions .btn { flex: 1; }
  .band-actions { width: 100%; }
  .band-actions .btn { flex: 1; }
  .contest-grid, .rules, .steps, .footer-grid { grid-template-columns: 1fr; }
  .help-actions { grid-template-columns: 1fr 1fr; }
}
</style>
