'use client';

import { useEffect, useState } from 'react';
import { useVoteCountStore } from '@/stores/vote-count.store';
import RealTimeVoteChart from '@/components/admin/RealTimeVoteChart';

export default function AdminResultsPage() {
  const { voteCounts, isConnected, connect, disconnect } =
    useVoteCountStore();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const totalEligibleAll = voteCounts.reduce(
    (sum, org) => sum + org.totalEligible,
    0
  );
  const totalVotedAll = voteCounts.reduce(
    (sum, org) => sum + org.totalVoted,
    0
  );
  const overallParticipation =
    totalEligibleAll > 0
      ? Math.round((totalVotedAll / totalEligibleAll) * 100)
      : 0;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="badge badge-teal">Real-time</p>
          <h2 className="mt-3 text-2xl font-extrabold text-[var(--primary)] sm:text-3xl">
            Hasil Pemilihan Real-Time
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Pantau perolehan suara secara langsung
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`badge gap-1.5 ${
              isConnected
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            {isConnected ? 'Terhubung' : 'Terputus'}
          </span>
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="btn-secondary"
          >
            {isVisible ? 'Sembunyikan Hasil' : 'Tampilkan Hasil'}
          </button>
        </div>
      </div>

      {/* Overall participation stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="panel p-5">
          <p className="text-sm font-bold text-[var(--muted)]">
            Total Pemilih Terdaftar
          </p>
          <p className="mt-1 text-3xl font-extrabold text-[var(--primary)]">
            {totalEligibleAll}
          </p>
        </div>
        <div className="panel p-5">
          <p className="text-sm font-bold text-[var(--muted)]">
            Total Suara Masuk
          </p>
          <p className="mt-1 text-3xl font-extrabold text-[var(--primary)]">
            {totalVotedAll}
          </p>
        </div>
        <div className="panel p-5">
          <p className="text-sm font-bold text-[var(--muted)]">
            Partisipasi Keseluruhan
          </p>
          <p className="mt-1 text-3xl font-extrabold text-[var(--primary)]">
            {overallParticipation}%
          </p>
        </div>
      </div>

      {/* Per-organization charts */}
      {voteCounts.length === 0 ? (
        <div className="panel p-8 text-center">
          <p className="text-[var(--muted)]">
            {isConnected
              ? 'Memuat data hasil pemilihan...'
              : 'Menghubungkan ke server...'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {voteCounts.map((org) => (
            <RealTimeVoteChart
              key={org.orgId}
              orgId={org.orgId}
              orgName={org.orgName}
              candidates={org.candidates}
              totalEligible={org.totalEligible}
              totalVoted={org.totalVoted}
              isVisible={isVisible}
            />
          ))}
        </div>
      )}
    </div>
  );
}
