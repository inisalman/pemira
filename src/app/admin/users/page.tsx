import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import BulkImportForm from '@/components/admin/BulkImportForm';
import UserManagementClient from './UserManagementClient';
import { prisma } from '@/lib/prisma';
import { Prisma, Role } from '@prisma/client';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const page = typeof params.page === 'string' ? parseInt(params.page, 10) || 1 : 1;
  const search = typeof params.search === 'string' ? params.search : '';
  const role = typeof params.role === 'string' ? params.role : '';
  const pageSize = 10;

  const where: Prisma.UserWhereInput = {
    ...(search
      ? {
          OR: [
            { nim: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(role === 'ADMIN' || role === 'VOTER' ? { role: role as Role } : {}),
  };

  const [users, total, totalVoters, totalVoted, organizations] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { voterAccess: { select: { id: true, organizationId: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
    prisma.user.count({ where: { role: 'VOTER' } }),
    prisma.vote.count(),
    prisma.organization.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const serializedUsers = users.map((user) => ({
    id: user.id,
    nim: user.nim,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    voterAccess: user.voterAccess,
  }));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const notVoted = Math.max(totalVoters - totalVoted, 0);

  return (
    <div>
      <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <h2 className="text-5xl font-black tracking-[-0.06em] text-[var(--primary)]">
            Manajemen User
          </h2>
          <p className="mt-2 max-w-xl text-xl leading-8 text-[var(--muted)]">
            Kelola daftar pemilih tetap dan hak suara mahasiswa Poltekkes.
          </p>
        </div>
        <a href="#user-controls" className="btn-primary min-w-[190px] text-lg">
          ♙ Tambah User
        </a>
      </div>

      <div className="mb-10 grid gap-6 xl:grid-cols-4">
        <div className="panel p-7">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--ink)]">
            Total Pemilih
          </p>
          <p className="mt-10 text-5xl font-black tracking-[-0.08em] text-[var(--ink)]">
            {totalVoters.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="panel p-7">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--ink)]">
            Sudah Memilih
          </p>
          <p className="mt-10 text-5xl font-black tracking-[-0.08em] text-[var(--ink)]">
            {totalVoted.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="panel p-7">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--ink)]">
            Belum Memilih
          </p>
          <p className="mt-10 text-5xl font-black tracking-[-0.08em] text-[var(--ink)]">
            {notVoted.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="rounded-xl bg-[var(--primary)] p-7 text-white shadow-xl shadow-emerald-900/10">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-200">
            Sisa Waktu
          </p>
          <p className="mt-10 text-5xl font-black tracking-[-0.08em]">
            12:45:08 <span className="align-middle text-sm tracking-normal">LIVE</span>
          </p>
        </div>
      </div>

      <section className="mb-8">
        <UserManagementClient
          users={serializedUsers}
          total={total}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          currentSearch={search}
          currentRole={role}
          organizations={organizations}
        />
      </section>

      <details className="group">
        <summary className="cursor-pointer text-sm font-bold text-[var(--primary)]">
          Import user bulk
        </summary>
        <div className="mt-4">
          <BulkImportForm />
        </div>
      </details>
    </div>
  );
}
