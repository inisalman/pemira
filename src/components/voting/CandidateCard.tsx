'use client';

interface CandidateCardProps {
  candidate: {
    id: string;
    nameKetua: string;
    nameWakil: string;
    vision: string;
    mission: string;
    photo: string;
  };
  number: number;
  isSelected: boolean;
  onSelect: (candidateId: string) => void;
}

export function CandidateCard({ candidate, number, isSelected, onSelect }: CandidateCardProps) {
  return (
    <article
      className={`relative rounded-lg border bg-white p-8 shadow-sm transition-all ${
        isSelected
          ? 'border-[var(--secondary)]'
          : 'border-[var(--border)] bg-white hover:border-[var(--secondary)]'
      }`}
    >
      <div className="absolute left-0 top-0 grid h-16 w-24 place-items-center rounded-br-lg bg-[var(--primary)] text-3xl font-black text-white">
        {String(number).padStart(2, '0')}
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <div className="aspect-[3/4] overflow-hidden rounded-md border border-[var(--border)] bg-slate-100">
          {candidate.photo ? (
            <img
              src={candidate.photo}
              alt={`Foto ${candidate.nameKetua}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center bg-gradient-to-br from-slate-800 to-slate-400 text-5xl text-white">
              {candidate.nameKetua.slice(0, 1)}
            </div>
          )}
        </div>
        <div className="aspect-[3/4] overflow-hidden rounded-md border border-[var(--border)] bg-slate-100">
          <div className="grid h-full place-items-center bg-gradient-to-br from-slate-100 to-slate-300 text-5xl font-black text-[var(--primary)]">
            {candidate.nameWakil.slice(0, 1)}
          </div>
        </div>
      </div>

      <div className="mt-8 border-l-4 border-[var(--secondary)] pl-6">
        <h3 className="text-3xl font-black tracking-[-0.05em] text-[var(--primary)]">
          {candidate.nameKetua}
        </h3>
        <p className="mt-1 text-sm font-medium text-[var(--ink)]">
          Calon Ketua
        </p>
        <h3 className="mt-5 text-3xl font-black tracking-[-0.05em] text-[var(--primary)]">
          {candidate.nameWakil}
        </h3>
        <p className="mt-1 text-sm font-medium text-[var(--ink)]">
          Calon Wakil Ketua
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          className="rounded-md border-2 border-[var(--primary)] px-5 py-4 text-sm font-bold text-[var(--primary)]"
        >
          ⊙ Lihat Visi-Misi
        </button>
        <button
          type="button"
          onClick={() => onSelect(candidate.id)}
          aria-label={`Pilih pasangan ${candidate.nameKetua} dan ${candidate.nameWakil}`}
          aria-pressed={isSelected}
          className="rounded-md bg-[var(--primary)] px-5 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-900/10"
        >
          ♢ Pilih Paslon {String(number).padStart(2, '0')}
        </button>
      </div>

      {isSelected && (
        <span className="absolute right-4 top-4 badge badge-teal">Dipilih</span>
      )}
    </article>
  );
}
