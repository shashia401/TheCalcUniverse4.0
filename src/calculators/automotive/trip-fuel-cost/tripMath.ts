import { KM_PER_MILE, MPG_TO_L100KM } from '../mpg-calculator/mpgMath';

export interface TripFuel {
  metric: boolean; // efficiency entered as L/100km (price is then per liter)
  distanceMiles: number;
  distanceKm: number;
  /** Gallons when efficiency is MPG, liters when L/100km. */
  fuelAmount: number;
  totalCost: number;
  passengers: number;
  costPerPerson: number;
  /** Per 100 miles when efficiency is MPG, per 100 km when L/100km. */
  costPer100: number;
}

/**
 * The fuel price is quoted in the same system as the efficiency: per US gallon with MPG, per liter with L/100km.
 * The trip distance can be in either unit; it is converted to the efficiency's system.
 * null = incomplete input; { error } = unusable input.
 */
export function tripFuel(values: Record<string, string>): TripFuel | { error: string } | null {
  const distance = parseFloat(values.distance);
  const efficiency = parseFloat(values.fuelEfficiency);
  const fuelPrice = parseFloat(values.fuelPrice);
  if ([distance, efficiency, fuelPrice].some(isNaN) || efficiency <= 0) return null;
  if (distance < 0) return { error: 'Distance cannot be negative' };

  const passengers = Math.max(1, Math.floor(parseFloat(values.passengers) || 1));
  const distanceMiles = values.distanceUnit === 'km' ? distance / KM_PER_MILE : distance;
  const distanceKm = distanceMiles * KM_PER_MILE;
  const metric = values.efficiencyUnit === 'l100km';

  const fuelAmount = metric ? (distanceKm * efficiency) / 100 : distanceMiles / efficiency;
  const totalCost = fuelAmount * fuelPrice;
  // Independent of trip length (and defined for a 0 distance trip).
  const costPer100 = metric ? efficiency * fuelPrice : (100 / efficiency) * fuelPrice;
  return { metric, distanceMiles, distanceKm, fuelAmount, totalCost, passengers, costPerPerson: totalCost / passengers, costPer100 };
}

/** MPG equivalent of an L/100km figure (US gallons); kept here for the education text and tests. */
export const l100kmToMpg = (l: number) => MPG_TO_L100KM / l;
