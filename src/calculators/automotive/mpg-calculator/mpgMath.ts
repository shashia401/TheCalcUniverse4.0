// US-gallon / mile conversions. L/100km = 100 x 3.785411784 / 1.609344 / mpg = 235.2146 / mpg.
export const L_PER_US_GAL = 3.785411784;
export const KM_PER_MILE = 1.609344;
export const MPG_TO_L100KM = (100 * L_PER_US_GAL) / KM_PER_MILE; // 235.2146...
export const mpgToL100km = (mpg: number) => MPG_TO_L100KM / mpg;
export const mpgToKmPerL = (mpg: number) => (mpg * KM_PER_MILE) / L_PER_US_GAL;
/** The range mode keeps 10% of the tank in reserve. */
export const PRACTICAL_TANK_FRACTION = 0.9;

export type MpgMode = 'mpg' | 'tripcost' | 'range' | 'convert';

export interface MpgCalc {
  mode: MpgMode;
  mpg?: number;
  l100km?: number;
  kpl?: number;
  tripCost?: number;
  gallons?: number;
  costPerMile?: number;
  range?: number;
  usable?: number;
  /** Set when the inputs are complete but unusable. */
  error?: string;
}

/** null = incomplete input. */
export function mpgCalc(values: Record<string, string>): MpgCalc | null {
  const mode = (values.mode || 'mpg') as MpgMode;
  const milesDriven = parseFloat(values.milesDriven);
  const gallonsUsed = parseFloat(values.gallonsUsed);
  const mpgIn = parseFloat(values.mpg);
  const fuelPrice = parseFloat(values.fuelPrice);
  const tankSize = parseFloat(values.tankSize);

  if (mode === 'mpg') {
    if (isNaN(milesDriven) || isNaN(gallonsUsed) || gallonsUsed <= 0) return null;
    if (milesDriven <= 0) return { mode, error: 'Miles driven must be greater than 0' };
    const mpg = milesDriven / gallonsUsed;
    return { mode, mpg, l100km: mpgToL100km(mpg), kpl: mpgToKmPerL(mpg) };
  }
  if (mode === 'tripcost') {
    if (isNaN(milesDriven) || isNaN(mpgIn) || isNaN(fuelPrice) || mpgIn <= 0) return null;
    if (milesDriven <= 0) return { mode, error: 'Miles driven must be greater than 0' };
    const gallons = milesDriven / mpgIn;
    const tripCost = gallons * fuelPrice;
    return { mode, gallons, tripCost, costPerMile: tripCost / milesDriven };
  }
  if (mode === 'range') {
    if (isNaN(tankSize) || isNaN(mpgIn) || mpgIn <= 0) return null;
    return { mode, range: tankSize * mpgIn, usable: tankSize * PRACTICAL_TANK_FRACTION * mpgIn };
  }
  if (mode === 'convert') {
    if (isNaN(mpgIn) || mpgIn <= 0) return null;
    return { mode, mpg: mpgIn, l100km: mpgToL100km(mpgIn), kpl: mpgToKmPerL(mpgIn) };
  }
  return null;
}
