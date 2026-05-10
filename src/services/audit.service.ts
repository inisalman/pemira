import { prisma } from '@/lib/prisma';
import type { AuditEntry, AuditFilterParams, PaginationParams, PaginatedResult } from '@/types';
import type { AuditLog } from '@prisma/client';

/**
 * Logs an audit entry. Creates an immutable record of a significant action.
 */
export async function log(entry: AuditEntry): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: entry.actorId,
      actionType: entry.actionType,
      details: entry.details,
      metadata: entry.metadata ?? undefined,
    },
  });
}

/**
 * Retrieves paginated audit log entries with optional filtering.
 * Results are ordered chronologically (newest first).
 * Supports filtering by actionType, date range (startDate/endDate), and actorId.
 *
 * No update or delete operations are exposed to enforce immutability.
 */
export async function getEntries(
  params: AuditFilterParams & Partial<PaginationParams>
): Promise<PaginatedResult<AuditLog>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  if (params.actionType) {
    where.actionType = params.actionType;
  }

  if (params.actorId) {
    where.actorId = params.actorId;
  }

  if (params.startDate || params.endDate) {
    const createdAt: Record<string, Date> = {};
    if (params.startDate) {
      createdAt.gte = params.startDate;
    }
    if (params.endDate) {
      createdAt.lte = params.endDate;
    }
    where.createdAt = createdAt;
  }

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
