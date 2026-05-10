'use server';

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import {
  createUser,
  updateUser,
  deleteUser,
} from '@/services/user.service';
import { log as auditLog } from '@/services/audit.service';
import type { CreateUserInput, UpdateUserInput } from '@/types';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login');
  }
  return session;
}

export async function createUserAction(data: CreateUserInput) {
  const session = await requireAdmin();

  try {
    const user = await createUser(data);
    await auditLog({
      actorId: session.user.id,
      actionType: 'USER_CREATED',
      details: `Created user ${data.name} (NIM: ${data.nim}) with role ${data.role}`,
      metadata: { userId: user.id, nim: data.nim, role: data.role },
    });
    revalidatePath('/admin/users');
    return { success: true, error: null };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Gagal membuat user';
    // Handle unique constraint violation for NIM
    if (message.includes('Unique constraint')) {
      return { success: false, error: 'NIM sudah terdaftar' };
    }
    return { success: false, error: message };
  }
}

export async function updateUserAction(id: string, data: UpdateUserInput) {
  const session = await requireAdmin();

  try {
    await updateUser(id, data);
    await auditLog({
      actorId: session.user.id,
      actionType: 'USER_UPDATED',
      details: `Updated user ${id}`,
      metadata: { userId: id, updatedFields: Object.keys(data) },
    });
    revalidatePath('/admin/users');
    return { success: true, error: null };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Gagal mengupdate user';
    if (message.includes('Unique constraint')) {
      return { success: false, error: 'NIM sudah terdaftar' };
    }
    return { success: false, error: message };
  }
}

export async function deleteUserAction(id: string) {
  const session = await requireAdmin();

  try {
    const result = await deleteUser(id);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    await auditLog({
      actorId: session.user.id,
      actionType: 'USER_DELETED',
      details: `Deleted user ${id}`,
      metadata: { userId: id },
    });
    revalidatePath('/admin/users');
    return { success: true, error: null };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Gagal menghapus user';
    return { success: false, error: message };
  }
}
