/**
 * Dynamic Pricing & Distance Matrix Utility for NexHaul Freight Network
 */

// Highway distance matrix for major Indian freight corridors (in Kilometers)
const INDIAN_CITY_DISTANCES: Record<string, Record<string, number>> = {
  pune: {
    kochi: 1350,
    cochin: 1350,
    bengaluru: 840,
    bangalore: 840,
    mumbai: 150,
    delhi: 1440,
    newdelhi: 1440,
    chennai: 1190,
    hyderabad: 560,
    ahmedabad: 660,
    kolkata: 1780,
    jaipur: 1200,
    surat: 420,
    nagpur: 710,
    indore: 600,
    chandigarh: 1680,
  },
  mumbai: {
    delhi: 1420,
    newdelhi: 1420,
    bengaluru: 980,
    bangalore: 980,
    kochi: 1380,
    cochin: 1380,
    chennai: 1330,
    hyderabad: 710,
    ahmedabad: 530,
    kolkata: 1960,
    pune: 150,
    jaipur: 1150,
    surat: 280,
    nagpur: 830,
  },
  delhi: {
    mumbai: 1420,
    kochi: 2600,
    cochin: 2600,
    bengaluru: 2150,
    bangalore: 2150,
    chennai: 2180,
    kolkata: 1500,
    hyderabad: 1580,
    ahmedabad: 940,
    pune: 1440,
    jaipur: 280,
    chandigarh: 250,
  },
  bengaluru: {
    kochi: 550,
    cochin: 550,
    chennai: 350,
    hyderabad: 570,
    mumbai: 980,
    pune: 840,
    delhi: 2150,
    kolkata: 1870,
    ahmedabad: 1500,
  },
  chennai: {
    kochi: 690,
    cochin: 690,
    bengaluru: 350,
    hyderabad: 630,
    mumbai: 1330,
    pune: 1190,
    delhi: 2180,
    kolkata: 1670,
  },
  kochi: {
    pune: 1350,
    mumbai: 1380,
    delhi: 2600,
    bengaluru: 550,
    chennai: 690,
    hyderabad: 1060,
    kolkata: 2360,
    ahmedabad: 1820,
  },
};

/**
 * Estimates highway distance between two Indian cities.
 */
export function estimateDistanceKm(originCity: string, destCity: string): number {
  const o = (originCity || "").trim().toLowerCase().replace(/[^a-z]/g, "");
  const d = (destCity || "").trim().toLowerCase().replace(/[^a-z]/g, "");

  if (!o || !d) return 850; // Fallback default
  if (o === d) return 60; // Local inter-city delivery

  // Check direct lookup
  if (INDIAN_CITY_DISTANCES[o]?.[d]) {
    return INDIAN_CITY_DISTANCES[o][d];
  }
  // Check reverse lookup
  if (INDIAN_CITY_DISTANCES[d]?.[o]) {
    return INDIAN_CITY_DISTANCES[d][o];
  }

  // Check substring matches
  for (const cityA in INDIAN_CITY_DISTANCES) {
    if (o.includes(cityA) || cityA.includes(o)) {
      for (const cityB in INDIAN_CITY_DISTANCES[cityA]) {
        if (d.includes(cityB) || cityB.includes(d)) {
          return INDIAN_CITY_DISTANCES[cityA][cityB];
        }
      }
    }
  }

  // Deterministic fallback based on string length delta
  const charSum = (o + d).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 750 + (charSum % 800);
}

export interface PriceEstimationResult {
  distanceKm: number;
  weightKg: number;
  baseRatePerKm: number;
  weightMultiplier: number;
  totalPriceInr: number;
  formattedPrice: string;
  formattedDistance: string;
  ratePerKg: number;
}

/**
 * Calculates a dynamic, realistic market price estimation for freight loads.
 * @param originCity - Origin city name
 * @param destCity - Destination city name
 * @param weightKg - Cargo weight in Kilograms
 */
export function calculateDynamicPrice(
  originCity: string,
  destCity: string,
  weightKg: number
): PriceEstimationResult {
  const distanceKm = estimateDistanceKm(originCity, destCity);
  const weight = Math.max(100, Number(weightKg) || 10000);

  // Base highway operating cost per km (approx ₹32-₹38/km in India for commercial freight)
  const baseRatePerKm = 34.5;

  // Weight surcharge scaling: Base calibrated for 10 MT (10,000 kg), scaling up for heavy 20-35 MT
  const weightTons = weight / 1000;
  const weightMultiplier = Math.max(0.6, 0.75 + (weightTons / 20) * 0.55);

  // Fuel & toll corridor factor
  const corridorFactor = distanceKm > 1000 ? 1.05 : 1.0;

  const rawTotal = distanceKm * baseRatePerKm * weightMultiplier * corridorFactor;
  // Round to nearest hundred
  const totalPriceInr = Math.round(rawTotal / 100) * 100;
  const ratePerKg = Number((totalPriceInr / weight).toFixed(2));

  return {
    distanceKm,
    weightKg: weight,
    baseRatePerKm,
    weightMultiplier: Number(weightMultiplier.toFixed(2)),
    totalPriceInr,
    formattedPrice: new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(totalPriceInr),
    formattedDistance: `${distanceKm.toLocaleString()} km`,
    ratePerKg,
  };
}
