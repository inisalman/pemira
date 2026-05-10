import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createUser, getUsers } from '@/services/user.service';
import { createUserSchema } from '@/lib/validators';
import { log } from '@/services/audit.service';

/**
 * GET /api/admin/users
 * Returns a paginated list of users with optional search and role filter.
 * Requires admin authentication.
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
  const search = searchParams.get('search') || undefined;
  const role = searchParams.get('role') as 'ADMIN' | 'VOTER' | undefined;

  try {
    const result = await getUsers({ page, pageSize, search, role: role || undefined });
    return Response.json(result);
  } catch {
    return Response.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 * Creates a new user. Requires admin authentication.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const user = await createUser(parsed.data);

    await log({
      actorId: session.user.id,
      actionType: 'USER_CREATED',
      details: `Created user ${parsed.data.nim} (${parsed.data.name})`,
    });

    return Response.json(user, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('Unique constraint')) {
      return Response.json({ error: 'NIM sudah terdaftar' }, { status: 409 });
    }
    return Response.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
