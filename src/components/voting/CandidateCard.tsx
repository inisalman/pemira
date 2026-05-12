'use client';

import Image from 'next/image';

interface CandidateCardProps {
  candidate: {
    id: string;
    nameKetua: string;
    nameWakil: string;
    vision: string;
    mission: string;
    photo: string;
    photoWakil: string;
  };
  number: number;
  isSelected: boolean;
  onSelect: (candidateId: string) => void;
}

export function CandidateCard({ candidate, number, isSelected, onSelect }: CandidateCardProps) {
  const accentClass = number % 2 === 0 ? 'bg-[var(--accent-purple)]' : 'bg-[var(--primary)]';
  const photoAccentClass = number % 2 === 0 ? 'border-[var(--accent-purple)]' : 'border-[var(--primary)]';

  return (
    <article
      className={`relative overflow-hidden rounded-lg border-2 bg-white p-7 shadow-[8px_8px_0_var(--shadow-hard)] transition-all ${
        isSelected
          ? 'border-[var(--secondary)]'
          : 'border-[var(--shadow-hard)] hover:-translate-y-1 hover:shadow-[10px_10px_0_var(--shadow-hard)]'
      }`}
    >
      <div className="pointer-events-none absolute right-8 top-6 text-8xl font-black leading-none text-[var(--surface-muted)]">
        {String(number).padStart(2, '0')}
      </div>

      <div className="relative z-10 inline-flex rounded-full border-2 border-[var(--shadow-hard)] bg-[var(--secondary)] px-4 py-1 text-sm font-black uppercase text-[var(--primary-dark)]">
        Paslon No. {String(number).padStart(2, '0')}
      </div>

      <div className="relative z-10 mt-6 grid gap-4 sm:grid-cols-2">
        <div className={`relative aspect-[3/4] -rotate-2 overflow-hidden rounded-lg border-4 ${photoAccentClass} bg-slate-100 shadow-[5px_5px_0_var(--shadow-hard)]`}>
          {candidate.photo ? (
            <Image
              src={candidate.photo}
              alt={`Foto ${candidate.nameKetua}`}
              fill
              sizes="(max-width: 640px) 100vw, 25vw"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="grid h-full place-items-center bg-gradient-to-br from-slate-800 to-slate-400 text-5xl text-white">
              {candidate.nameKetua.slice(0, 1)}
            </div>
          )}
        </div>
        <div className={`relative aspect-[3/4] rotate-2 overflow-hidden rounded-lg border-4 ${photoAccentClass} bg-slate-100 shadow-[5px_5px_0_var(--shadow-hard)]`}>
          {candidate.photoWakil ? (
            <Image
              src={candidate.photoWakil}
              alt={`Foto ${candidate.nameWakil}`}
              fill
              sizes="(max-width: 640px) 100vw, 25vw"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="grid h-full place-items-center bg-gradient-to-br from-slate-100 to-slate-300 text-5xl font-black text-[var(--primary)]">
              {candidate.nameWakil.slice(0, 1)}
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 mt-8">
        <h3 className="text-3xl font-black leading-tight text-[var(--ink)]">
          {candidate.nameKetua} &amp; {candidate.nameWakil}
        </h3>
        <p className="mt-4 text-lg italic leading-7 text-[var(--muted)]">
          &quot;{candidate.vision}&quot;
        </p>
      </div>

      <div className="relative z-10 mt-8 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          className="rounded-lg border-2 border-[var(--shadow-hard)] bg-white px-5 py-4 text-sm font-bold text-[var(--ink)] shadow-[4px_4px_0_var(--shadow-hard)]"
        >
          Lihat Visi-Misi
        </button>
        <button
          type="button"
          onClick={() => onSelect(candidate.id)}
          aria-label={`Pilih pasangan ${candidate.nameKetua} dan ${candidate.nameWakil}`}
          aria-pressed={isSelected}
          className={`rounded-lg border-2 border-[var(--shadow-hard)] px-5 py-4 text-sm font-bold text-white shadow-[4px_4px_0_var(--shadow-hard)] ${accentClass}`}
        >
          Pilih Paslon
        </button>
      </div>

      {isSelected && (
        <span className="absolute right-4 top-4 badge badge-teal">Dipilih</span>
      )}
    </article>
  );
}
