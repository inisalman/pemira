"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
        <p className="text-3xl font-black leading-none text-[var(--primary)]">
          Admin Portal
        </p>
        <p className="mt-1 text-sm font-bold text-[var(--muted)]">
          PEMIRA 2026
        </p>
      </div>

      <div className="mt-14 flex items-center gap-4 rounded-lg border-2 border-[var(--shadow-hard)] bg-white p-4 shadow-[5px_5px_0_var(--shadow-hard)]">
        <div className="grid h-14 w-14 place-items-center rounded-lg border-2 border-[var(--shadow-hard)] bg-[var(--accent)] text-lg font-black text-[var(--primary-dark)]">
          {userName?.slice(0, 2).toUpperCase() ?? "AD"}
        </div>
        <div>
          <p className="font-bold text-[var(--ink)]">
            {userName ?? "Administrator"}
          </p>
          <p className="text-sm text-[var(--muted)]">Super Admin</p>
        </div>
      </div>

      <nav className="mt-12 space-y-3" aria-label="Admin navigation">
        {links.map((link) => {
          const isActive =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`admin-nav-item ${isActive ? "admin-nav-item-active" : ""}`}
            >
              <span
                className={`geo-icon geo-icon-${link.icon}`}
                aria-hidden="true"
              />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <button className="mt-auto flex min-h-[60px] items-center justify-center gap-3 rounded-full border-2 border-[var(--shadow-hard)] bg-[var(--primary)] px-5 text-base font-bold text-white shadow-[5px_5px_0_var(--shadow-hard)]">
        <span className="geo-mini geo-mini-plus" aria-hidden="true" />
        Export Data
      </button>
    </aside>
  );
}
