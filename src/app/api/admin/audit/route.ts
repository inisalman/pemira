import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEntries } from '@/services/audit.service';
import type { AuditActionType } from '@/types';

/**
 * GET /api/admin/audit
 * Returns paginated audit log entries with optional filtering.
 * Supports filters: actionType, startDate, endDate, actorId.
 * Requires admin authentication.
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  const actionType = searchParams.get('actionType') as AuditActionType | undefined;
  const actorId = searchParams.get('actorId') || undefined;
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');

  const startDate = startDateStr ? new Date(startDateStr) : undefined;
  const endDate = endDateStr ? new Date(endDateStr) : undefined;

  try {
    const result = await getEntries({
      page,
      pageSize,
      actionType: actionType || undefined,
      actorId,
      startDate,
      endDate,
    });
    return Response.json(result);
  } catch {
    return Response.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
