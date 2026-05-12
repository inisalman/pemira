'use client';

import { useState } from 'react';
import Link from 'next/link';

interface NavLink {
  href: string;
  label: string;
  icon: string;
}

interface AdminMobileNavProps {
  links: NavLink[];
}

export function AdminMobileNav({ links }: AdminMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-menu"
        aria-label="Menu navigasi"
        className="btn-secondary min-w-[44px] p-2"
      >
        {isOpen ? (
          <span className="geo-close" aria-hidden="true" />
        ) : (
          <span className="geo-menu" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <nav
          id="mobile-nav-menu"
          aria-label="Mobile admin navigation"
          className="absolute left-0 right-0 top-full z-40 border-b border-[var(--border)] bg-white shadow-lg"
        >
          <ul className="divide-y divide-slate-100 px-4 py-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex min-h-[44px] items-center gap-3 px-2 py-3 text-base font-bold text-[var(--muted)] hover:text-[var(--primary)] focus:outline-none"
                >
                  <span
                    className={`geo-icon geo-icon-${link.icon} h-8 w-8 shadow-[2px_2px_0_var(--shadow-hard)]`}
                    aria-hidden="true"
                  />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
