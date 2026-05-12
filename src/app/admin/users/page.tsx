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
    department: user.department,
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
          <h2 className="text-5xl font-black leading-tight text-[var(--ink)]">
            Manajemen User
          </h2>
          <p className="mt-2 max-w-xl text-xl leading-8 text-[var(--primary-dark)]">
            Kelola daftar pemilih tetap dan hak suara mahasiswa Poltekkes.
          </p>
        </div>
        <a href="#user-controls" className="btn-primary min-w-[190px] gap-2 text-lg">
          <span className="geo-mini geo-mini-plus" aria-hidden="true" />
          Tambah User
        </a>
      </div>

      <div className="mb-10 grid gap-6 xl:grid-cols-4">
        <div className="panel relative overflow-hidden bg-[var(--secondary)] p-7">
          <div className="absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-[var(--primary)]/15" />
          <p className="text-sm font-black uppercase text-[var(--primary-dark)]">
            Total Pemilih
          </p>
          <p className="relative mt-10 text-5xl font-black text-[var(--primary-dark)]">
            {totalVoters.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="panel relative overflow-hidden bg-[var(--accent)] p-7">
          <div className="absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-white/25" />
          <p className="text-sm font-black uppercase text-[var(--primary-dark)]">
            Sudah Memilih
          </p>
          <p className="relative mt-10 text-5xl font-black text-[var(--primary-dark)]">
            {totalVoted.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="panel relative overflow-hidden bg-[var(--accent-purple)] p-7">
          <div className="absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-white/20" />
          <p className="text-sm font-black uppercase text-[#32136f]">
            Belum Memilih
          </p>
          <p className="relative mt-10 text-5xl font-black text-[#32136f]">
            {notVoted.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="panel bg-[var(--accent-lime)] p-7 text-[var(--primary-dark)]">
          <p className="text-sm font-black uppercase">
            Sisa Waktu
          </p>
          <p className="mt-10 text-5xl font-black">
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
