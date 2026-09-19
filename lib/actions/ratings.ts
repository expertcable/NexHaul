'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

async function getAuthorizedUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: You must be logged in.');
  }
  return session.user;
}

export interface SubmitRatingPayload {
  loadId: string;
  truckerId: string;
  score: number; // 1 to 5
  review?: string;
}

/**
 * Submits a rating from a Shipper to a Trucker for a specific load.
 * Automatically recalculates and updates the Trucker's averageRating.
 */
export async function submitRating(payload: SubmitRatingPayload) {
  const user = await getAuthorizedUser();

  if (user.role !== 'SHIPPER') {
    throw new Error('Unauthorized: Only shippers can submit carrier reviews.');
  }

  const { loadId, truckerId, score, review } = payload;

  if (!score || score < 1 || score > 5) {
    throw new Error('Rating score must be between 1 and 5 stars.');
  }

  // Check that the load belongs to this shipper
  const load = await prisma.load.findUnique({
    where: { id: loadId },
  });

  if (!load || load.shipperId !== user.id) {
    throw new Error('Load not found or does not belong to your account.');
  }

  // Create or update the Rating record
  const ratingRecord = await prisma.rating.upsert({
    where: {
      loadId_shipperId: {
        loadId,
        shipperId: user.id,
      },
    },
    update: {
      score,
      review: review?.trim() || null,
      truckerId,
      updatedAt: new Date(),
    },
    create: {
      loadId,
      shipperId: user.id,
      truckerId,
      score,
      review: review?.trim() || null,
    },
  });

  // Recalculate trucker's average rating
  const allRatings = await prisma.rating.findMany({
    where: { truckerId },
    select: { score: true },
  });

  const totalScore = allRatings.reduce((acc, r) => acc + r.score, 0);
  const avg = allRatings.length > 0 ? Number((totalScore / allRatings.length).toFixed(1)) : 0;

  await prisma.user.update({
    where: { id: truckerId },
    data: { averageRating: avg },
  });

  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/profile/${truckerId}`);
  revalidatePath('/dashboard/profile/me');

  return { success: true, rating: ratingRecord, newAverage: avg };
}

/**
 * Fetches all reviews and average rating for a given trucker.
 */
export async function getTruckerReviews(truckerId: string) {
  const reviews = await prisma.rating.findMany({
    where: { truckerId },
    orderBy: { createdAt: 'desc' },
    include: {
      shipper: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      load: {
        select: {
          id: true,
          originCity: true,
          destCity: true,
          cargoType: true,
          weightKg: true,
        },
      },
    },
  });

  const allRatings = await prisma.rating.findMany({
    where: { truckerId },
    select: { score: true },
  });

  const total = allRatings.length;
  const avg = total > 0 ? Number((allRatings.reduce((acc, r) => acc + r.score, 0) / total).toFixed(1)) : 0;

  return {
    averageRating: avg,
    totalReviews: total,
    reviews: JSON.parse(JSON.stringify(reviews)),
  };
}
