import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import LogoutButton from '@/components/LogoutButton';
import { DashboardNav } from '@/components/DashboardNav';

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
          <Link href="/dashboard" className="brand-text">
            Poltekkes Jakarta 1
          </Link>
          <DashboardNav />
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg border-2 border-[var(--shadow-hard)] bg-[var(--secondary)] text-sm font-black text-[var(--primary-dark)] shadow-[3px_3px_0_var(--shadow-hard)]">
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
