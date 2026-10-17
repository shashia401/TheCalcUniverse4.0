// Mass / volume / density unit maths shared by the density, mass and weight calculators (they each carried a copy).
// Factors are exact by definition: 1 lb = 0.45359237 kg, 1 ft = 0.3048 m, so 1 ft^3 = 0.3048^3 m^3.

export const LB_KG = 0.45359237;
export const FT3_M3 = 0.3048 ** 3; // 0.028316846592
export const LBFT3_KGM3 = LB_KG / FT3_M3; // 16.01846337...
/** Standard value people expect on a weight calculator; the true standard gravity is 9.80665 m/s^2. */
export const G_EARTH = 9.81;

export function massToKg(v: number, unit: string): number {
  if (unit === 'g') return v / 1000;
  if (unit === 'lb') return v * LB_KG;
  return v;
}

export function volumeToM3(v: number, unit: string): number {
  switch (unit) {
    case 'mL':
    case 'cm3':
      return v / 1e6;
    case 'L':
      return v / 1000;
    case 'ft3':
      return v * FT3_M3;
    default:
      return v;
  }
}

export function densityToKgm3(v: number, unit: string): number {
  if (unit === 'g/cm3') return v * 1000;
  if (unit === 'lbs/ft3') return v * LBFT3_KGM3;
  return v;
}

/**
 * Display a number without float noise and without silently turning tiny values into 0
 * (the old toFixed(8) printed 3e-10 as "0"): 10 significant digits, scientific notation outside 1e-6 .. 1e15.
 */
export function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return 'Infinity';
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs < 1e-6 || abs >= 1e15) return n.toExponential(6).replace(/\.?0+e/, 'e');
  return parseFloat(n.toPrecision(10)).toString();
}

export { parseNonNegative as nonNegative } from './parseNumber';
