import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { castVote } from '@/services/vote.service';
import { voteSubmissionSchema } from '@/lib/validators';

/**
 * POST /api/vote
 * Casts a vote for a candidate in an organization.
 * Requires authenticated user (VOTER or ADMIN).
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = voteSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { orgId, candidateId } = parsed.data;
    const result = await castVote(session.user.id, orgId, candidateId);

    if (!result.success) {
      const statusMap: Record<string, number> = {
        ALREADY_VOTED: 409,
        INVALID_ACCESS: 403,
        INVALID_CANDIDATE: 400,
        TRANSACTION_FAILED: 500,
      };
      const status = statusMap[result.error || ''] || 500;

      const messageMap: Record<string, string> = {
        ALREADY_VOTED: 'Anda sudah memilih untuk organisasi ini',
        INVALID_ACCESS: 'Anda tidak memiliki akses untuk organisasi ini',
        INVALID_CANDIDATE: 'Kandidat tidak valid untuk organisasi ini',
        TRANSACTION_FAILED: 'Suara gagal direkam, silakan coba lagi',
      };
      const message = messageMap[result.error || ''] || 'Terjadi kesalahan sistem';

      return Response.json({ error: message }, { status });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
