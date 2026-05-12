import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import type {
  CreateUserInput,
  UpdateUserInput,
  PaginationParams,
  FilterParams,
  PaginatedResult,
  DeleteResult,
} from '@/types';

/**
 * Creates a new user with hashed password and optional VoterAccess records.
 */
export async function createUser(data: CreateUserInput) {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      nim: data.nim,
      name: data.name,
      department: data.department ?? '',
      password: hashedPassword,
      role: data.role,
      ...(data.organizationIds && data.organizationIds.length > 0
        ? {
            voterAccess: {
              create: data.organizationIds.map((orgId) => ({
                organizationId: orgId,
              })),
            },
          }
        : {}),
    },
    include: {
      voterAccess: true,
    },
  });

  return user;
}

/**
 * Returns a paginated list of users with optional search and role filter.
 * Search matches against nim or name (case-insensitive).
 */
export async function getUsers(
  params: PaginationParams & FilterParams
): Promise<PaginatedResult<Awaited<ReturnType<typeof prisma.user.findMany>>[number]>> {
  const { page, pageSize, search, role } = params;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { nim: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) {
    where.role = role;
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { voterAccess: true },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Updates a user by ID. If password is provided, it will be hashed.
 * If organizationIds is provided, existing VoterAccess records are replaced.
 */
export async function updateUser(id: string, data: UpdateUserInput) {
  const updateData: Record<string, unknown> = {};

  if (data.nim !== undefined) updateData.nim = data.nim;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.department !== undefined) updateData.department = data.department;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.password !== undefined) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  // If organizationIds is provided, replace VoterAccess records
  if (data.organizationIds !== undefined) {
    await prisma.$transaction(async (tx) => {
      // Delete existing VoterAccess records
      await tx.voterAccess.deleteMany({ where: { userId: id } });

      // Create new VoterAccess records
      if (data.organizationIds!.length > 0) {
        await tx.voterAccess.createMany({
          data: data.organizationIds!.map((orgId) => ({
            userId: id,
            organizationId: orgId,
          })),
        });
      }

      // Update user fields
      if (Object.keys(updateData).length > 0) {
        await tx.user.update({ where: { id }, data: updateData });
      }
    });

    // Return updated user with voterAccess
    return prisma.user.findUniqueOrThrow({
      where: { id },
      include: { voterAccess: true },
    });
  }

  // No organizationIds change, just update user fields
  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    include: { voterAccess: true },
  });

  return user;
}

/**
 * Deletes a user by ID.
 * If the user has cast any votes, deletion is rejected.
 * VoterAccess records cascade-delete automatically via Prisma schema.
 */
export async function deleteUser(id: string): Promise<DeleteResult> {
  // Check if user has any votes by looking for votes with their voter hash
  // We need to check if any Vote records exist that were cast by this user.
  // Since votes are stored with encryptedVoterHash (derived from userId + orgId),
  // we check via the user's VoterAccess records and corresponding hashes.
  // However, a simpler approach: check if any vote's hash matches any of the user's possible hashes.
  // The most reliable way is to generate hashes for all user's org accesses and check.

  // Import hash utility
  const { generateVoterHash } = await import('@/lib/hash');

  // Get user's VoterAccess records to determine which orgs they could have voted in
  const voterAccessRecords = await prisma.voterAccess.findMany({
    where: { userId: id },
    select: { organizationId: true },
  });

  // Generate all possible hashes for this user
  const possibleHashes = voterAccessRecords.map((va) =>
    generateVoterHash(id, va.organizationId)
  );

  // Check if any votes exist with these hashes
  if (possibleHashes.length > 0) {
    const voteCount = await prisma.vote.count({
      where: {
        encryptedVoterHash: { in: possibleHashes },
      },
    });

    if (voteCount > 0) {
      return {
        success: false,
        error: 'Tidak dapat menghapus user yang sudah memilih',
      };
    }
  }

  // Safe to delete - VoterAccess cascades automatically
  await prisma.user.delete({ where: { id } });

  return { success: true };
}
