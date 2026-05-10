'use client';

import type { VoteCount } from '@/types';

interface RealTimeVoteChartProps {
  orgId: string;
  orgName: string;
  candidates: VoteCount[];
  totalEligible: number;
  totalVoted: number;
  isVisible: boolean;
}

const COLORS = [
  'bg-[var(--primary)]',
  'bg-[var(--secondary)]',
  'bg-[var(--accent)]',
  'bg-slate-500',
  'bg-emerald-600',
  'bg-cyan-700',
  'bg-amber-600',
  'bg-rose-600',
];

export default function RealTimeVoteChart({
  orgName,
  candidates,
  totalEligible,
  totalVoted,
  isVisible,
}: RealTimeVoteChartProps) {
  const participationPercent =
    totalEligible > 0 ? Math.round((totalVoted / totalEligible) * 100) : 0;

  const maxVotes = Math.max(...candidates.map((c) => c.count), 1);

  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-[var(--primary)]">{orgName}</h3>
        <span className="badge badge-muted">
          {totalVoted} / {totalEligible} suara
        </span>
      </div>

      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-[var(--muted)]">Partisipasi</span>
          <span className="font-bold text-[var(--primary)]">
            {participationPercent}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-[var(--secondary)] transition-all duration-500"
            style={{ width: `${participationPercent}%` }}
          />
        </div>
      </div>

      {isVisible ? (
        <div className="space-y-3">
          {candidates.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Belum ada kandidat terdaftar.</p>
          ) : (
            candidates.map((candidate, index) => {
              const votePercent =
                totalVoted > 0
                  ? Math.round((candidate.count / totalVoted) * 100)
                  : 0;
              const barWidth =
                maxVotes > 0
                  ? Math.round((candidate.count / maxVotes) * 100)
                  : 0;
              const colorClass = COLORS[index % COLORS.length];

              return (
                <div key={candidate.candidateId}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-bold text-[var(--primary)]">
                      {candidate.candidateName}
                    </span>
                    <span className="text-[var(--muted)]">
                      {candidate.count} suara ({votePercent}%)
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-100">
                    <div
                      className={`h-3 rounded-full ${colorClass} transition-all duration-500`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-lg bg-[var(--surface-muted)] py-8">
          <p className="text-sm text-[var(--muted)]">
            Hasil disembunyikan. Klik tombol &quot;Tampilkan Hasil&quot; untuk melihat.
          </p>
        </div>
      )}
    </div>
  );
}
