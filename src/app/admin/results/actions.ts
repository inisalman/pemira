'use server';

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { resetVotes } from '@/services/vote.service';
import { log as auditLog } from '@/services/audit.service';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login');
  }
  return session;
}

export async function resetVotesAction(organizationId?: string) {
  const session = await requireAdmin();

  try {
    const organization = organizationId
      ? await prisma.organization.findUnique({
          where: { id: organizationId },
          select: { id: true, name: true },
        })
      : null;

    if (organizationId && !organization) {
      return { success: false, error: 'Organisasi tidak ditemukan', count: 0 };
    }

    const count = await resetVotes(organizationId || undefined);

    await auditLog({
      actorId: session.user.id,
      actionType: 'VOTES_RESET',
      details: organization
        ? `Reset ${count} votes for organization ${organization.name}`
        : `Reset ${count} votes for all organizations`,
      metadata: {
        organizationId: organization?.id ?? null,
        organizationName: organization?.name ?? null,
        deletedVotes: count,
      },
    });

    revalidatePath('/admin/results');
    revalidatePath('/admin/candidates');
    revalidatePath('/dashboard');

    return { success: true, error: null, count };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Gagal reset suara';
    return { success: false, error: message, count: 0 };
  }
}
