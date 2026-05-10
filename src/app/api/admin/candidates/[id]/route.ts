import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateCandidate, deleteCandidate } from '@/services/candidate.service';
import { updateCandidateSchema } from '@/lib/validators';
import { log } from '@/services/audit.service';

/**
 * PUT /api/admin/candidates/[id]
 * Updates a candidate by ID. Requires admin authentication.
 */
export async function PUT(
  request: Request,
  ctx: RouteContext<'/api/admin/candidates/[id]'>
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    const body = await request.json();
    const parsed = updateCandidateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const candidate = await updateCandidate(id, parsed.data);

    await log({
      actorId: session.user.id,
      actionType: 'CANDIDATE_UPDATED',
      details: `Updated candidate ${id}`,
    });

    return Response.json(candidate);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('Record to update not found')) {
      return Response.json({ error: 'Candidate not found' }, { status: 404 });
    }
    return Response.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/candidates/[id]
 * Deletes a candidate by ID. Requires admin authentication.
 * Rejects deletion if candidate has received votes.
 */
export async function DELETE(
  _request: Request,
  ctx: RouteContext<'/api/admin/candidates/[id]'>
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    const result = await deleteCandidate(id);

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 409 });
    }

    await log({
      actorId: session.user.id,
      actionType: 'CANDIDATE_DELETED',
      details: `Deleted candidate ${id}`,
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
