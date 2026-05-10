import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getEntries } from '@/services/audit.service';
import type { AuditActionType } from '@/types';
import AuditTrailClient from './AuditTrailClient';

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const params = await searchParams;

  const page = typeof params.page === 'string' ? parseInt(params.page, 10) || 1 : 1;
  const actionType = typeof params.actionType === 'string' ? params.actionType : undefined;
  const actor = typeof params.actor === 'string' ? params.actor : undefined;
  const startDate = typeof params.startDate === 'string' ? params.startDate : undefined;
  const endDate = typeof params.endDate === 'string' ? params.endDate : undefined;

  const filterParams: {
    actionType?: AuditActionType;
    actorId?: string;
    startDate?: Date;
    endDate?: Date;
    page: number;
    pageSize: number;
  } = {
    page,
    pageSize: 20,
  };

  if (actionType) {
    filterParams.actionType = actionType as AuditActionType;
  }

  if (actor) {
    filterParams.actorId = actor;
  }

  if (startDate) {
    filterParams.startDate = new Date(startDate);
  }

  if (endDate) {
    // Set end date to end of day
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filterParams.endDate = end;
  }

  const result = await getEntries(filterParams);

  // Serialize dates for client component
  const serializedData = result.data.map((entry) => ({
    id: entry.id,
    actorId: entry.actorId,
    actionType: entry.actionType,
    details: entry.details,
    metadata: entry.metadata as Record<string, unknown> | null,
    createdAt: entry.createdAt.toISOString(),
  }));

  return (
    <div>
      <div className="mb-6">
        <p className="badge badge-blue">Admin</p>
        <h2 className="mt-3 text-2xl font-extrabold text-[var(--primary)] sm:text-3xl">
          Audit Trail (E-Saksi)
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Catatan aktivitas sistem untuk transparansi pemilihan
        </p>
      </div>

      <AuditTrailClient
        entries={serializedData}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        currentActionType={actionType || ''}
        currentActor={actor || ''}
        currentStartDate={startDate || ''}
        currentEndDate={endDate || ''}
      />
    </div>
  );
}
