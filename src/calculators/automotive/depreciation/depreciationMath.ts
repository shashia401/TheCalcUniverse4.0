// Year-by-year depreciation model. The rate tables are illustrative assumptions (not a quote from any
// guide): first-year loss for a typical new vehicle is commonly reported in the high teens to low 20s percent,
// slowing every year after. After year 10 the rate stays at 5% a year.

export type VehicleType = 'average' | 'luxury' | 'truck' | 'ev';

export const DEPRECIATION_RATES: Record<VehicleType, number[]> = {
  average: [0.20, 0.15, 0.12, 0.10, 0.09, 0.08, 0.07, 0.06, 0.05, 0.05],
  luxury: [0.25, 0.20, 0.15, 0.13, 0.11, 0.09, 0.08, 0.07, 0.06, 0.05],
  truck: [0.15, 0.12, 0.10, 0.08, 0.07, 0.06, 0.05, 0.05, 0.04, 0.04],
  ev: [0.22, 0.18, 0.14, 0.12, 0.10, 0.08, 0.07, 0.06, 0.05, 0.05],
};
export const TAIL_RATE = 0.05;

/** Value at a (possibly fractional) age: whole years compound the table rates; a part year uses that year's rate pro rata. */
export function valueAtAge(newPrice: number, type: VehicleType, age: number): number {
  const rates = DEPRECIATION_RATES[type] ?? DEPRECIATION_RATES.average;
  let v = newPrice;
  for (let y = 0; y < Math.ceil(age); y++) {
    const frac = Math.min(1, age - y);
    v *= Math.pow(1 - (rates[y] ?? TAIL_RATE), frac);
  }
  return v;
}

export interface Depreciation {
  newPrice: number;
  age: number;
  yearsOwned: number;
  type: VehicleType;
  valueNow: number;
  futureValue: number;
  totalDepreciation: number;
  depreciationPct: number;
  annual: number;
  monthly: number;
}

export function depreciation(values: Record<string, string>): Depreciation | null {
  const newPrice = parseFloat(values.purchasePrice);
  const age = Math.max(0, parseFloat(values.vehicleAge) || 0);
  const yearsOwned = parseFloat(values.yearsOwned);
  if (!Number.isFinite(newPrice) || !Number.isFinite(yearsOwned) || newPrice <= 0 || yearsOwned <= 0) return null;
  const type = (values.vehicleType || 'average') as VehicleType;
  const valueNow = valueAtAge(newPrice, type, age);
  const futureValue = valueAtAge(newPrice, type, age + yearsOwned);
  const totalDepreciation = valueNow - futureValue;
  return {
    newPrice, age, yearsOwned, type, valueNow, futureValue, totalDepreciation,
    depreciationPct: (totalDepreciation / valueNow) * 100,
    annual: totalDepreciation / yearsOwned,
    monthly: totalDepreciation / (yearsOwned * 12),
  };
}
