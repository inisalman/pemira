import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createCandidate, getAllCandidatesGrouped } from '@/services/candidate.service';
import { createCandidateSchema } from '@/lib/validators';
import { log } from '@/services/audit.service';

/**
 * GET /api/admin/candidates
 * Returns all candidates grouped by organization.
 * Requires admin authentication.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const grouped = await getAllCandidatesGrouped();
    return Response.json(grouped);
  } catch {
    return Response.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

/**
 * POST /api/admin/candidates
 * Creates a new candidate. Requires admin authentication.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createCandidateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const candidate = await createCandidate(parsed.data);

    await log({
      actorId: session.user.id,
      actionType: 'CANDIDATE_CREATED',
      details: `Created candidate ${parsed.data.nameKetua} & ${parsed.data.nameWakil} for org ${parsed.data.organizationId}`,
    });

    return Response.json(candidate, { status: 201 });
  } catch {
    return Response.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
