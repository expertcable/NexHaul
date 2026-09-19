'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Cargo-to-Truck Equipment Compatibility Checker
 */
function checkEquipmentCompatibility(cargoType: string, truckType: string): {
  isCompatible: boolean;
  score: number;
  reason: string;
} {
  const cargo = (cargoType || '').toLowerCase();
  const truck = (truckType || '').toLowerCase();

  const isReeferRequired =
    cargo.includes('ice') ||
    cargo.includes('perish') ||
    cargo.includes('meat') ||
    cargo.includes('dairy') ||
    cargo.includes('pharma') ||
    cargo.includes('cold') ||
    cargo.includes('frozen') ||
    cargo.includes('fruit') ||
    cargo.includes('vegetable');

  const isFlatbedRequired =
    cargo.includes('machin') ||
    cargo.includes('steel') ||
    cargo.includes('pipe') ||
    cargo.includes('beam') ||
    cargo.includes('construction') ||
    cargo.includes('coil') ||
    cargo.includes('heavy');

  const isReeferTruck = truck.includes('refrigerat') || truck.includes('reefer') || truck.includes('cold');
  const isFlatbedTruck = truck.includes('flatbed') || truck.includes('trailer') || truck.includes('open') || truck.includes('heavy');
  const isContainerTruck = truck.includes('container') || truck.includes('box') || truck.includes('covered') || truck.includes('standard');

  if (isReeferRequired) {
    if (isReeferTruck) {
      return { isCompatible: true, score: 100, reason: 'Refrigerated Cold-Chain Verified' };
    }
    return { isCompatible: false, score: 20, reason: 'Requires Refrigerated Unit' };
  }

  if (isFlatbedRequired) {
    if (isFlatbedTruck) {
      return { isCompatible: true, score: 100, reason: 'Heavy/Flatbed Equipment Match' };
    }
    return { isCompatible: false, score: 40, reason: 'Requires Flatbed / Open Trailer' };
  }

  // Standard/General freight matches any general truck or container
  if (isContainerTruck || isFlatbedTruck || isReeferTruck || truck.length > 0) {
    return { isCompatible: true, score: 90, reason: 'Universal Equipment Fit' };
  }

  return { isCompatible: true, score: 80, reason: 'Standard Freight Fit' };
}

/**
 * Validates the session and returns the authorized user.
 */
async function getAuthorizedUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: You must be logged in to perform this action.');
  }
  return session.user;
}

export interface RecommendedTruckerQuery {
  originCity?: string;
  destCity?: string;
  weightKg?: number;
  cargoType?: string;
}

/**
 * Finds active truckers / journeys matching a shipper's load parameters.
 * - Route matches origin and destination (case-insensitive)
 * - Truck's availableCapacityKg >= load weight
 * - Truck status is AVAILABLE or MATCHED
 */
export async function getRecommendedTruckers(params: RecommendedTruckerQuery) {
  const user = await getAuthorizedUser();

  const { originCity, destCity, weightKg, cargoType } = params;
  const weight = weightKg && !isNaN(Number(weightKg)) ? Number(weightKg) : 0;

  // Build filtering conditions
  const whereClause: any = {
    status: { in: ['AVAILABLE', 'MATCHED'] },
    availableCapacityKg: { gt: 0 },
  };

  if (weight > 0) {
    whereClause.availableCapacityKg = { gte: weight };
  }

  if (originCity && originCity.trim() !== '') {
    whereClause.originCity = {
      contains: originCity.trim(),
      mode: 'insensitive',
    };
  }

  if (destCity && destCity.trim() !== '') {
    whereClause.destCity = {
      contains: destCity.trim(),
      mode: 'insensitive',
    };
  }

  const journeys = await prisma.journey.findMany({
    where: whereClause,
    orderBy: [
      { availableCapacityKg: 'asc' }, // Closer capacity fit preferred
      { createdAt: 'desc' },
    ],
    include: {
      trucker: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      },
    },
    take: 10,
  });

  // Augment with match scoring and equipment compatibility
  const scoredTruckers = journeys.map((journey) => {
    const originMatch =
      originCity && journey.originCity.toLowerCase().includes(originCity.trim().toLowerCase());
    const destMatch =
      destCity && journey.destCity.toLowerCase().includes(destCity.trim().toLowerCase());
    const routeMatch = originMatch && destMatch;

    const capacityFit = weight > 0 ? (weight / Number(journey.availableCapacityKg)) * 100 : 100;
    const compatibility = checkEquipmentCompatibility(cargoType || '', journey.truckType || '');

    let matchTier: 'PERFECT' | 'ROUTE_CAPACITY' | 'CORRIDOR_NEARBY' = 'ROUTE_CAPACITY';
    let matchHeadline = 'Route & Capacity Matched';

    if (routeMatch && compatibility.isCompatible && compatibility.score === 100) {
      matchTier = 'PERFECT';
      matchHeadline = '⚡ 100% Perfect Match: Route + Capacity + Equipment';
    } else if (routeMatch) {
      matchTier = 'ROUTE_CAPACITY';
      matchHeadline = '⚡ Verified Corridor Match';
    } else {
      matchTier = 'CORRIDOR_NEARBY';
      matchHeadline = '⚡ Regional High-Capacity Match';
    }

    return {
      journeyId: journey.id,
      truckerId: journey.truckerId,
      truckerName: journey.trucker?.name || 'Verified Carrier',
      truckerPhone: journey.trucker?.phone || '+91 98201 44520',
      truckerEmail: journey.trucker?.email,
      originCity: journey.originCity,
      originState: journey.originState,
      destCity: journey.destCity,
      destState: journey.destState,
      departureDate: journey.departureDate,
      availableCapacityKg: Number(journey.availableCapacityKg),
      truckType: journey.truckType || 'Heavy Commercial Vehicle',
      askingPricePerKg: journey.askingPricePerKg ? Number(journey.askingPricePerKg) : null,
      status: journey.status,
      matchTier,
      matchHeadline,
      capacityFitPercent: Math.min(100, Math.round(capacityFit)),
      equipmentReason: compatibility.reason,
      isCompatibleEquipment: compatibility.isCompatible,
    };
  });

  return JSON.parse(JSON.stringify(scoredTruckers));
}

