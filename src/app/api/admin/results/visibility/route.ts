import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * PUT /api/admin/results/visibility
 * Toggles the visibility of vote results.
 * Stores visibility state in a simple settings record.
 * Requires admin authentication.
 */
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { visible } = body;

    if (typeof visible !== 'boolean') {
      return Response.json(
        { error: 'Validation failed', details: { visible: 'Must be a boolean' } },
        { status: 400 }
      );
    }

    // Store visibility state in process memory (no Settings model in schema)
    globalThis.__resultsVisible = visible;

    return Response.json({ visible });
  } catch {
    return Response.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
