import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllVoteCounts } from '@/services/vote.service';

/**
 * GET /api/admin/results
 * Returns current vote tallies for all organizations.
 * Requires admin authentication.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await getAllVoteCounts();
    return Response.json(results);
  } catch {
    return Response.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
