'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Validates the session and returns the authorized user.
 * Throws an error if no user is found.
 */
async function getAuthorizedUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: You must be logged in to perform this action.');
  }
  return session.user;
}

/**
 * Atomically accepts a load on behalf of a trucker.
 * Uses Prisma's updateMany to guard against race conditions where
 * multiple truckers try to accept the same load simultaneously.
 *
 * @param loadId - The ID of the load to accept
 */
export async function acceptLoad(loadId: string) {
  const user = await getAuthorizedUser();

  if (user.role !== 'TRUCKER') {
    throw new Error('Unauthorized: Only truckers can accept loads.');
  }

  // Must guarantee that two truckers clicking 'Accept' concurrently cannot double-book
  const updated = await prisma.load.updateMany({
    where: {
      id: loadId,
      status: 'PENDING', // Atomic condition
    },
    data: {
      status: 'BOOKED',
      carrierId: user.id,
      updatedAt: new Date(),
    },
  });

  if (updated.count === 0) {
    throw new Error('Conflict: This load has already been claimed by another carrier or is no longer available.');
  }

  revalidatePath('/dashboard');
  return { success: true };
}

export async function rejectLoad(loadId: string) {
  // Can just hide it on the client, or delete from DB if testing.
  // For now, no-op or mark as rejected? The prompt asks for an atomic acceptLoad.
  return { success: true };
}
