'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserAction, updateUserAction, deleteUserAction } from './actions';

interface UserData {
  id: string;
  nim: string;
  name: string;
  department: string;
  role: 'ADMIN' | 'VOTER';
  createdAt: string;
  voterAccess: { id: string; organizationId: string }[];
}

interface Organization {
  id: string;
  name: string;
}

interface Props {
  users: UserData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  currentSearch: string;
  currentRole: string;
  organizations: Organization[];
}

export default function UserManagementClient({
  users,
  total,
  page,
  pageSize,
  totalPages,
  currentSearch,
  currentRole,
  organizations,
}: Props) {
  const router = useRouter();

  // Search and filter state
  const [search, setSearch] = useState(currentSearch);
  const [roleFilter, setRoleFilter] = useState(currentRole);

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit dialog state
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editError, setEditError] = useState('');

  // Delete dialog state
  const [deletingUser, setDeletingUser] = useState<UserData | null>(null);
  const [deleteError, setDeleteError] = useState('');

  function updateSearchParams(newSearch: string, newRole: string, newPage?: number) {
    const params = new URLSearchParams();
    if (newSearch) params.set('search', newSearch);
    if (newRole) params.set('role', newRole);
    if (newPage && newPage > 1) params.set('page', String(newPage));
    router.push(`/admin/users?${params.toString()}`);
  }

  function handleSearch() {
    updateSearchParams(search, roleFilter);
  }

  function handleRoleChange(newRole: string) {
    setRoleFilter(newRole);
    updateSearchParams(search, newRole);
  }

  function handlePageChange(newPage: number) {
    updateSearchParams(search, roleFilter, newPage);
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div id="user-controls" className="panel flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <label htmlFor="user-search" className="sr-only">Cari NIM atau nama</label>
          <input
            id="user-search"
            type="text"
            placeholder="Cari NIM atau nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
            className="field flex-1"
            style={{ minHeight: '44px' }}
          />
          <button
            onClick={handleSearch}
            aria-label="Cari user"
            className="btn-secondary min-w-[88px]"
          >
            Cari
          </button>
        </div>
        <div className="flex gap-2">
          <label htmlFor="role-filter" className="sr-only">Filter berdasarkan role</label>
          <select
            id="role-filter"
            value={roleFilter}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="field"
            style={{ minHeight: '44px' }}
          >
            <option value="">Semua Role</option>
            <option value="ADMIN">Admin</option>
            <option value="VOTER">Voter</option>
          </select>
          <button
            onClick={() => {
              setShowCreateForm(true);
              setCreateError('');
            }}
            className="btn-primary gap-2"
          >
            <span className="geo-mini geo-mini-plus" aria-hidden="true" />
            Tambah User
          </button>
        </div>
      </div>

      {/* User Table */}
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y-2 divide-[var(--border)]">
            <thead className="bg-[var(--surface-muted)]">
              <tr>
                <th className="px-6 py-5 text-left text-xs font-extrabold uppercase text-[var(--ink)]">
                  NIM
                </th>
                <th className="px-6 py-5 text-left text-xs font-extrabold uppercase text-[var(--ink)]">
                  Nama
                </th>
                <th className="px-6 py-5 text-left text-xs font-extrabold uppercase text-[var(--ink)]">
                  Jurusan
                </th>
                <th className="px-6 py-5 text-left text-xs font-extrabold uppercase text-[var(--ink)]">
                  Role
                </th>
                <th className="px-6 py-5 text-left text-xs font-extrabold uppercase text-[var(--ink)]">
                  Org. Access
                </th>
                <th className="px-6 py-5 text-right text-xs font-extrabold uppercase text-[var(--ink)]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[var(--border)] bg-white">
              {users.length === 0 ? (
                <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-[var(--muted)]">
                    Tidak ada user ditemukan.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--surface-muted)]/70">
                    <td className="whitespace-nowrap px-6 py-5 text-sm font-bold text-[var(--primary)]">
                      {user.nim}
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-sm font-bold text-[var(--foreground)]">
                      {user.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-sm text-[var(--muted)]">
                      {user.department || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.role === 'ADMIN'
                            ? 'badge-blue'
                            : 'badge-teal'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-sm text-[var(--muted)]">
                      {user.voterAccess.length > 0
                        ? `${user.voterAccess.length} org`
                        : '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-right text-sm">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setEditError('');
                        }}
                        className="mr-2 inline-flex min-h-[44px] min-w-[56px] items-center justify-center gap-2 rounded-lg border-2 border-[var(--shadow-hard)] bg-white px-3 py-1 font-bold text-[var(--primary)] shadow-[3px_3px_0_var(--shadow-hard)] hover:bg-[var(--accent)] focus:outline-none"
                        aria-label={`Edit user ${user.name}`}
                      >
                        <span className="geo-mini geo-mini-edit" aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setDeletingUser(user);
                          setDeleteError('');
                        }}
                        className="inline-flex min-h-[44px] min-w-[56px] items-center justify-center gap-2 rounded-lg border-2 border-[var(--shadow-hard)] bg-white px-3 py-1 font-bold text-red-700 shadow-[3px_3px_0_var(--shadow-hard)] hover:bg-red-50 focus:outline-none"
                        aria-label={`Hapus user ${user.name}`}
                      >
                        <span className="geo-mini geo-mini-delete" aria-hidden="true" />
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav aria-label="Pagination" className="flex items-center justify-between border-t-2 border-[var(--border)] bg-white px-6 py-4">
            <div className="text-sm text-gray-500">
              Menampilkan {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, total)} dari {total} user
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                aria-label="Halaman sebelumnya"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border-2 border-[var(--shadow-hard)] px-3 py-1 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none"
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
                      <span className="px-1 text-gray-400" aria-hidden="true">...</span>
                    )}
                    <button
                      onClick={() => handlePageChange(p)}
                      aria-label={`Halaman ${p}`}
                      aria-current={p === page ? 'page' : undefined}
                      className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border-2 px-3 py-1 text-sm font-bold focus:outline-none ${
                        p === page
                          ? 'border-[var(--shadow-hard)] bg-[var(--primary)] text-white'
                          : 'border-[var(--border)] hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                aria-label="Halaman berikutnya"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border-2 border-[var(--shadow-hard)] px-3 py-1 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none"
              >
                Next
              </button>
            </div>
          </nav>
        )}
      </div>

      {/* Create User Dialog */}
      {showCreateForm && (
        <CreateUserDialog
          organizations={organizations}
          error={createError}
          onClose={() => setShowCreateForm(false)}
          onSubmit={async (data) => {
            setCreateError('');
            const result = await createUserAction(data);
            if (result.success) {
              setShowCreateForm(false);
            } else {
              setCreateError(result.error || 'Gagal membuat user');
            }
          }}
        />
      )}

      {/* Edit User Dialog */}
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          organizations={organizations}
          error={editError}
          onClose={() => setEditingUser(null)}
          onSubmit={async (data) => {
            setEditError('');
            const result = await updateUserAction(editingUser.id, data);
            if (result.success) {
              setEditingUser(null);
            } else {
              setEditError(result.error || 'Gagal mengupdate user');
            }
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingUser && (
        <DeleteUserDialog
          user={deletingUser}
          error={deleteError}
          onClose={() => setDeletingUser(null)}
          onConfirm={async () => {
            setDeleteError('');
            const result = await deleteUserAction(deletingUser.id);
            if (result.success) {
              setDeletingUser(null);
            } else {
              setDeleteError(result.error || 'Gagal menghapus user');
            }
          }}
        />
      )}
    </div>
  );
}

