import { prisma } from '@/lib/prisma';
import type { CreateCandidateInput, UpdateCandidateInput, DeleteResult } from '@/types';

/**
 * Creates a new candidate with all required fields.
 */
export async function createCandidate(data: CreateCandidateInput) {
  const candidate = await prisma.candidate.create({
    data: {
      organizationId: data.organizationId,
      nameKetua: data.nameKetua,
      nameWakil: data.nameWakil,
      vision: data.vision,
      mission: data.mission,
      photo: data.photo,
    },
    include: {
      organization: true,
    },
  });

  return candidate;
}

/**
 * Gets all candidates for a specific organization.
 */
export async function getCandidatesByOrg(orgId: string) {
  const candidates = await prisma.candidate.findMany({
    where: { organizationId: orgId },
    include: {
      organization: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return candidates;
}

/**
 * Returns all candidates grouped by organization.
 * Returns a record keyed by organization ID with candidates array as values.
 */
export async function getAllCandidatesGrouped(): Promise<
  Record<string, Awaited<ReturnType<typeof prisma.candidate.findMany>>>
> {
  const candidates = await prisma.candidate.findMany({
    include: {
      organization: true,
    },
    orderBy: [{ organizationId: 'asc' }, { createdAt: 'asc' }],
  });

  const grouped: Record<string, typeof candidates> = {};

  for (const candidate of candidates) {
    if (!grouped[candidate.organizationId]) {
      grouped[candidate.organizationId] = [];
    }
    grouped[candidate.organizationId].push(candidate);
  }

  return grouped;
}

/**
 * Updates a candidate by ID with the provided fields.
 */
export async function updateCandidate(id: string, data: UpdateCandidateInput) {
  const updateData: Record<string, unknown> = {};

  if (data.organizationId !== undefined) updateData.organizationId = data.organizationId;
  if (data.nameKetua !== undefined) updateData.nameKetua = data.nameKetua;
  if (data.nameWakil !== undefined) updateData.nameWakil = data.nameWakil;
  if (data.vision !== undefined) updateData.vision = data.vision;
  if (data.mission !== undefined) updateData.mission = data.mission;
  if (data.photo !== undefined) updateData.photo = data.photo;

  const candidate = await prisma.candidate.update({
    where: { id },
    data: updateData,
    include: {
      organization: true,
    },
  });

  return candidate;
}

/**
 * Deletes a candidate by ID.
 * If the candidate has received any votes, deletion is rejected.
 */
export async function deleteCandidate(id: string): Promise<DeleteResult> {
  // Check if candidate has received any votes
  const voteCount = await prisma.vote.count({
    where: { candidateId: id },
  });

  if (voteCount > 0) {
    return {
      success: false,
      error: 'Tidak dapat menghapus kandidat yang sudah menerima suara',
    };
  }

  // Safe to delete
  await prisma.candidate.delete({ where: { id } });

  return { success: true };
}
