import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSiteSetting } from "@/lib/site-settings";
import { BrandLogo } from "@/components/BrandLogo";

export const dynamic = "force-dynamic";

type OrganizationSummary = {
  id: string;
  name: string;
  voteCount: number;
};

type OrganizationRow = {
  id: string;
  name: string;
  votes: { id: string }[];
};

async function getOrganizations(): Promise<OrganizationSummary[]> {
  const organizations = await prisma.organization.findMany({
    include: {
      votes: { select: { id: true } },
    },
    orderBy: { name: "asc" },
  });

  return organizations.map((org: OrganizationRow) => ({
    id: org.id,
    name: org.name,
    voteCount: org.votes.length,
  }));
}

const defaultLkmItems = [
  "Hima Jurusan Keperawatan",
  "Hima Jurusan Kebidanan",
  "Hima Jurusan Kesehatan Gigi",
  "Hima Jurusan Ortotik Prostetik",
  "Badan Eksekutif Mahasiswa",
  "Majelis Permusyawaratan Mahasiswa",
];

const electionRules = [
  "Ketentuan Umum",
  "Hak dan Kewajiban Pemilih",
  "Persyaratan Pemilih",
  "Tata Cara Pelaksanaan Pemungutan Suara",
  "Larangan Dalam Pelaksanaan E-Voting",
  "Pengawasan dan Keamanan",
  "Mekanisme Pelaporan Pelanggaran",
  "Penutupan Pemungutan Suara dan Pengumuman Hasil",
  "Sanksi",
];

export default async function LandingPage() {
  const organizations = await getOrganizations();
  const siteLogo = await getSiteSetting("site_logo");
  const lkmItems =
    organizations.length > 0
      ? organizations.map((org) => org.name)
      : defaultLkmItems;
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
                Pesta Demokrasi Kampus
              </span>
              <h1 className="mt-7 text-5xl font-black leading-[1.02] text-[var(--ink)] sm:text-6xl">
                Pemilihan Raya{" "}
                <span className="text-[var(--primary)] underline decoration-[var(--accent-lime)] decoration-8 underline-offset-4">
                  2026
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-[var(--muted)]">
                Pemira dilaksanakan di Politeknik Kesehatan Kementerian
                Kesehatan Jakarta 1 tiap periode kepengurusan satu tahun
                sekali, sebagai ajang pemilihan perangkat lembaga
                kemahasiswaan.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link href="/login" className="btn-primary sm:min-w-[190px]">
                  Mulai Memilih
                </Link>
                <a href="#panduan" className="btn-secondary sm:min-w-[190px]">
                  Tata Tertib
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
                  Jl. Wijaya Kusuma Raya No. 47-48, Cilandak, Jakarta Selatan
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="statistik" className="py-14">
          <div className="page-container grid gap-6 md:grid-cols-3">
            {[
              ["01", "Pemilihan LKM", lkmItems.length, "Organisasi"],
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

        <section id="pemilihan-lkm" className="page-container py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black text-[var(--ink)]">
              Daftar Pemilihan LKM
            </h2>
            <p className="mt-4 text-[var(--muted)]">
              Pilih organisasi kemahasiswaan sesuai dengan jurusan dan hak
              pilihmu.
            </p>
          </div>

          <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lkmItems.map((name) => (
              <li key={name} className="panel p-6">
                <span className="badge badge-teal">LKM</span>
                <h3 className="mt-5 text-xl font-black text-[var(--primary)]">
                  {name}
                </h3>
                <p className="mt-3 text-sm font-bold text-[var(--ink)]">
                  Pelaksanaan: 10 Desember 2026
                </p>
                <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                  Gunakan hak pilihmu untuk menentukan masa depan {name} periode
                  2026/2027.
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section id="panduan" className="page-container py-20">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-black text-[var(--ink)]">
              Tata Cara Pemilihan
            </h2>
            <p className="mt-4 text-[var(--muted)]">
              Pelajari langkah-langkah untuk menggunakan sistem PEMIRA 2026
              dengan mudah dan aman.
            </p>
          </div>

          <div className="mt-14 grid gap-7 md:grid-cols-3">
            {[
              [
                "1",
                "Verifikasi",
                "Login menggunakan akun pribadi yang telah terdaftar sebagai pemilih.",
              ],
              [
                "2",
                "Pilih LKM",
                "Pilih organisasi kemahasiswaan sesuai jurusan dan hak pilihmu.",
              ],
              [
                "3",
                "Konfirmasi",
                "Baca informasi kandidat, tentukan pilihan, lalu kirim suaramu.",
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

          <div className="mt-16">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-black text-[var(--ink)]">
                Tata Tertib Pemilihan Umum
              </h2>
              <p className="mt-4 text-[var(--muted)]">
                Pahami aturan main untuk mewujudkan demokrasi kampus yang
                jujur dan adil.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {electionRules.map((rule, index) => (
                <div key={rule} className="panel p-5">
                  <span className="icon-tile text-sm">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-5 text-base font-black text-[var(--ink)]">
                    {rule}
                  </h3>
                </div>
              ))}
            </div>
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

        <section id="kontak-panitia" className="page-container pb-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black text-[var(--ink)]">
              Kontak Panitia
            </h2>
            <p className="mt-4 text-[var(--muted)]">
              Hubungi panitia jika Anda memiliki pertanyaan atau membutuhkan
              bantuan terkait Pemilihan Raya 2026.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="panel p-6">
              <span className="badge badge-teal">Instagram</span>
              <h3 className="mt-5 text-lg font-black text-[var(--ink)]">
                Kirim pertanyaan via IG
              </h3>
              <p className="mt-3 text-[var(--primary)] font-extrabold">
                @mpmpoltekkesjakarta1
              </p>
            </div>

            <div className="panel p-6">
              <span className="badge badge-gold">Telepon</span>
              <h3 className="mt-5 text-lg font-black text-[var(--ink)]">
                Hubungi kami langsung
              </h3>
              <p className="mt-3 text-[var(--primary)] font-extrabold">
                (+62)857-8275-6279
              </p>
            </div>

            <div className="panel p-6">
              <span className="badge badge-muted">Alamat</span>
              <h3 className="mt-5 text-lg font-black text-[var(--ink)]">
                Kunjungi kantor panitia
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Politeknik Kesehatan Kementerian Kesehatan Jakarta 1
              </p>
            </div>
          </div>
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