// --- Create User Dialog ---

function CreateUserDialog({
  organizations,
  error,
  onClose,
  onSubmit,
}: {
  organizations: Organization[];
  error: string;
  onClose: () => void;
  onSubmit: (data: {
    nim: string;
    name: string;
    department?: string;
    password: string;
    role: 'ADMIN' | 'VOTER';
    organizationIds?: string[];
  }) => Promise<void>;
}) {
  const [nim, setNim] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'VOTER'>('VOTER');
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit({
      nim,
      name,
      department,
      password,
      role,
      organizationIds: role === 'VOTER' ? selectedOrgs : undefined,
    });
    setIsSubmitting(false);
  }

  function toggleOrg(orgId: string) {
    setSelectedOrgs((prev) =>
      prev.includes(orgId)
        ? prev.filter((id) => id !== orgId)
        : [...prev, orgId]
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="create-user-title">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 id="create-user-title" className="mb-4 text-lg font-semibold text-gray-900">
          Tambah User Baru
        </h3>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="create-nim" className="block text-sm font-medium text-gray-700">
              NIM
            </label>
            <input
              id="create-nim"
              type="text"
              required
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ minHeight: '44px' }}
            />
          </div>

          <div>
            <label htmlFor="create-name" className="block text-sm font-medium text-gray-700">
              Nama
            </label>
            <input
              id="create-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ minHeight: '44px' }}
            />
          </div>

          <div>
            <label htmlFor="create-department" className="block text-sm font-medium text-gray-700">
              Jurusan
            </label>
            <input
              id="create-department"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Contoh: Keperawatan"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ minHeight: '44px' }}
            />
          </div>

          <div>
            <label htmlFor="create-password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="create-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ minHeight: '44px' }}
            />
          </div>

          <div>
            <label htmlFor="create-role" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="create-role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'ADMIN' | 'VOTER')}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ minHeight: '44px' }}
            >
              <option value="VOTER">Voter</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {role === 'VOTER' && organizations.length > 0 && (
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700">
                Akses Organisasi
              </legend>
              <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-md border border-gray-200 p-3">
                {organizations.map((org) => (
                  <label
                    key={org.id}
                    className="flex min-h-[44px] items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedOrgs.includes(org.id)}
                      onChange={() => toggleOrg(org.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {org.name}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

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

// --- Edit User Dialog ---

function EditUserDialog({
  user,
  organizations,
  error,
  onClose,
  onSubmit,
}: {
  user: UserData;
  organizations: Organization[];
  error: string;
  onClose: () => void;
  onSubmit: (data: {
    nim?: string;
    name?: string;
    department?: string;
    password?: string;
    role?: 'ADMIN' | 'VOTER';
    organizationIds?: string[];
  }) => Promise<void>;
}) {
  const [nim, setNim] = useState(user.nim);
  const [name, setName] = useState(user.name);
  const [department, setDepartment] = useState(user.department);
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'VOTER'>(user.role);
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>(
    user.voterAccess.map((va) => va.organizationId)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const data: {
      nim?: string;
      name?: string;
      department?: string;
      password?: string;
      role?: 'ADMIN' | 'VOTER';
      organizationIds?: string[];
    } = {};

    if (nim !== user.nim) data.nim = nim;
    if (name !== user.name) data.name = name;
    if (department !== user.department) data.department = department;
    if (password) data.password = password;
    if (role !== user.role) data.role = role;

    // Always send organizationIds for VOTER role to allow updates
    if (role === 'VOTER') {
      data.organizationIds = selectedOrgs;
    } else {
      data.organizationIds = [];
    }

    await onSubmit(data);
    setIsSubmitting(false);
  }

  function toggleOrg(orgId: string) {
    setSelectedOrgs((prev) =>
      prev.includes(orgId)
        ? prev.filter((id) => id !== orgId)
        : [...prev, orgId]
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-user-title">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 id="edit-user-title" className="mb-4 text-lg font-semibold text-gray-900">
          Edit User
        </h3>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-nim" className="block text-sm font-medium text-gray-700">
              NIM
            </label>
            <input
              id="edit-nim"
              type="text"
              required
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ minHeight: '44px' }}
            />
          </div>

          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
              Nama
            </label>
            <input
              id="edit-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ minHeight: '44px' }}
            />
          </div>

          <div>
            <label htmlFor="edit-department" className="block text-sm font-medium text-gray-700">
              Jurusan
            </label>
            <input
              id="edit-department"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Contoh: Keperawatan"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ minHeight: '44px' }}
            />
          </div>

          <div>
            <label htmlFor="edit-password" className="block text-sm font-medium text-gray-700">
              Password{' '}
              <span className="font-normal text-gray-400">
                (kosongkan jika tidak diubah)
              </span>
            </label>
            <input
              id="edit-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ minHeight: '44px' }}
            />
          </div>

          <div>
            <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="edit-role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'ADMIN' | 'VOTER')}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ minHeight: '44px' }}
            >
              <option value="VOTER">Voter</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {role === 'VOTER' && organizations.length > 0 && (
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700">
                Akses Organisasi
              </legend>
              <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-md border border-gray-200 p-3">
                {organizations.map((org) => (
                  <label
                    key={org.id}
                    className="flex min-h-[44px] items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedOrgs.includes(org.id)}
                      onChange={() => toggleOrg(org.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {org.name}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

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

// --- Delete User Dialog ---

function DeleteUserDialog({
  user,
  error,
  onClose,
  onConfirm,
}: {
  user: UserData;
  error: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
  }

  const hasVotedWarning = error?.includes('sudah memilih');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-user-title">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h3 id="delete-user-title" className="mb-2 text-lg font-semibold text-gray-900">
          Hapus User
        </h3>

        <p className="mb-4 text-sm text-gray-600">
          Apakah Anda yakin ingin menghapus user{' '}
          <span className="font-medium text-gray-900">{user.name}</span> (
          {user.nim})?
        </p>

        {user.voterAccess.length > 0 && !error && (
          <div className="mb-4 rounded-md bg-yellow-50 p-3 text-sm text-yellow-700" role="alert">
            User ini memiliki akses ke {user.voterAccess.length} organisasi.
            Semua akses akan dihapus.
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
          {!hasVotedWarning && (
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
