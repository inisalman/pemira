import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasVoted } from '@/services/vote.service';
import { VotingBooth } from '@/components/voting/VotingBooth';

export default async function BilikSuaraPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const userId = session.user.id;

  // Verify voter has access to this organization
  const voterAccess = await prisma.voterAccess.findUnique({
    where: {
      userId_organizationId: { userId, organizationId: orgId },
    },
  });

  if (!voterAccess) {
    redirect('/dashboard');
  }

  // Check if already voted
  const alreadyVoted = await hasVoted(userId, orgId);
  if (alreadyVoted) {
    redirect('/dashboard');
  }

  // Fetch organization details
  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true },
  });

  if (!organization) {
    redirect('/dashboard');
  }

  // Fetch candidates for this organization
  const candidates = await prisma.candidate.findMany({
    where: { organizationId: orgId },
    select: {
      id: true,
      nameKetua: true,
      nameWakil: true,
      vision: true,
      mission: true,
      photo: true,
    },
  });

  return (
    <div>
      <div className="mb-16 border-t-4 border-[#17c191] pt-12 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.34em] text-[var(--primary)]">
          Bilik Suara Digital
        </p>
        <h2 className="mt-5 text-5xl font-black tracking-[-0.06em] text-[var(--primary)]">
          Pemilihan Ketua &amp; Wakil Ketua {organization.name}
        </h2>
        <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-[var(--ink)]">
          Gunakan hak suara Anda dengan bijak. Pilihlah pasangan calon yang
          menurut Anda terbaik untuk membawa perubahan positif bagi institusi.
        </p>
      </div>

      {candidates.length === 0 ? (
        <div className="panel p-8 text-center">
          <p className="text-[var(--muted)]">
            Belum ada kandidat terdaftar untuk organisasi ini.
          </p>
        </div>
      ) : (
        <VotingBooth
          orgId={orgId}
          orgName={organization.name}
          candidates={candidates}
        />
      )}
    </div>
  );
}
