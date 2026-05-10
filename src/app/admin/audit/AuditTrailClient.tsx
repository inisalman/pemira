'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuditEntryData {
  id: string;
  actorId: string;
  actionType: string;
  details: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface Props {
  entries: AuditEntryData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  currentActionType: string;
  currentActor: string;
  currentStartDate: string;
  currentEndDate: string;
}

const ACTION_TYPE_OPTIONS = [
  { value: '', label: 'Semua Aksi' },
  { value: 'USER_LOGIN', label: 'Login' },
  { value: 'USER_LOGOUT', label: 'Logout' },
  { value: 'VOTE_CAST', label: 'Vote Cast' },
  { value: 'USER_CREATED', label: 'User Created' },
  { value: 'USER_DELETED', label: 'User Deleted' },
  { value: 'USER_UPDATED', label: 'User Updated' },
  { value: 'CANDIDATE_CREATED', label: 'Candidate Created' },
  { value: 'CANDIDATE_DELETED', label: 'Candidate Deleted' },
  { value: 'CANDIDATE_UPDATED', label: 'Candidate Updated' },
  { value: 'BULK_IMPORT', label: 'Bulk Import' },
];

function getActionTypeBadgeColor(actionType: string): string {
  switch (actionType) {
    case 'USER_LOGIN':
    case 'USER_LOGOUT':
      return 'bg-blue-100 text-blue-800';
    case 'VOTE_CAST':
      return 'bg-green-100 text-green-800';
    case 'USER_CREATED':
    case 'CANDIDATE_CREATED':
      return 'bg-emerald-100 text-emerald-800';
    case 'USER_DELETED':
    case 'CANDIDATE_DELETED':
      return 'bg-red-100 text-red-800';
    case 'USER_UPDATED':
    case 'CANDIDATE_UPDATED':
      return 'bg-yellow-100 text-yellow-800';
    case 'BULK_IMPORT':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function formatActionType(actionType: string): string {
  const option = ACTION_TYPE_OPTIONS.find((o) => o.value === actionType);
  return option ? option.label : actionType;
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function AuditTrailClient({
  entries,
  total,
  page,
  pageSize,
  totalPages,
  currentActionType,
  currentActor,
  currentStartDate,
  currentEndDate,
}: Props) {
  const router = useRouter();

  const [actionType, setActionType] = useState(currentActionType);
  const [actor, setActor] = useState(currentActor);
  const [startDate, setStartDate] = useState(currentStartDate);
  const [endDate, setEndDate] = useState(currentEndDate);

  function buildUrl(overrides?: { page?: number }) {
    const params = new URLSearchParams();
    if (actionType) params.set('actionType', actionType);
    if (actor) params.set('actor', actor);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const p = overrides?.page ?? 1;
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return `/admin/audit${qs ? `?${qs}` : ''}`;
  }

  function handleFilter() {
    router.push(buildUrl({ page: 1 }));
  }

  function handleReset() {
    setActionType('');
    setActor('');
    setStartDate('');
    setEndDate('');
    router.push('/admin/audit');
  }

  function handlePageChange(newPage: number) {
    router.push(buildUrl({ page: newPage }));
  }

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="filter-action-type"
              className="block text-xs font-medium text-gray-600"
            >
              Tipe Aksi
            </label>
            <select
              id="filter-action-type"
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {ACTION_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-actor"
              className="block text-xs font-medium text-gray-600"
            >
              Actor (User ID)
            </label>
            <input
              id="filter-actor"
              type="text"
              placeholder="Masukkan User ID..."
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="filter-start-date"
              className="block text-xs font-medium text-gray-600"
            >
              Dari Tanggal
            </label>
            <input
              id="filter-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="filter-end-date"
              className="block text-xs font-medium text-gray-600"
            >
              Sampai Tanggal
            </label>
            <input
              id="filter-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={handleFilter}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Filter
          </button>
          <button
            onClick={handleReset}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Menampilkan {entries.length > 0 ? (page - 1) * pageSize + 1 : 0}–
        {Math.min(page * pageSize, total)} dari {total} entri
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Waktu
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tipe Aksi
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Detail
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    Tidak ada entri audit ditemukan.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {formatTimestamp(entry.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-gray-700">
                      <span title={entry.actorId}>
                        {entry.actorId.length > 12
                          ? `${entry.actorId.slice(0, 12)}...`
                          : entry.actorId}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getActionTypeBadgeColor(entry.actionType)}`}
                      >
                        {formatActionType(entry.actionType)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="line-clamp-2">{entry.details}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
            <div className="text-sm text-gray-500">
              Halaman {page} dari {totalPages}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - page) <= 1
                )
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-1 text-gray-400">...</span>
                    )}
                    <button
                      onClick={() => handlePageChange(p)}
                      className={`rounded-md border px-3 py-1 text-sm ${
                        p === page
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
