import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSiteSetting } from "@/lib/site-settings";
import { BrandLogo } from "@/components/BrandLogo";

export const dynamic = "force-dynamic";

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
  const siteLogo = await getSiteSetting('site_logo');
  const totalVotes = organizations.reduce((sum, org) => sum + org.voteCount, 0);
  const totalPemilih = 4520;
  const votePercent =
    totalPemilih > 0 ? Math.round((totalVotes / totalPemilih) * 1000) / 10 : 0;

  return (
    <div className="app-shell flex flex-col">
      <header className="top-nav">
        <div className="page-container flex h-16 items-center justify-between">
          <BrandLogo href="/" logoUrl={siteLogo} />
          <div aria-hidden="true" className="hidden md:block" />
          <Link href="/login" className="btn-primary min-w-[92px]">
            Login
          </Link>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        <section id="beranda" className="hero-green">
          <div className="page-container relative z-10 grid min-h-[610px] items-center gap-10 py-16 lg:grid-cols-[0.86fr_1fr]">
            <div className="max-w-xl">
              <span className="inline-flex items-center rounded-full border-2 border-[var(--primary-dark)] bg-[var(--accent)] px-4 py-1 text-xs font-black uppercase text-[var(--primary-dark)]">
                Pemilihan Raya Mahasiswa Poltekkes Jakarta 1 | 2026
              </span>
              <h1 className="mt-7 text-5xl font-black leading-[1.02] text-[var(--ink)] sm:text-6xl">
                Suarakan Aspirasimu untuk{" "}
                <span className="text-[var(--primary)] underline decoration-[var(--accent-lime)] decoration-8 underline-offset-4">
                  Perubahan Nyata
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-[var(--muted)]">
                Wujudkan demokrasi kampus yang transparan dan berintegritas.
                Pilih pemimpin masa depan Poltekkes Kemenkes Jakarta 1 hari ini.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link href="/login" className="btn-primary sm:min-w-[190px]">
                  Mulai Memilih
                </Link>
                <a href="#panduan" className="btn-secondary sm:min-w-[190px]">
                  Lihat Kandidat
                </a>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[690px]">
              <div className="hero-visual" />
              <div className="mt-5 flex items-center justify-between gap-3 rounded-lg border-2 border-[var(--shadow-hard)] bg-white px-5 py-4 shadow-[6px_6px_0_var(--shadow-hard)]">
                <p className="text-xs font-black uppercase text-[var(--primary)]">
                  Lokasi Terkini
                </p>
                <p className="text-base font-extrabold text-[var(--ink)]">
                  Kampus Poltekkes Jakarta 1, Jl. Wijaya Kusuma No.47-48
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="statistik" className="py-14">
          <div className="page-container grid gap-6 md:grid-cols-3">
            {[
              ["01", "Organisasi", organizations.length || 12, "Hima/UKM"],
              [
                "02",
                "Total Pemilih",
                totalPemilih.toLocaleString("id-ID"),
                "Mahasiswa",
              ],
              ["03", "Suara Masuk", votePercent || 82.4, "%"],
            ].map(([icon, label, value, suffix]) => (
              <div key={label} className="stat-card">
                <span className="icon-tile">{icon}</span>
                <div>
                  <p className="text-sm text-[var(--ink)]">{label}</p>
                  <p className="mt-1 text-3xl font-black text-[var(--primary)]">
                    {value}{" "}
                    <span className="text-sm font-medium tracking-normal text-[var(--ink)]">
                      {suffix}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="panduan" className="page-container py-20">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-black text-[var(--ink)]">
              Bagaimana Cara Memilih?
            </h2>
            <p className="mt-4 text-[var(--muted)]">
              Ikuti langkah mudah berikut untuk menggunakan hak suaramu.
            </p>
          </div>

          <div className="mt-14 grid gap-7 md:grid-cols-3">
            {[
              [
                "1",
                "Verifikasi",
                "Login menggunakan NIM dan Password Portal Mahasiswa Anda.",
              ],
              [
                "2",
                "Kenali",
                "Baca visi, misi, dan program kerja dari setiap pasangan calon.",
              ],
              [
                "3",
                "Pilih",
                "Klik tombol pilih pada kandidat favoritmu dan konfirmasi pilihan.",
              ],
            ].map(([step, title, body]) => (
              <div
                key={step}
                className="panel relative min-h-[220px] p-7 text-center"
              >
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-lg border-2 border-[var(--shadow-hard)] bg-white text-xl font-black text-[var(--primary)] shadow-[4px_4px_0_var(--accent)]">
                  {step}
                </span>
                <h3 className="mt-7 text-xl font-bold text-[var(--ink)]">
                  {title}
                </h3>
                <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                  {body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 rounded-lg border-2 border-[var(--shadow-hard)] bg-[var(--secondary)] px-6 py-12 text-center shadow-[8px_8px_0_var(--shadow-hard)]">
            <h2 className="text-4xl font-black text-[var(--primary-dark)]">
              Siap Memilih Sekarang?
            </h2>
            <Link
              href="/login"
              className="btn-secondary mt-6 min-w-[240px] bg-white"
            >
              Ayo Berikan Suaramu
            </Link>
          </div>
        </section>

        <section aria-labelledby="org-heading" className="hidden">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="org-heading"
                className="text-2xl font-extrabold text-[var(--primary)]"
              >
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

      <footer className="border-t-2 border-[var(--border)] bg-[var(--accent-blue)] text-[var(--ink)]">
        <div className="page-container flex flex-col gap-4 py-8 text-sm md:flex-row md:items-center md:justify-between">
          <p className="font-black text-[var(--primary)]">PEMIRA 2026</p>
          <div className="flex gap-8 font-bold">
            <Link href="/login">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