/**
 * Intelligent "Recommended Loads" query for the logged-in Trucker.
 * 1. Fetches the trucker's active, non-completed journeys.
 * 2. Finds open PENDING loads matching the trucker's active corridors, capacity, and equipment.
 */
export async function getRecommendedLoadsForTrucker() {
  const user = await getAuthorizedUser();

  if (user.role !== 'TRUCKER') {
    return [];
  }

  // 1. Fetch trucker's active journeys
  const activeJourneys = await prisma.journey.findMany({
    where: {
      truckerId: user.id,
      status: { in: ['AVAILABLE', 'MATCHED'] },
      availableCapacityKg: { gt: 0 },
    },
    orderBy: { departureDate: 'asc' },
  });

  if (activeJourneys.length === 0) {
    // If trucker hasn't registered a journey yet, show latest open broadcasts
    const fallbackLoads = await prisma.load.findMany({
      where: { status: 'PENDING' },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        shipper: {
          select: { id: true, name: true, phone: true, email: true },
        },
      },
    });

    return JSON.parse(
      JSON.stringify(
        fallbackLoads.map((load) => ({
          loadId: load.id,
          originCity: load.originCity,
          originState: load.originState,
          destCity: load.destCity,
          destState: load.destState,
          cargoType: load.cargoType,
          weightKg: Number(load.weightKg),
          budget: load.budget ? Number(load.budget) : null,
          priceInr: load.priceInr ? Number(load.priceInr) : null,
          pickupDate: load.pickupDate,
          deliveryDeadline: load.deliveryDeadline,
          shipperName: load.shipper?.name || 'Verified Shipper',
          matchBadge: '⚡ Open Network Broadcast',
          matchTier: 'BROADCAST',
          isPerfectMatch: false,
          matchedJourneyId: null,
          fillPercent: 0,
        }))
      )
    );
  }

  // 2. Query loads for each active journey
  const recommendedLoadsMap = new Map<string, any>();

  for (const journey of activeJourneys) {
    const journeyCap = Number(journey.availableCapacityKg);
    const jOrigin = journey.originCity.trim().toLowerCase();
    const jDest = journey.destCity.trim().toLowerCase();

    // Query loads that fit capacity and match route
    const matchingLoads = await prisma.load.findMany({
      where: {
        status: 'PENDING',
        weightKg: { lte: journeyCap },
        OR: [
          {
            originCity: { contains: journey.originCity, mode: 'insensitive' },
            destCity: { contains: journey.destCity, mode: 'insensitive' },
          },
          {
            // Regional fallback matching origin or dest
            originCity: { contains: journey.originCity, mode: 'insensitive' },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        shipper: {
          select: { id: true, name: true, phone: true, email: true },
        },
      },
      take: 10,
    });

    for (const load of matchingLoads) {
      const loadWeight = Number(load.weightKg);
      const isExactRoute =
        load.originCity.trim().toLowerCase() === jOrigin &&
        load.destCity.trim().toLowerCase() === jDest;

      const equipCheck = checkEquipmentCompatibility(load.cargoType, journey.truckType || '');

      let matchTier: 'PERFECT' | 'ROUTE_CAPACITY' | 'CAPACITY_MATCH' = 'CAPACITY_MATCH';
      let matchBadge = '⚡ Capacity Fit';
      let isPerfect = false;

      if (isExactRoute && equipCheck.isCompatible && equipCheck.score === 100) {
        matchTier = 'PERFECT';
        matchBadge = '⚡ Perfect Match: Route + Capacity + Truck Type';
        isPerfect = true;
      } else if (isExactRoute) {
        matchTier = 'ROUTE_CAPACITY';
        matchBadge = '⚡ Exact Route & Weight Match';
        isPerfect = true;
      } else {
        matchTier = 'CAPACITY_MATCH';
        matchBadge = `⚡ Corridor Match (${load.originCity} ➔ ${load.destCity})`;
      }

      const fillPercent = Math.min(100, Math.round((loadWeight / journeyCap) * 100));

      if (!recommendedLoadsMap.has(load.id) || isPerfect) {
        recommendedLoadsMap.set(load.id, {
          loadId: load.id,
          originCity: load.originCity,
          originState: load.originState,
          destCity: load.destCity,
          destState: load.destState,
          cargoType: load.cargoType,
          weightKg: loadWeight,
          budget: load.budget ? Number(load.budget) : null,
          priceInr: load.priceInr ? Number(load.priceInr) : null,
          pickupDate: load.pickupDate,
          deliveryDeadline: load.deliveryDeadline,
          shipperName: load.shipper?.name || 'Verified Shipper',
          matchBadge,
          matchTier,
          isPerfectMatch: isPerfect,
          matchedJourneyId: journey.id,
          matchedTruckType: journey.truckType,
          equipmentReason: equipCheck.reason,
          fillPercent,
        });
      }
    }
  }

  // Sort so PERFECT matches appear first, then by fillPercent desc
  const sorted = Array.from(recommendedLoadsMap.values()).sort((a, b) => {
    if (a.isPerfectMatch && !b.isPerfectMatch) return -1;
    if (!a.isPerfectMatch && b.isPerfectMatch) return 1;
    return b.fillPercent - a.fillPercent;
  });

  return JSON.parse(JSON.stringify(sorted));
}

/**
 * Books a trucker journey for a load.
 * Can either connect an existing loadId or create a new load record and book it.
 */
export async function bookRecommendedTrucker(payload: {
  journeyId: string;
  loadId?: string;
  loadDetails?: {
    originCity: string;
    originState: string;
    destCity: string;
    destState: string;
    cargoType: string;
    weightKg: number;
    budget?: number;
    pickupDate?: string;
    deliveryDeadline?: string;
  };
}) {
  const user = await getAuthorizedUser();

  if (user.role !== 'SHIPPER') {
    throw new Error('Unauthorized: Only shippers can book truckers.');
  }

  const journey = await prisma.journey.findUnique({
    where: { id: payload.journeyId },
    include: { trucker: true },
  });

  if (!journey || journey.status === 'COMPLETED' || journey.status === 'CANCELLED') {
    throw new Error('Truck route is no longer available for booking.');
  }

  let loadId = payload.loadId;

  // If no existing loadId is passed, create the load first
  if (!loadId && payload.loadDetails) {
    const details = payload.loadDetails;
    const newLoad = await prisma.load.create({
      data: {
        shipperId: user.id,
        carrierId: journey.truckerId,
        originCity: details.originCity,
        originState: details.originState,
        destCity: details.destCity,
        destState: details.destState,
        cargoType: details.cargoType,
        weightKg: details.weightKg,
        budget: details.budget || 50000,
        status: 'BOOKED',
        pickupDate: details.pickupDate ? new Date(details.pickupDate) : new Date(Date.now() + 86400000),
        deliveryDeadline: details.deliveryDeadline ? new Date(details.deliveryDeadline) : new Date(Date.now() + 86400000 * 3),
        description: `Directly booked with ${journey.trucker?.name || 'Carrier'} for Route ${journey.id}`,
      },
    });
    loadId = newLoad.id;
  } else if (loadId) {
    // Update existing load
    await prisma.load.update({
      where: { id: loadId },
      data: {
        status: 'BOOKED',
        carrierId: journey.truckerId,
        updatedAt: new Date(),
      },
    });
  } else {
    throw new Error('Missing load parameters for booking.');
  }

  // Create match record
  await prisma.match.upsert({
    where: {
      loadId_journeyId: {
        loadId: loadId,
        journeyId: journey.id,
      },
    },
    update: {
      status: 'ACCEPTED',
      proposedBy: 'SHIPPER',
    },
    create: {
      loadId: loadId,
      journeyId: journey.id,
      status: 'ACCEPTED',
      proposedBy: 'SHIPPER',
    },
  });

  // Decrement or update available capacity
  const remainingCapacity = Math.max(0, Number(journey.availableCapacityKg) - (payload.loadDetails?.weightKg || 0));
  await prisma.journey.update({
    where: { id: journey.id },
    data: {
      availableCapacityKg: remainingCapacity,
      status: remainingCapacity === 0 ? 'MATCHED' : journey.status,
    },
  });

  revalidatePath('/dashboard');
  return { success: true, loadId, journeyId: journey.id };
}
