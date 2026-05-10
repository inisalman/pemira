'use client';

import { useState } from 'react';
import {
  createCandidateAction,
  updateCandidateAction,
  deleteCandidateAction,
} from './actions';

interface CandidateData {
  id: string;
  organizationId: string;
  nameKetua: string;
  nameWakil: string;
  vision: string;
  mission: string;
  photo: string;
  createdAt: string;
  organization: { id: string; name: string };
  _count?: { votes: number };
}

interface Organization {
  id: string;
  name: string;
}

interface GroupedCandidates {
  [orgId: string]: CandidateData[];
}

interface Props {
  groupedCandidates: GroupedCandidates;
  organizations: Organization[];
}

const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_SIZE = 2 * 1024 * 1024;

function readPhotoAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Gagal membaca file foto'));
    reader.readAsDataURL(file);
  });
}

async function preparePhotoUpload(file: File) {
  if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
    throw new Error('Gunakan foto berformat JPG, PNG, atau WebP.');
  }

  if (file.size > MAX_PHOTO_SIZE) {
    throw new Error('Ukuran foto maksimal 2 MB.');
  }

  return readPhotoAsDataUrl(file);
}

export default function CandidateManagementClient({
  groupedCandidates,
  organizations,
}: Props) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createError, setCreateError] = useState('');

  const [editingCandidate, setEditingCandidate] = useState<CandidateData | null>(null);
  const [editError, setEditError] = useState('');

  const [deletingCandidate, setDeletingCandidate] = useState<CandidateData | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const totalCandidates = Object.values(groupedCandidates).reduce(
    (sum, candidates) => sum + candidates.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[var(--muted)]">
            Total {totalCandidates} kandidat di {Object.keys(groupedCandidates).length} organisasi
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(true);
            setCreateError('');
          }}
          className="btn-primary"
        >
          + Tambah Kandidat
        </button>
      </div>

      {/* Candidates grouped by organization */}
      {Object.keys(groupedCandidates).length === 0 ? (
        <div className="panel p-8 text-center">
          <p className="text-sm text-[var(--muted)]">
            Belum ada kandidat terdaftar.
          </p>
        </div>
      ) : (
        Object.entries(groupedCandidates).map(([orgId, candidates]) => {
          const orgName = candidates[0]?.organization?.name || orgId;
          return (
            <section key={orgId} className="space-y-3">
              <h3 className="text-lg font-extrabold text-[var(--primary)]">
                {orgName}
                <span className="ml-2 text-sm font-medium text-[var(--muted)]">
                  ({candidates.length} kandidat)
                </span>
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {candidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    onEdit={() => {
                      setEditingCandidate(candidate);
                      setEditError('');
                    }}
                    onDelete={() => {
                      setDeletingCandidate(candidate);
                      setDeleteError('');
                    }}
                  />
                ))}
              </div>
            </section>
          );
        })
      )}

      {/* Create Candidate Dialog */}
      {showCreateForm && (
        <CreateCandidateDialog
          organizations={organizations}
          error={createError}
          onClose={() => setShowCreateForm(false)}
          onSubmit={async (data) => {
            setCreateError('');
            const result = await createCandidateAction(data);
            if (result.success) {
              setShowCreateForm(false);
            } else {
              setCreateError(result.error || 'Gagal membuat kandidat');
            }
          }}
        />
      )}

      {/* Edit Candidate Dialog */}
      {editingCandidate && (
        <EditCandidateDialog
          candidate={editingCandidate}
          organizations={organizations}
          error={editError}
          onClose={() => setEditingCandidate(null)}
          onSubmit={async (data) => {
            setEditError('');
            const result = await updateCandidateAction(editingCandidate.id, data);
            if (result.success) {
              setEditingCandidate(null);
            } else {
              setEditError(result.error || 'Gagal mengupdate kandidat');
            }
          }}
        />
      )}

      {/* Delete Candidate Dialog */}
      {deletingCandidate && (
        <DeleteCandidateDialog
          candidate={deletingCandidate}
          error={deleteError}
          onClose={() => setDeletingCandidate(null)}
          onConfirm={async () => {
            setDeleteError('');
            const result = await deleteCandidateAction(deletingCandidate.id);
            if (result.success) {
              setDeletingCandidate(null);
            } else {
              setDeleteError(result.error || 'Gagal menghapus kandidat');
            }
          }}
        />
      )}
    </div>
  );
}


// --- Candidate Card ---

