import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Fetch overview stats
  const [totalUsers, totalVotes, organizations] = await Promise.all([
    prisma.user.count(),
    prisma.vote.count(),
    prisma.organization.findMany({
      include: {
        _count: {
          select: {
            votes: true,
            voterAccess: true,
            candidates: true,
          },
        },
      },
    }),
  ]);

  const totalVoters = await prisma.user.count({
    where: { role: 'VOTER' },
  });

  return (
    <div>
      <div className="mb-6">
        <p className="badge badge-blue">Admin</p>
        <h2 className="mt-3 text-2xl font-extrabold text-[var(--primary)] sm:text-3xl">
          Ringkasan Pemira
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Ringkasan data pemilihan Pemira
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="panel p-5">
          <p className="text-sm font-bold text-[var(--muted)]">Total User</p>
          <p className="mt-1 text-3xl font-extrabold text-[var(--primary)]">
            {totalUsers}
          </p>
        </div>
        <div className="panel p-5">
          <p className="text-sm font-bold text-[var(--muted)]">Total Pemilih</p>
          <p className="mt-1 text-3xl font-extrabold text-[var(--primary)]">
            {totalVoters}
          </p>
        </div>
        <div className="panel p-5">
          <p className="text-sm font-bold text-[var(--muted)]">Suara Masuk</p>
          <p className="mt-1 text-3xl font-extrabold text-[var(--primary)]">
            {totalVotes}
          </p>
        </div>
        <div className="panel p-5">
          <p className="text-sm font-bold text-[var(--muted)]">Organisasi</p>
          <p className="mt-1 text-3xl font-extrabold text-[var(--primary)]">
            {organizations.length}
          </p>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-extrabold text-[var(--primary)]">
          Ringkasan Organisasi
        </h3>
        {organizations.length === 0 ? (
          <div className="panel p-8 text-center">
            <p className="text-[var(--muted)]">
              Belum ada organisasi terdaftar.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org) => {
              const participation =
                org._count.voterAccess > 0
                  ? Math.round(
                      (org._count.votes / org._count.voterAccess) * 100
                    )
                  : 0;

              return (
                <div
                  key={org.id}
                  className="panel p-5"
                >
                  <h4 className="font-extrabold text-[var(--primary)]">{org.name}</h4>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--muted)]">Pemilih</span>
                      <span className="font-bold text-[var(--primary)]">
                        {org._count.voterAccess}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--muted)]">Suara</span>
                      <span className="font-bold text-[var(--primary)]">
                        {org._count.votes}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--muted)]">Kandidat</span>
                      <span className="font-bold text-[var(--primary)]">
                        {org._count.candidates}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--muted)]">Partisipasi</span>
                      <span className="font-bold text-[var(--primary)]">
                        {participation}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-[var(--secondary)]"
                        style={{ width: `${participation}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
