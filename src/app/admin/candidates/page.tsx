import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import CandidateManagementClient from './CandidateManagementClient';

export default async function AdminCandidatesPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Fetch all candidates grouped by organization, including vote counts
  const candidates = await prisma.candidate.findMany({
    include: {
      organization: true,
      _count: {
        select: { votes: true },
      },
    },
    orderBy: [{ organizationId: 'asc' }, { createdAt: 'asc' }],
  });

  // Group candidates by organization
  const groupedCandidates: Record<
    string,
    Array<{
      id: string;
      organizationId: string;
      nameKetua: string;
      nameWakil: string;
      vision: string;
      mission: string;
      photo: string;
      createdAt: string;
      organization: { id: string; name: string };
      _count: { votes: number };
    }>
  > = {};

  for (const candidate of candidates) {
    if (!groupedCandidates[candidate.organizationId]) {
      groupedCandidates[candidate.organizationId] = [];
    }
    groupedCandidates[candidate.organizationId].push({
      id: candidate.id,
      organizationId: candidate.organizationId,
      nameKetua: candidate.nameKetua,
      nameWakil: candidate.nameWakil,
      vision: candidate.vision,
      mission: candidate.mission,
      photo: candidate.photo,
      createdAt: candidate.createdAt.toISOString(),
      organization: {
        id: candidate.organization.id,
        name: candidate.organization.name,
      },
      _count: candidate._count,
    });
  }

  // Fetch all organizations for the create/edit form
  const organizations = await prisma.organization.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div>
      <div className="mb-6">
        <p className="badge badge-blue">Admin</p>
        <h2 className="mt-3 text-2xl font-extrabold text-[var(--primary)] sm:text-3xl">
          Manajemen Kandidat
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Kelola data kandidat pasangan calon ketua dan wakil ketua
        </p>
      </div>

      <CandidateManagementClient
        groupedCandidates={groupedCandidates}
        organizations={organizations}
      />
    </div>
  );
}
