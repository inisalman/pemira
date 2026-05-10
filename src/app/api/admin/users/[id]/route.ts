import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateUser, deleteUser } from '@/services/user.service';
import { updateUserSchema } from '@/lib/validators';
import { log } from '@/services/audit.service';

/**
 * PUT /api/admin/users/[id]
 * Updates a user by ID. Requires admin authentication.
 */
export async function PUT(
  request: Request,
  ctx: RouteContext<'/api/admin/users/[id]'>
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const user = await updateUser(id, parsed.data);

    await log({
      actorId: session.user.id,
      actionType: 'USER_UPDATED',
      details: `Updated user ${id}`,
    });

    return Response.json(user);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('Record to update not found')) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    if (message.includes('Unique constraint')) {
      return Response.json({ error: 'NIM sudah terdaftar' }, { status: 409 });
    }
    return Response.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Deletes a user by ID. Requires admin authentication.
 * Rejects deletion if user has already voted.
 */
export async function DELETE(
  _request: Request,
  ctx: RouteContext<'/api/admin/users/[id]'>
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    const result = await deleteUser(id);

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 409 });
    }

    await log({
      actorId: session.user.id,
      actionType: 'USER_DELETED',
      details: `Deleted user ${id}`,
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
