import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import LogoutButton from '@/components/LogoutButton';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="page-container flex h-20 items-center justify-between">
          <a href="/dashboard" className="brand-text">
            E-VOTE POLTEKKES JKT1
          </a>
          <nav className="hidden items-center gap-10 md:flex" aria-label="Navigasi pemilih">
            <a href="/dashboard" className="nav-link nav-link-active">Beranda</a>
            <a href="/#panduan" className="nav-link">Panduan</a>
            <a href="/#statistik" className="nav-link">Statistik</a>
          </nav>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--secondary)] text-sm font-black text-white">
              {session.user.name?.slice(0, 2).toUpperCase() ?? 'JD'}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main id="main-content" className="page-container py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
