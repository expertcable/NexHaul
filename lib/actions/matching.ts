'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Cargo-to-Truck Equipment Compatibility Checker
 */
function checkEquipmentCompatibility(cargoType: string, truckType: string, requiredTruckType?: string): {
  isCompatible: boolean;
  score: number;
  reason: string;
} {
  const cargo = (cargoType || '').toLowerCase();
  const truck = (truckType || '').toLowerCase();
  const reqType = (requiredTruckType || '').toLowerCase();

  // If explicit truckType was chosen by shipper, check exact or compatible match
  if (reqType) {
    if (truck === reqType || truck.includes(reqType) || reqType.includes(truck)) {
      return { isCompatible: true, score: 100, reason: `${truckType} Exact Match` };
    }
    if (reqType.includes('refrigerat') || reqType.includes('ice')) {
      if (truck.includes('refrigerat') || truck.includes('ice') || truck.includes('cold')) {
        return { isCompatible: true, score: 100, reason: 'Refrigerated Cold-Chain Verified' };
      }
      return { isCompatible: false, score: 0, reason: 'Requires Refrigerated Truck' };
    }
    if (reqType.includes('flatbed')) {
      if (truck.includes('flatbed') || truck.includes('trailer')) {
        return { isCompatible: true, score: 100, reason: 'Flatbed Equipment Match' };
      }
      return { isCompatible: false, score: 0, reason: 'Requires Flatbed Trailer' };
    }
    if (reqType.includes('container') || reqType.includes('dry van')) {
      if (truck.includes('container') || truck.includes('dry van') || truck.includes('trailer')) {
        return { isCompatible: true, score: 95, reason: 'Enclosed Container/Dry Van Match' };
      }
    }
  }

  const isReeferRequired =
    cargo.includes('ice') ||
    cargo.includes('perish') ||
    cargo.includes('meat') ||
    cargo.includes('dairy') ||
    cargo.includes('pharma') ||
    cargo.includes('cold') ||
    cargo.includes('frozen') ||
    cargo.includes('fish') ||
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

  const isReeferTruck = truck.includes('refrigerat') || truck.includes('reefer') || truck.includes('cold') || truck.includes('ice');
  const isFlatbedTruck = truck.includes('flatbed') || truck.includes('trailer') || truck.includes('open') || truck.includes('heavy');
  const isContainerTruck = truck.includes('container') || truck.includes('box') || truck.includes('covered') || truck.includes('dry van') || truck.includes('standard');

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

  if (isContainerTruck || isFlatbedTruck || isReeferTruck || truck.length > 0) {
    return { isCompatible: true, score: 90, reason: 'Universal Equipment Fit' };
  }

  return { isCompatible: true, score: 80, reason: 'Standard Freight Fit' };
}

/**
 * Checks if a corridor or drop point matches
 */
function isCityMatch(targetCity: string, queryCity: string): boolean {
  if (!targetCity || !queryCity) return false;
  const t = targetCity.trim().toLowerCase();
  const q = queryCity.trim().toLowerCase();
  return t.includes(q) || q.includes(t);
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
  truckType?: string;
}

/**
 * Finds active truckers / journeys matching a shipper's load parameters.
 * - Route match: checks origin/destination AND waypoints / dropPoints.
 * - Capacity check: Truck's availableCapacityKg >= load weight.
 * - Truck Type check: Trucker truckType matches Shipper required truckType.
 */
