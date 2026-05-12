import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateVoterHash } from '@/lib/hash';
import { OrgCard } from '@/components/dashboard/OrgCard';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (session.user.role === 'ADMIN') {
    redirect('/admin');
  }

  const userId = session.user.id;

  // Fetch voter's organizations via VoterAccess
  const voterAccessRecords = await prisma.voterAccess.findMany({
    where: { userId },
    include: {
      organization: true,
    },
  });

  // Check vote status for each organization
  const organizationsWithStatus = await Promise.all(
    voterAccessRecords.map(async (va) => {
      const hash = generateVoterHash(userId, va.organizationId);
      const existingVote = await prisma.vote.findUnique({
        where: { encryptedVoterHash: hash },
      });

      return {
        id: va.organization.id,
        name: va.organization.name,
        hasVoted: !!existingVote,
      };
    })
  );

  return (
    <div>
      <div className="mb-14 max-w-4xl">
        <h2 className="text-5xl font-black tracking-[-0.06em] text-[var(--primary)] sm:text-6xl">
          Halo, {session.user.name}
        </h2>
        <p className="mt-5 text-xl leading-8 text-[var(--ink)]">
          Selamat datang di portal pemilihan raya. Pastikan Anda menggunakan
          hak suara Anda untuk masa depan kampus yang lebih baik.
        </p>
      </div>

      {organizationsWithStatus.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-[var(--border)] p-16 text-center">
          <span className="geo-icon geo-icon-empty mx-auto text-[var(--primary)]" aria-hidden="true" />
          <h3 className="mt-8 text-3xl font-black text-[var(--primary)]">
            Belum Ada Pemilihan
          </h3>
          <p className="mx-auto mt-4 max-w-md text-[var(--muted)]">
            Anda belum memiliki hak pilih untuk organisasi manapun.
          </p>
        </div>
      ) : (
        <>
        <div className="grid gap-8 lg:grid-cols-3">
          {organizationsWithStatus.map((org) => (
            <OrgCard
              key={org.id}
              organization={{ id: org.id, name: org.name }}
              hasVoted={org.hasVoted}
            />
          ))}
        </div>
        <div className="mt-20 rounded-lg border-2 border-dashed border-[var(--border)] px-6 py-16 text-center">
          <span className="geo-icon geo-icon-empty mx-auto text-[var(--primary)]" aria-hidden="true" />
          <h3 className="mt-8 text-3xl font-black tracking-[-0.04em] text-[var(--primary)]">
            Belum Ada Pemilihan Lainnya
          </h3>
          <p className="mx-auto mt-4 max-w-md text-lg leading-7 text-[var(--muted)]">
            Anda telah melihat semua pemilihan aktif yang tersedia untuk
            program studi Anda saat ini.
          </p>
        </div>
        </>
      )}
    </div>
  );
}
