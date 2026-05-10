'use client';

import { useRouter } from 'next/navigation';

interface OrgCardProps {
  organization: {
    id: string;
    name: string;
  };
  hasVoted: boolean;
}

export function OrgCard({ organization, hasVoted }: OrgCardProps) {
  const router = useRouter();
  const thumbClass = organization.name.toLowerCase().includes('mpm')
    ? 'election-thumb-alt'
    : organization.name.toLowerCase().includes('himpunan')
      ? 'election-thumb-dark'
      : '';

  function handleClick() {
    if (!hasVoted) {
      router.push(`/dashboard/vote/${organization.id}`);
    }
  }

  return (
    <article
      className={`panel overflow-hidden transition-all ${
        hasVoted ? 'border-[var(--secondary)]' : 'hover:border-[var(--primary)]'
      }`}
    >
      <div className={`election-thumb ${thumbClass}`} />
      <div className="p-7">
        <div className="flex items-start justify-between gap-4">
        <h3 className="text-3xl font-black leading-tight tracking-[-0.05em] text-[var(--ink)]">
          {organization.name}
        </h3>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-bold ${
            hasVoted
              ? 'bg-[var(--primary)] text-white'
              : 'bg-[var(--ink)] text-white'
          }`}
        >
          {hasVoted ? '✓ Sudah Memilih' : '⊙ Belum Memilih'}
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
          className={`mt-6 w-full rounded-md px-5 py-4 text-base font-bold transition ${
            hasVoted
              ? 'cursor-not-allowed border border-[var(--border)] text-slate-400'
              : 'bg-[var(--ink)] text-white hover:bg-[var(--primary)]'
          }`}
        >
          {hasVoted ? 'Sudah Memilih' : 'Masuk Bilik Suara'}
        </button>
      </div>
    </article>
  );
}
