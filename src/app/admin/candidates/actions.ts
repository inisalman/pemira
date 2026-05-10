'use server';

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { authOptions } from '@/lib/auth';
import {
  createCandidate,
  updateCandidate,
  deleteCandidate,
} from '@/services/candidate.service';
import { log as auditLog } from '@/services/audit.service';
import type { CreateCandidateInput, UpdateCandidateInput } from '@/types';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login');
  }
  return session;
}

const MAX_PHOTO_SIZE = 2 * 1024 * 1024;
const PHOTO_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'candidates');
const PHOTO_MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

async function saveUploadedPhoto(photo: string) {
  if (!photo.startsWith('data:image/')) {
    return photo;
  }

  const match = photo.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!match) {
    throw new Error('Format foto tidak didukung. Gunakan JPG, PNG, atau WebP.');
  }

  const [, mimeType, base64Data] = match;
  const buffer = Buffer.from(base64Data, 'base64');

  if (buffer.length > MAX_PHOTO_SIZE) {
    throw new Error('Ukuran foto maksimal 2 MB.');
  }

  await mkdir(PHOTO_UPLOAD_DIR, { recursive: true });

  const extension = PHOTO_MIME_EXTENSIONS[mimeType];
  const filename = `${randomUUID()}.${extension}`;
  await writeFile(path.join(PHOTO_UPLOAD_DIR, filename), buffer);

  return `/uploads/candidates/${filename}`;
}

export async function createCandidateAction(data: CreateCandidateInput) {
  const session = await requireAdmin();

  try {
    const photo = await saveUploadedPhoto(data.photo);
    const candidate = await createCandidate({ ...data, photo });
    await auditLog({
      actorId: session.user.id,
      actionType: 'CANDIDATE_CREATED',
      details: `Created candidate ${data.nameKetua} & ${data.nameWakil} for organization ${data.organizationId}`,
      metadata: { candidateId: candidate.id, organizationId: data.organizationId },
    });
    revalidatePath('/admin/candidates');
    return { success: true, error: null };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Gagal membuat kandidat';
    return { success: false, error: message };
  }
}

export async function updateCandidateAction(id: string, data: UpdateCandidateInput) {
  const session = await requireAdmin();

  try {
    const photo = data.photo ? await saveUploadedPhoto(data.photo) : undefined;
    await updateCandidate(id, photo ? { ...data, photo } : data);
    await auditLog({
      actorId: session.user.id,
      actionType: 'CANDIDATE_UPDATED',
      details: `Updated candidate ${id}`,
      metadata: { candidateId: id, updatedFields: Object.keys(data) },
    });
    revalidatePath('/admin/candidates');
    return { success: true, error: null };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Gagal mengupdate kandidat';
    return { success: false, error: message };
  }
}

export async function deleteCandidateAction(id: string) {
  const session = await requireAdmin();

  try {
    const result = await deleteCandidate(id);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    await auditLog({
      actorId: session.user.id,
      actionType: 'CANDIDATE_DELETED',
      details: `Deleted candidate ${id}`,
      metadata: { candidateId: id },
    });
    revalidatePath('/admin/candidates');
    return { success: true, error: null };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Gagal menghapus kandidat';
    return { success: false, error: message };
  }
}
