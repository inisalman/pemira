'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function DashboardNav() {
  const pathname = usePathname();
  const isVotingPage = pathname.startsWith('/dashboard/vote');

  if (isVotingPage) {
    return (
      <nav className="hidden items-center gap-10 md:flex" aria-label="Navigasi pemilih">
        <Link href="/dashboard" className="nav-link flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Pilihan Organisasi
        </Link>
      </nav>
    );
  }

  return (
    <nav className="hidden items-center gap-8 md:flex" aria-label="Navigasi pemilih">
      <Link href="/dashboard" className="nav-link nav-link-active">Beranda</Link>
      <Link href="/#jadwal" className="nav-link">Jadwal</Link>
      <Link href="/#tata-tertib" className="nav-link">Tata Tertib</Link>
      <Link href="/#cara-voting" className="nav-link">Cara Voting</Link>
    </nav>
  );
}
