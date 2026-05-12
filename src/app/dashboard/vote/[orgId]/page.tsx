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
      photoWakil: true,
    },
  });

  return (
    <div>
      <div className="relative mb-16 overflow-hidden rounded-lg border-2 border-[var(--shadow-hard)] bg-white px-6 py-14 text-center shadow-[8px_8px_0_var(--shadow-hard)]">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-8 border-[var(--accent)]" />
        <div className="absolute -left-14 bottom-6 h-36 w-36 rounded-full border-8 border-[var(--accent-purple)] opacity-30" />
        <p className="relative text-sm font-black uppercase text-[var(--primary)]">
          Bilik Suara Digital
        </p>
        <h2 className="relative mx-auto mt-5 max-w-4xl text-5xl font-black leading-tight text-[var(--primary)]">
          Pemilihan Ketua &amp; Wakil Ketua {organization.name}
        </h2>
        <p className="relative mx-auto mt-7 max-w-3xl text-lg leading-8 text-[var(--ink)]">
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
