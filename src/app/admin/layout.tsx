import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import { AdminMobileNav } from '@/components/admin/AdminMobileNav';
import { AdminSideNav } from '@/components/admin/AdminSideNav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const navLinks = [
    { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
    { href: '/admin/users', label: 'Manajemen User', icon: 'users' },
    { href: '/admin/candidates', label: 'Kandidat', icon: 'candidates' },
    { href: '/admin/results', label: 'Hasil Suara', icon: 'results' },
    { href: '/admin/audit', label: 'Pengaturan', icon: 'settings' },
  ];

  return (
    <div className="admin-shell lg:grid lg:grid-cols-[20rem_minmax(0,1fr)]">
      <AdminSideNav links={navLinks} userName={session.user.name} />
      <header className="top-nav relative lg:hidden">
        <div className="page-container flex items-center justify-between py-3">
          <div className="flex items-center gap-4 sm:gap-6">
            <h1 className="text-base font-extrabold text-[var(--primary)] sm:text-lg">
              Pemira Admin
            </h1>
            <nav aria-label="Admin navigation" className="hidden items-center gap-1 sm:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex min-h-[44px] items-center rounded-lg px-3 py-2 text-sm font-bold text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--primary)] focus:outline-none"
                >
                  <span
                    className={`geo-icon geo-icon-${link.icon} h-8 w-8 shadow-[2px_2px_0_var(--shadow-hard)]`}
                    aria-hidden="true"
                  />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden text-sm font-medium text-[var(--muted)] sm:inline">
              {session.user.name}
            </span>
            <span className="badge badge-blue hidden sm:inline-flex">
              Admin
            </span>
            <LogoutButton />
            <AdminMobileNav links={navLinks} />
          </div>
        </div>
      </header>
      <main id="main-content" className="min-w-0 px-6 py-8 sm:px-8 lg:col-start-2 lg:px-12 lg:py-14">
        <div className="mx-auto w-full max-w-[1360px]">
          {children}
        </div>
      </main>
    </div>
  );
}
