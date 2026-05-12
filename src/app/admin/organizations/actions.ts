'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

const LOGO_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'organizations');
const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB

const LOGO_MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

async function saveUploadedLogo(logoData: string): Promise<string> {
  if (!logoData) return '';

  const match = logoData.match(/^data:(image\/(jpeg|png|webp));base64,(.+)$/);
  if (!match) return '';

  const mimeType = match[1];
  const base64Data = match[3];
  const buffer = Buffer.from(base64Data, 'base64');

  if (buffer.length > MAX_LOGO_SIZE) {
    throw new Error('Logo terlalu besar. Maksimal 2MB.');
  }

  await mkdir(LOGO_UPLOAD_DIR, { recursive: true });

  const extension = LOGO_MIME_EXTENSIONS[mimeType];
  const filename = `${randomUUID()}.${extension}`;
  await writeFile(path.join(LOGO_UPLOAD_DIR, filename), buffer);

  return `/uploads/organizations/${filename}`;
}

export async function updateOrganizationLogo(orgId: string, logoData: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const logoPath = await saveUploadedLogo(logoData);
    if (!logoPath) {
      return { success: false, error: 'Format logo tidak valid. Gunakan JPG, PNG, atau WebP.' };
    }

    await prisma.organization.update({
      where: { id: orgId },
      data: { logo: logoPath },
    });

    revalidatePath('/admin/organizations');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal mengupload logo.';
    return { success: false, error: message };
  }
}

export async function createOrganization(name: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await prisma.organization.create({ data: { name } });
    revalidatePath('/admin/organizations');
    return { success: true };
  } catch {
    return { success: false, error: 'Gagal membuat organisasi. Nama mungkin sudah digunakan.' };
  }
}