function CandidateCard({
  candidate,
  onEdit,
  onDelete,
}: {
  candidate: CandidateData;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const hasVotes = (candidate._count?.votes ?? 0) > 0;

  return (
    <div className="panel p-4">
      {/* Photo */}
      {candidate.photo && (
        <div className="mb-3 aspect-video w-full overflow-hidden rounded-lg bg-slate-100">
          <img
            src={candidate.photo}
            alt={`Foto ${candidate.nameKetua} & ${candidate.nameWakil}`}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Names */}
      <h4 className="text-sm font-extrabold text-[var(--primary)]">
        {candidate.nameKetua} &amp; {candidate.nameWakil}
      </h4>

      {/* Vision (truncated) */}
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
        <span className="font-medium">Visi:</span> {candidate.vision}
      </p>

      {/* Mission (truncated) */}
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
        <span className="font-medium">Misi:</span> {candidate.mission}
      </p>

      {/* Vote badge */}
      {hasVotes && (
        <div className="mt-2">
          <span className="badge badge-gold">
            {candidate._count?.votes} suara
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
        <button
          onClick={onEdit}
          aria-label={`Edit kandidat ${candidate.nameKetua} & ${candidate.nameWakil}`}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          aria-label={`Hapus kandidat ${candidate.nameKetua} & ${candidate.nameWakil}`}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md px-2 py-1 text-sm text-red-600 hover:bg-red-50 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Hapus
        </button>
      </div>
    </div>
  );
}

// --- Create Candidate Dialog ---

function CreateCandidateDialog({
  organizations,
  error,
  onClose,
  onSubmit,
}: {
  organizations: { id: string; name: string }[];
  error: string;
  onClose: () => void;
  onSubmit: (data: {
    organizationId: string;
    nameKetua: string;
    nameWakil: string;
    vision: string;
    mission: string;
    photo: string;
  }) => Promise<void>;
}) {
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id || '');
  const [nameKetua, setNameKetua] = useState('');
  const [nameWakil, setNameWakil] = useState('');
  const [vision, setVision] = useState('');
  const [mission, setMission] = useState('');
  const [photo, setPhoto] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!photo) {
      setPhotoError('Foto paslon wajib diupload.');
      return;
    }

    setIsSubmitting(true);
    await onSubmit({ organizationId, nameKetua, nameWakil, vision, mission, photo });
    setIsSubmitting(false);
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setPhotoError('');
      setPhoto(await preparePhotoUpload(file));
    } catch (error) {
      setPhoto('');
      setPhotoError(error instanceof Error ? error.message : 'Gagal mengupload foto');
      e.target.value = '';
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="create-candidate-title">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <h3 id="create-candidate-title" className="mb-4 text-lg font-semibold text-gray-900">
          Tambah Kandidat Baru
        </h3>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="create-org" className="block text-sm font-medium text-gray-700">
              Organisasi
            </label>
            <select
              id="create-org"
              required
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ minHeight: '44px' }}
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="create-ketua" className="block text-sm font-medium text-gray-700">
              Nama Ketua
            </label>
            <input
              id="create-ketua"
              type="text"
              required
              value={nameKetua}
              onChange={(e) => setNameKetua(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ minHeight: '44px' }}
            />
          </div>

          <div>
            <label htmlFor="create-wakil" className="block text-sm font-medium text-gray-700">
              Nama Wakil
            </label>
            <input
              id="create-wakil"
              type="text"
              required
              value={nameWakil}
              onChange={(e) => setNameWakil(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ minHeight: '44px' }}
            />
          </div>

          <div>
            <label htmlFor="create-vision" className="block text-sm font-medium text-gray-700">
              Visi
            </label>
            <textarea
              id="create-vision"
              required
              rows={3}
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="create-mission" className="block text-sm font-medium text-gray-700">
              Misi
            </label>
            <textarea
              id="create-mission"
              required
              rows={3}
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="create-photo" className="block text-sm font-medium text-gray-700">
              Foto Paslon
            </label>
            {photo && (
              <div className="mt-2 aspect-video w-full overflow-hidden rounded-md bg-slate-100">
                <img
                  src={photo}
                  alt="Preview foto paslon"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <input
              id="create-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              onChange={handlePhotoChange}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ minHeight: '44px' }}
            />
            <p className="mt-1 text-xs text-gray-500">JPG, PNG, atau WebP. Maksimal 2 MB.</p>
            {photoError && (
              <p className="mt-1 text-xs font-medium text-red-600">{photoError}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[44px] items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-[44px] items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Edit Candidate Dialog ---

function EditCandidateDialog({
  candidate,
  organizations,
  error,
  onClose,
  onSubmit,
}: {
  candidate: CandidateData;
  organizations: { id: string; name: string }[];
  error: string;
  onClose: () => void;
  onSubmit: (data: {
    organizationId?: string;
    nameKetua?: string;
    nameWakil?: string;
    vision?: string;
    mission?: string;
    photo?: string;
  }) => Promise<void>;
}) {
  const [organizationId, setOrganizationId] = useState(candidate.organizationId);
  const [nameKetua, setNameKetua] = useState(candidate.nameKetua);
  const [nameWakil, setNameWakil] = useState(candidate.nameWakil);
  const [vision, setVision] = useState(candidate.vision);
  const [mission, setMission] = useState(candidate.mission);
  const [photo, setPhoto] = useState(candidate.photo);
  const [photoError, setPhotoError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!photo) {
      setPhotoError('Foto paslon wajib diupload.');
      return;
    }

    setIsSubmitting(true);

    const data: {
      organizationId?: string;
      nameKetua?: string;
      nameWakil?: string;
      vision?: string;
      mission?: string;
      photo?: string;
    } = {};

    if (organizationId !== candidate.organizationId) data.organizationId = organizationId;
    if (nameKetua !== candidate.nameKetua) data.nameKetua = nameKetua;
    if (nameWakil !== candidate.nameWakil) data.nameWakil = nameWakil;
    if (vision !== candidate.vision) data.vision = vision;
    if (mission !== candidate.mission) data.mission = mission;
    if (photo !== candidate.photo) data.photo = photo;

    await onSubmit(data);
    setIsSubmitting(false);
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setPhotoError('');
      setPhoto(await preparePhotoUpload(file));
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'Gagal mengupload foto');
      e.target.value = '';
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-candidate-title">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <h3 id="edit-candidate-title" className="mb-4 text-lg font-semibold text-gray-900">
          Edit Kandidat
        </h3>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-org" className="block text-sm font-medium text-gray-700">
              Organisasi
            </label>
            <select
              id="edit-org"
              required
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ minHeight: '44px' }}
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="edit-ketua" className="block text-sm font-medium text-gray-700">
              Nama Ketua
            </label>
            <input
              id="edit-ketua"
              type="text"
              required
              value={nameKetua}
              onChange={(e) => setNameKetua(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ minHeight: '44px' }}
            />
          </div>

          <div>
            <label htmlFor="edit-wakil" className="block text-sm font-medium text-gray-700">
              Nama Wakil
            </label>
            <input
              id="edit-wakil"
              type="text"
              required
              value={nameWakil}
              onChange={(e) => setNameWakil(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ minHeight: '44px' }}
            />
          </div>

          <div>
            <label htmlFor="edit-vision" className="block text-sm font-medium text-gray-700">
              Visi
            </label>
            <textarea
              id="edit-vision"
              required
              rows={3}
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="edit-mission" className="block text-sm font-medium text-gray-700">
              Misi
            </label>
            <textarea
              id="edit-mission"
              required
              rows={3}
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="edit-photo" className="block text-sm font-medium text-gray-700">
              Foto Paslon
            </label>
            {photo && (
              <div className="mt-2 aspect-video w-full overflow-hidden rounded-md bg-slate-100">
                <img
                  src={photo}
                  alt="Preview foto paslon"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <input
              id="edit-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ minHeight: '44px' }}
            />
            <p className="mt-1 text-xs text-gray-500">Kosongkan bila foto tidak diubah.</p>
            {photoError && (
              <p className="mt-1 text-xs font-medium text-red-600">{photoError}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[44px] items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-[44px] items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Delete Candidate Dialog ---

function DeleteCandidateDialog({
  candidate,
  error,
  onClose,
  onConfirm,
}: {
  candidate: CandidateData;
  error: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const hasVotes = (candidate._count?.votes ?? 0) > 0;
  const hasVotedError = error?.includes('sudah menerima suara');

  async function handleDelete() {
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-candidate-title">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h3 id="delete-candidate-title" className="mb-2 text-lg font-semibold text-gray-900">
          Hapus Kandidat
        </h3>

        <p className="mb-4 text-sm text-gray-600">
          Apakah Anda yakin ingin menghapus kandidat{' '}
          <span className="font-medium text-gray-900">
            {candidate.nameKetua} &amp; {candidate.nameWakil}
          </span>
          ?
        </p>

        {hasVotes && !error && (
          <div className="mb-4 rounded-md bg-yellow-50 p-3 text-sm text-yellow-700" role="alert">
            Kandidat ini sudah menerima {candidate._count?.votes} suara.
            Penghapusan tidak dapat dilakukan.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Batal
          </button>
          {!hasVotes && !hasVotedError && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex min-h-[44px] items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              {isDeleting ? 'Menghapus...' : 'Hapus'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