export async function getRecommendedTruckers(params: RecommendedTruckerQuery) {
  await getAuthorizedUser();

  const { originCity, destCity, weightKg, cargoType, truckType } = params;
  const weight = weightKg && !isNaN(Number(weightKg)) ? Number(weightKg) : 0;

  // Retrieve all active and recent journeys
  const journeys = await prisma.journey.findMany({
    where: {
      status: { in: ['AVAILABLE', 'MATCHED'] },
    },
    orderBy: [
      { availableCapacityKg: 'desc' },
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
    take: 20,
  });

  // Filter and score journeys based on route (origin/dest/dropPoints), capacity, and truck type
  const scoredTruckers = journeys
    .map((journey) => {
      const dropPointsList = journey.dropPoints || [];
      const allStops = [journey.originCity, ...dropPointsList, journey.destCity];

      const originMatch = originCity
        ? allStops.some((stop) => isCityMatch(stop, originCity))
        : true;
      const destMatch = destCity
        ? allStops.some((stop) => isCityMatch(stop, destCity))
        : true;

      const directRouteMatch =
        originCity && destCity
          ? isCityMatch(journey.originCity, originCity) && isCityMatch(journey.destCity, destCity)
          : false;

      const waypointMatch = (originMatch && destMatch) && !directRouteMatch;
      const routeMatch = originMatch && destMatch;

      const availableCap = Number(journey.availableCapacityKg);
      const isFull = availableCap <= 0 || journey.status === 'MATCHED';
      const hasEnoughCapacity = weight > 0 ? availableCap >= weight : availableCap > 0;

      const compatibility = checkEquipmentCompatibility(
        cargoType || '',
        journey.truckType || '',
        truckType || ''
      );

      let matchTier: 'PERFECT' | 'ROUTE_CAPACITY' | 'CORRIDOR_NEARBY' = 'ROUTE_CAPACITY';
      let matchHeadline = 'Route & Capacity Matched';

      if (isFull) {
        matchHeadline = 'FULL / CAPACITY REACHED';
      } else if (directRouteMatch && compatibility.isCompatible && compatibility.score === 100 && hasEnoughCapacity) {
        matchTier = 'PERFECT';
        matchHeadline = '⚡ 100% Perfect Match: Route + Capacity + Truck Type';
      } else if (waypointMatch && compatibility.isCompatible && hasEnoughCapacity) {
        matchTier = 'PERFECT';
        matchHeadline = '⚡ Waypoint Route Match (Includes Drop Point)';
      } else if (routeMatch && hasEnoughCapacity) {
        matchTier = 'ROUTE_CAPACITY';
        matchHeadline = '⚡ Verified Highway Corridor Match';
      } else {
        matchTier = 'CORRIDOR_NEARBY';
        matchHeadline = '⚡ Network Corridor Match';
      }

      const capacityFit = weight > 0 && availableCap > 0 ? (weight / availableCap) * 100 : 100;
      const calculatedPrice = journey.price && Number(journey.price) > 0
        ? Number(journey.price)
        : journey.priceInr && Number(journey.priceInr) > 0
        ? Number(journey.priceInr)
        : journey.askingPricePerKg
        ? Number(journey.askingPricePerKg) * (weight > 0 ? weight : availableCap)
        : 18000;

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
        dropPoints: dropPointsList,
        departureDate: journey.departureDate,
        availableCapacityKg: availableCap,
        truckType: journey.truckType || 'Heavy Commercial Vehicle',
        price: calculatedPrice,
        askingPricePerKg: journey.askingPricePerKg ? Number(journey.askingPricePerKg) : null,
        status: journey.status,
        isFull,
        routeMatch,
        hasEnoughCapacity,
        matchTier,
        matchHeadline,
        capacityFitPercent: Math.min(100, Math.round(capacityFit)),
        equipmentReason: compatibility.reason,
        isCompatibleEquipment: compatibility.isCompatible,
      };
    })
    .filter((t) => {
      // If search params are specified, keep matching routes
      if (originCity || destCity) {
        return t.routeMatch;
      }
      return true;
    })
    .sort((a, b) => {
      // Non-full matches first, then perfect matches
      if (a.isFull && !b.isFull) return 1;
      if (!a.isFull && b.isFull) return -1;
      if (a.matchTier === 'PERFECT' && b.matchTier !== 'PERFECT') return -1;
      if (a.matchTier !== 'PERFECT' && b.matchTier === 'PERFECT') return 1;
      return b.availableCapacityKg - a.availableCapacityKg;
    });

  return JSON.parse(JSON.stringify(scoredTruckers));
}

