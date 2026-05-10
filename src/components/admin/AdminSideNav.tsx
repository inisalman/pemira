'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLink {
  href: string;
  label: string;
  icon: string;
}

interface AdminSideNavProps {
  links: NavLink[];
  userName: string | null | undefined;
}

export function AdminSideNav({ links, userName }: AdminSideNavProps) {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar fixed inset-y-0 left-0 hidden w-80 flex-col px-6 py-7 lg:flex">
      <div>
        <p className="text-3xl font-black leading-none tracking-[-0.06em] text-[var(--primary)]">
          E-VOTE
        </p>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.28em] text-[var(--muted)]">
          Poltekkes JKT 1
        </p>
      </div>

      <div className="mt-14 flex items-center gap-4 rounded-xl border border-[#d7deee] bg-[#e7ebff] p-4">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-[var(--primary)] text-lg font-black text-white">
          {userName?.slice(0, 2).toUpperCase() ?? 'AD'}
        </div>
        <div>
          <p className="font-bold text-[var(--ink)]">{userName ?? 'Administrator'}</p>
          <p className="text-sm text-[var(--muted)]">Super Admin</p>
        </div>
      </div>

      <nav className="mt-12 space-y-3" aria-label="Admin navigation">
        {links.map((link) => {
          const isActive =
            link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`admin-nav-item ${isActive ? 'admin-nav-item-active' : ''}`}
            >
              <span className="w-7 text-center text-xl">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      <button className="mt-auto flex min-h-[60px] items-center justify-center gap-3 rounded-lg bg-[var(--ink)] px-5 text-base font-bold text-white shadow-xl shadow-slate-300">
        ⇧ Export Data
      </button>
    </aside>
  );
}
