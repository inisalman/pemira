'use server';

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { castVote } from '@/services/vote.service';
import type { VoteResult } from '@/types';

export async function submitVote(
  orgId: string,
  candidateId: string
): Promise<VoteResult> {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const userId = session.user.id;
  const result = await castVote(userId, orgId, candidateId);

  return result;
}