/**
 * Intelligent "Recommended Loads" query for the logged-in Trucker.
 * 1. Fetches the trucker's active, non-completed journeys.
 * 2. Finds open PENDING loads matching the trucker's active corridors (including drop points), capacity, and equipment.
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
      status: { not: 'COMPLETED' },
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
          truckType: load.truckType,
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
          isFull: false,
          fillPercent: 0,
        }))
      )
    );
  }

  // 2. Query loads for each active journey
  const recommendedLoadsMap = new Map<string, any>();

  for (const journey of activeJourneys) {
    const journeyCap = Number(journey.availableCapacityKg);
    const isJourneyFull = journeyCap <= 0 || journey.status === 'MATCHED';
    const dropPoints = journey.dropPoints || [];
    const allStops = [journey.originCity, ...dropPoints, journey.destCity];

    // Query pending loads
    const loads = await prisma.load.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: {
        shipper: {
          select: { id: true, name: true, phone: true, email: true },
        },
      },
      take: 20,
    });

    for (const load of loads) {
      const loadWeight = Number(load.weightKg);
      const originMatch = allStops.some((stop) => isCityMatch(stop, load.originCity));
      const destMatch = allStops.some((stop) => isCityMatch(stop, load.destCity));

      if (!originMatch && !destMatch) {
        continue;
      }

      const isExactCorridor =
        isCityMatch(journey.originCity, load.originCity) &&
        isCityMatch(journey.destCity, load.destCity);

      const isWaypointCorridor = (originMatch && destMatch) && !isExactCorridor;
      const fitsCapacity = !isJourneyFull && journeyCap >= loadWeight;
      const equipCheck = checkEquipmentCompatibility(
        load.cargoType,
        journey.truckType || '',
        load.truckType || ''
      );

      let matchTier: 'PERFECT' | 'ROUTE_CAPACITY' | 'CAPACITY_MATCH' = 'CAPACITY_MATCH';
      let matchBadge = '⚡ Capacity Fit';
      let isPerfect = false;

      if (isJourneyFull) {
        matchBadge = 'FULL / CAPACITY REACHED';
      } else if ((isExactCorridor || isWaypointCorridor) && equipCheck.isCompatible && fitsCapacity) {
        matchTier = 'PERFECT';
        matchBadge = isWaypointCorridor
          ? '⚡ Perfect Match: Waypoint + Capacity + Truck Type'
          : '⚡ Perfect Match: Route + Capacity + Truck Type';
        isPerfect = true;
      } else if (isExactCorridor || isWaypointCorridor) {
        matchTier = 'ROUTE_CAPACITY';
        matchBadge = '⚡ Route Match (Corridor Fit)';
        isPerfect = true;
      } else {
        matchTier = 'CAPACITY_MATCH';
        matchBadge = `⚡ Regional Corridor (${load.originCity} ➔ ${load.destCity})`;
      }

      const fillPercent = journeyCap > 0 ? Math.min(100, Math.round((loadWeight / journeyCap) * 100)) : 100;

      if (!recommendedLoadsMap.has(load.id) || isPerfect) {
        recommendedLoadsMap.set(load.id, {
          loadId: load.id,
          originCity: load.originCity,
          originState: load.originState,
          destCity: load.destCity,
          destState: load.destState,
          cargoType: load.cargoType,
          truckType: load.truckType,
          weightKg: loadWeight,
          budget: load.budget ? Number(load.budget) : null,
          priceInr: load.priceInr ? Number(load.priceInr) : null,
          pickupDate: load.pickupDate,
          deliveryDeadline: load.deliveryDeadline,
          shipperName: load.shipper?.name || 'Verified Shipper',
          matchBadge,
          matchTier,
          isPerfectMatch: isPerfect,
          isFull: isJourneyFull || !fitsCapacity,
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
    truckType?: string;
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

  if (Number(journey.availableCapacityKg) <= 0 || journey.status === 'MATCHED') {
    throw new Error('Truck has reached full capacity. No further bookings allowed.');
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
        truckType: details.truckType || journey.truckType,
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
