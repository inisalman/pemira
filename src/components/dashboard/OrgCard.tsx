'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface OrgCardProps {
  organization: {
    id: string;
    name: string;
    logo?: string;
  };
  hasVoted: boolean;
}

export function OrgCard({ organization, hasVoted }: OrgCardProps) {
  const router = useRouter();

  function handleClick() {
    if (!hasVoted) {
      router.push(`/dashboard/vote/${organization.id}`);
    }
  }

  return (
    <article
      className={`panel overflow-hidden transition-all ${
        hasVoted ? 'border-[var(--secondary)]' : 'hover:-translate-y-1 hover:border-[var(--primary)]'
      }`}
    >
      <div className="relative h-40 w-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)]">
        {organization.logo ? (
          <Image
            src={organization.logo}
            alt={`Logo ${organization.name}`}
            fill
            className="object-contain p-4"
            unoptimized
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-5xl font-black text-white/30">
            {organization.name.slice(0, 3).toUpperCase()}
          </div>
        )}
      </div>
      <div className="p-7">
        <div className="flex items-start justify-between gap-4">
        <h3 className="text-3xl font-black leading-tight text-[var(--ink)]">
          {organization.name}
        </h3>
        <span
          className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${
            hasVoted
              ? 'bg-[var(--primary)] text-white'
              : 'bg-[var(--ink)] text-white'
          }`}
        >
          <span
            className={`geo-icon ${hasVoted ? 'geo-icon-check' : 'geo-icon-dot'} h-7 w-7 border-white bg-white text-[var(--primary)] shadow-none`}
            aria-hidden="true"
          />
          {hasVoted ? 'Sudah Memilih' : 'Belum Memilih'}
        </span>
        </div>
        <p className="mt-7 min-h-[56px] text-lg leading-7 text-[var(--muted)]">
          {hasVoted
            ? `Suara Anda telah direkam untuk pemilihan ${organization.name}.`
            : `Pilih Ketua dan Wakil Ketua ${organization.name} Poltekkes Kemenkes Jakarta 1.`}
        </p>

        <button
          type="button"
          onClick={handleClick}
          disabled={hasVoted}
          aria-label={
            hasVoted
              ? `${organization.name} - sudah memilih`
              : `Masuk bilik suara ${organization.name}`
          }
          className={`mt-6 w-full rounded-full border-2 border-[var(--shadow-hard)] px-5 py-4 text-base font-bold shadow-[4px_4px_0_var(--shadow-hard)] transition ${
            hasVoted
              ? 'cursor-not-allowed bg-white text-slate-400'
              : 'bg-[var(--ink)] text-white hover:bg-[var(--primary)]'
          }`}
        >
          {hasVoted ? 'Sudah Memilih' : 'Masuk Bilik Suara'}
        </button>
      </div>
    </article>
  );
}
