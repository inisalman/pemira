'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { updateOrganizationLogo, createOrganization } from './actions';

interface Organization {
  id: string;
  name: string;
  logo: string;
}

interface OrganizationManagementClientProps {
  organizations: Organization[];
}

export function OrganizationManagementClient({ organizations }: OrganizationManagementClientProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newOrgName, setNewOrgName] = useState('');
  const [creating, setCreating] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function handleLogoUpload(orgId: string, file: File) {
    setError(null);
    setSuccess(null);
    setUploading(orgId);

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await updateOrganizationLogo(orgId, base64);
      if (result.success) {
        setSuccess('Logo berhasil diupload!');
      } else {
        setError(result.error ?? 'Gagal mengupload logo.');
      }
    } catch {
      setError('Terjadi kesalahan saat mengupload logo.');
    } finally {
      setUploading(null);
    }
  }

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setCreating(true);
    setError(null);
    setSuccess(null);

    const result = await createOrganization(newOrgName.trim());
    if (result.success) {
      setSuccess('Organisasi berhasil dibuat!');
      setNewOrgName('');
    } else {
      setError(result.error ?? 'Gagal membuat organisasi.');
    }
    setCreating(false);
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700" role="status">
          {success}
        </div>
      )}

      {/* Create new organization */}
      <div className="panel mb-8 p-6">
        <h3 className="text-lg font-extrabold text-[var(--primary)]">Tambah Organisasi Baru</h3>
        <form onSubmit={handleCreateOrg} className="mt-4 flex gap-3">
          <input
            type="text"
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
            placeholder="Nama organisasi"
            className="flex-1 rounded-lg border-2 border-[var(--border)] px-4 py-3 text-sm font-medium focus:border-[var(--primary)] focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg border-2 border-[var(--shadow-hard)] bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white shadow-[3px_3px_0_var(--shadow-hard)] hover:bg-[var(--primary-dark)] disabled:opacity-50"
          >
            {creating ? 'Membuat...' : 'Tambah'}
          </button>
        </form>
      </div>

      {/* Organization list */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {organizations.map((org) => (
          <div key={org.id} className="panel p-5">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 border-[var(--border)] bg-slate-100">
                {org.logo ? (
                  <Image
                    src={org.logo}
                    alt={`Logo ${org.name}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-2xl font-black text-[var(--muted)]">
                    {org.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-extrabold text-[var(--primary)]">{org.name}</h4>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {org.logo ? 'Logo sudah diupload' : 'Belum ada logo'}
                </p>
              </div>
            </div>

            <input
              ref={(el) => { fileInputRefs.current[org.id] = el; }}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload(org.id, file);
                e.target.value = '';
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRefs.current[org.id]?.click()}
              disabled={uploading === org.id}
              className="mt-4 w-full rounded-lg border-2 border-[var(--border)] px-4 py-3 text-sm font-bold text-[var(--ink)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-50"
            >
              {uploading === org.id ? 'Mengupload...' : org.logo ? 'Ganti Logo' : 'Upload Logo'}
            </button>
          </div>
        ))}
      </div>

      {organizations.length === 0 && (
        <div className="panel p-8 text-center">
          <p className="text-[var(--muted)]">Belum ada organisasi terdaftar.</p>
        </div>
      )}
    </div>
  );
}
