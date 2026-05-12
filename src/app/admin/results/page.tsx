'use client';

import { useEffect, useState } from 'react';
import { useVoteCountStore } from '@/stores/vote-count.store';
import RealTimeVoteChart from '@/components/admin/RealTimeVoteChart';
import { resetVotesAction } from './actions';

export default function AdminResultsPage() {
  const { voteCounts, isConnected, connect, disconnect } =
    useVoteCountStore();
  const [isVisible, setIsVisible] = useState(true);
  const [exportOrgId, setExportOrgId] = useState('');
  const [resetTarget, setResetTarget] = useState<'all' | 'selected'>('selected');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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
  const selectedOrg = voteCounts.find((org) => org.orgId === exportOrgId);
  const resetLabel =
    resetTarget === 'all'
      ? 'semua organisasi'
      : selectedOrg?.orgName || 'organisasi terpilih';
  const selectedOrgHasVotes = (selectedOrg?.totalVoted ?? 0) > 0;

  async function handleResetVotes() {
    setResetError('');
    setResetSuccess('');

    if (resetTarget === 'selected' && !exportOrgId) {
      setResetError('Pilih organisasi terlebih dahulu.');
      return;
    }

    setIsResetting(true);
    const result = await resetVotesAction(
      resetTarget === 'selected' ? exportOrgId : undefined
    );
    setIsResetting(false);

    if (result.success) {
      setShowResetConfirm(false);
      setResetSuccess(`${result.count} suara berhasil direset.`);
      disconnect();
      connect();
    } else {
      setResetError(result.error || 'Gagal reset suara.');
    }
  }

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
        <div className="flex flex-col gap-3 sm:items-end">
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
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={() => setIsVisible(!isVisible)}
              className="btn-secondary gap-2"
            >
              <span className="geo-mini geo-mini-results" aria-hidden="true" />
              {isVisible ? 'Sembunyikan Hasil' : 'Tampilkan Hasil'}
            </button>
            <a
              href="/api/admin/results/export"
              className="btn-primary gap-2"
            >
              <span className="geo-mini geo-mini-plus" aria-hidden="true" />
              Export Excel Semua
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <label htmlFor="export-org" className="sr-only">
              Pilih organisasi untuk export
            </label>
            <select
              id="export-org"
              value={exportOrgId}
              onChange={(event) => setExportOrgId(event.target.value)}
              className="field w-full sm:w-72"
            >
              <option value="">Pilih organisasi</option>
              {voteCounts.map((org) => (
                <option key={org.orgId} value={org.orgId}>
                  {org.orgName}
                </option>
              ))}
            </select>
            <a
              href={
                exportOrgId
                  ? `/api/admin/results/export?organizationId=${encodeURIComponent(exportOrgId)}`
                  : '#'
              }
              aria-disabled={!exportOrgId}
              onClick={(event) => {
                if (!exportOrgId) event.preventDefault();
              }}
              className={`btn-secondary ${!exportOrgId ? 'pointer-events-none opacity-50' : ''}`}
            >
              Export Excel Organisasi
            </a>
          </div>
          <div className="panel w-full max-w-md p-4">
            <p className="text-sm font-extrabold text-[var(--ink)]">
              Reset Suara
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setResetTarget('selected');
                  setResetError('');
                  setResetSuccess('');
                  setShowResetConfirm(true);
                }}
                disabled={!exportOrgId || !selectedOrgHasVotes}
                className="btn-secondary gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="geo-mini geo-mini-results" aria-hidden="true" />
                Reset Organisasi
              </button>
              <button
                type="button"
                onClick={() => {
                  setResetTarget('all');
                  setResetError('');
                  setResetSuccess('');
                  setShowResetConfirm(true);
                }}
                disabled={totalVotedAll === 0}
                className="btn-secondary gap-2 border-red-700 text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="geo-mini geo-mini-delete" aria-hidden="true" />
                Reset Semua
              </button>
            </div>
            {resetError && (
              <p className="mt-3 text-sm font-bold text-red-700" role="alert">
                {resetError}
              </p>
            )}
            {resetSuccess && (
              <p className="mt-3 text-sm font-bold text-[var(--success)]">
                {resetSuccess}
              </p>
            )}
          </div>
          <p className="max-w-md text-right text-xs leading-5 text-[var(--muted)]">
            Export berisi ringkasan, perolehan kandidat, dan daftar pemilih
            yang sudah atau belum memilih tanpa membuka pilihan kandidat per pemilih.
          </p>
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

      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-votes-title"
        >
          <div className="panel w-full max-w-md bg-white p-6">
            <h3
              id="reset-votes-title"
              className="text-xl font-black text-[var(--ink)]"
            >
              Reset suara {resetLabel}?
            </h3>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Tindakan ini akan menghapus suara yang sudah masuk. Pemilih yang
              suaranya direset bisa memilih kembali.
            </p>
            {resetError && (
              <p className="mt-4 text-sm font-bold text-red-700" role="alert">
                {resetError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
                className="btn-secondary"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetVotes}
                disabled={isResetting}
                className="btn-primary bg-red-700 disabled:opacity-50"
              >
                {isResetting ? 'Mereset...' : 'Ya, Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
