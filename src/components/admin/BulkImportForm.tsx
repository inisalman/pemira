'use client';

import { useState, useRef } from 'react';
import type { ImportResult } from '@/types';

type ImportState = 'idle' | 'uploading' | 'done';

export default function BulkImportForm() {
  const [state, setState] = useState<ImportState>('idle');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError('Pilih file CSV atau Excel terlebih dahulu');
      return;
    }

    setState('uploading');
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Terjadi kesalahan saat mengimpor');
        setState('idle');
        return;
      }

      const data: ImportResult = await response.json();
      setResult(data);
      setState('done');
    } catch {
      setError('Terjadi kesalahan jaringan');
      setState('idle');
    }
  }

  function handleReset() {
    setState('idle');
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <div className="panel p-6">
      <h3 className="mb-4 text-lg font-extrabold text-[var(--primary)]">
        Import User Bulk
      </h3>
      <p className="mb-4 text-sm text-[var(--muted)]">
        Upload file CSV atau Excel (.xlsx) dengan kolom: nim, name, department, password, role, organizations.
        Role boleh ADMIN atau VOTER. Untuk VOTER, isi organizations dengan nama organisasi,
        misalnya BEM atau &quot;BEM,MPM&quot;.
      </p>
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <a className="btn-secondary" href="/templates/user-import-template.csv" download>
          Download Template CSV
        </a>
        <a className="btn-secondary" href="/templates/user-import-template.xlsx" download>
          Download Template Excel
        </a>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="csv-file"
            className="block text-sm font-bold text-[var(--primary)]"
          >
            File CSV / Excel
          </label>
          <input
            id="csv-file"
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx"
            disabled={state === 'uploading'}
            className="mt-1 block w-full text-sm text-[var(--muted)] file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--surface-muted)] file:px-4 file:py-2 file:text-sm file:font-bold file:text-[var(--primary)] hover:file:bg-emerald-50 disabled:opacity-50"
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={state === 'uploading'}
            className="btn-primary disabled:opacity-50"
          >
            {state === 'uploading' ? 'Mengimpor...' : 'Import'}
          </button>
          {state === 'done' && (
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary"
            >
              Import Lagi
            </button>
          )}
        </div>
      </form>

      {state === 'uploading' && (
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span className="text-sm text-gray-600">
              Memproses file...
            </span>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-4">
          {/* Results Summary */}
          <div className="rounded-md bg-gray-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-gray-900">
              Hasil Import
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Total Baris</p>
                <p className="text-lg font-bold text-gray-900">
                  {result.totalRows}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Berhasil</p>
                <p className="text-lg font-bold text-green-600">
                  {result.successCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Gagal</p>
                <p className="text-lg font-bold text-red-600">
                  {result.failedRows.length}
                </p>
              </div>
            </div>
          </div>

          {/* Failed Rows Table */}
          {result.failedRows.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-gray-900">
                Baris Gagal
              </h4>
              <div className="overflow-x-auto rounded-md border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                        Baris
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                        NIM
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                        Alasan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {result.failedRows.map((row) => (
                      <tr key={`${row.row}-${row.nim}`}>
                        <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-900">
                          {row.row}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-900">
                          {row.nim || '-'}
                        </td>
                        <td className="px-4 py-2 text-sm text-red-600">
                          {row.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
