import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getOrganizations() {
  const organizations = await prisma.organization.findMany({
    include: {
      candidates: { select: { id: true } },
      votes: { select: { id: true } },
    },
    orderBy: { name: "asc" },
  });

  return organizations.map((org) => ({
    id: org.id,
    name: org.name,
    candidateCount: org.candidates.length,
    voteCount: org.votes.length,
  }));
}

function getElectionStatus(org: {
  candidateCount: number;
  voteCount: number;
}): { label: string; color: string } {
  if (org.candidateCount === 0) {
    return { label: "Belum Dimulai", color: "badge-muted" };
  }
  if (org.voteCount > 0) {
    return { label: "Berlangsung", color: "badge-teal" };
  }
  return { label: "Siap Dibuka", color: "badge-gold" };
}

export default async function LandingPage() {
  const organizations = await getOrganizations();
  const totalVotes = organizations.reduce((sum, org) => sum + org.voteCount, 0);
  const totalPemilih = 4520;
  const votePercent =
    totalPemilih > 0 ? Math.round((totalVotes / totalPemilih) * 1000) / 10 : 0;

  return (
    <div className="app-shell flex flex-col">
      <header className="top-nav">
        <div className="page-container flex h-16 items-center justify-between">
          <Link href="/" className="brand-text">
            E-VOTE POLTEKKES JKT1
          </Link>
          <nav className="hidden items-center gap-8 md:flex" aria-label="Navigasi utama">
            <a href="#beranda" className="nav-link nav-link-active">Beranda</a>
            <a href="#panduan" className="nav-link">Panduan</a>
            <a href="#statistik" className="nav-link">Statistik</a>
          </nav>
          <Link href="/login" className="btn-primary min-w-[92px]">
            Masuk
          </Link>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        <section id="beranda" className="hero-green">
          <div className="page-container grid min-h-[610px] items-center gap-10 py-16 lg:grid-cols-[1fr_0.92fr]">
            <div className="max-w-xl">
              <span className="inline-flex items-center rounded-full border border-emerald-300/30 bg-emerald-300/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">
                Official Pemira 2024
              </span>
              <h1 className="mt-8 text-5xl font-black leading-[0.95] tracking-[-0.06em] sm:text-6xl">
                Pemilihan Raya <span className="block text-[var(--accent)]">Mahasiswa</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-emerald-100">
                Wujudkan demokrasi kampus yang transparan dan akuntabel.
                Suaramu adalah kunci masa depan transformasi Poltekkes
                Kemenkes Jakarta 1.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link href="/login" className="btn-primary bg-[var(--secondary)] text-[var(--primary-dark)] hover:bg-emerald-300 sm:min-w-[190px]">
                  Mulai Memilih
                </Link>
                <a href="#panduan" className="btn-secondary border-white/25 bg-white/5 text-white hover:bg-white/10 sm:min-w-[190px]">
                  Lihat Panduan
                </a>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[470px] rounded-[24px] border border-emerald-200/20 bg-white/8 p-10">
              <div className="hero-visual" />
            </div>
          </div>
        </section>

        <section id="statistik" className="bg-[#eef1ff] py-14">
          <div className="page-container grid gap-6 md:grid-cols-3">
            {[
              ["▦", "Organisasi", organizations.length || 12, "Hima/UKM"],
              ["♟", "Total Pemilih", totalPemilih.toLocaleString("id-ID"), "Mahasiswa"],
              ["▤", "Suara Masuk", votePercent || 82.4, "%"],
            ].map(([icon, label, value, suffix]) => (
              <div key={label} className="stat-card">
                <span className="icon-tile">{icon}</span>
                <div>
                  <p className="text-sm text-[var(--ink)]">{label}</p>
                  <p className="mt-1 text-3xl font-black tracking-[-0.05em] text-[var(--primary)]">
                    {value} <span className="text-sm font-medium tracking-normal text-[var(--ink)]">{suffix}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="panduan" className="page-container py-20">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-black tracking-[-0.05em] text-[var(--primary)]">
              Panduan Memilih
            </h2>
            <p className="mt-4 text-[var(--muted)]">
              Ikuti langkah-langkah mudah di bawah ini untuk menyalurkan
              aspirasimu melalui sistem e-voting yang aman dan terpercaya.
            </p>
          </div>

          <div className="mt-14 grid gap-7 md:grid-cols-4">
            {[
              ["1", "↪", "Login Akun", "Gunakan NIM dan Password Portal Mahasiswa Anda."],
              ["2", "⌕", "Pilih Kandidat", "Pelajari visi misi kandidat dan pilih pilihan Anda."],
              ["3", "✓", "Konfirmasi", "Pastikan pilihan Anda sudah benar sebelum dikirim."],
              ["4", "♢", "Selesai", "Terima kasih atas partisipasi aktif Anda."],
            ].map(([step, icon, title, body]) => (
              <div key={step} className="panel relative min-h-[230px] p-7 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--primary)] text-lg font-black text-white">
                  {step}
                </span>
                <div className="mt-7 text-4xl font-light text-[var(--primary)]">{icon}</div>
                <h3 className="mt-4 text-xl font-bold text-[var(--ink)]">{title}</h3>
                <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="org-heading" className="hidden">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="org-heading" className="text-2xl font-extrabold text-[var(--primary)]">
                  Daftar Organisasi
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Organisasi yang berpartisipasi dalam Pemira.
                </p>
              </div>
            </div>

            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {organizations.map((org) => {
                const status = getElectionStatus(org);
                return (
                  <li key={org.id} className="panel p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-extrabold text-[var(--primary)]">
                        {org.name}
                      </h3>
                      <span className={`badge shrink-0 ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-[var(--muted)]">
                      {org.candidateCount} pasangan calon terdaftar
                    </p>
                  </li>
                );
              })}
            </ul>

            {organizations.length === 0 && (
              <p className="panel mt-4 py-8 text-center text-[var(--muted)]">
                Belum ada organisasi yang terdaftar.
              </p>
            )}
        </section>
      </main>

      <footer className="bg-[var(--primary)] text-white">
        <div className="page-container flex flex-col gap-4 py-8 text-sm md:flex-row md:items-center md:justify-between">
          <p className="font-bold">
            E-VOTE POLTEKKES JKT1
          </p>
          <div className="flex gap-8 text-emerald-100">
            <span>Kebijakan Privasi</span>
            <span>Kontak Kami</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
