// Pure power logic shared by index.ts and ExponentPanel (so the panel never re-derives a result differently).

export type PowerKind = 'real' | 'complex' | 'indeterminate' | 'divByZero' | 'overflow';

export interface PowerAnalysis {
  kind: PowerKind;
  /** real: the value (may be 0 when it underflowed, see `underflow`). */
  value?: number;
  /** real overflow: sign of the infinite result. */
  negative?: boolean;
  /** complex (principal value): magnitude, real and imaginary parts. */
  magnitude?: number;
  re?: number;
  im?: number;
  /** A non-zero base gave a result below the smallest double (~5e-324), so `value` is 0. */
  underflow?: boolean;
}

import { parseNumberStrict } from '../../../utils/parseNumber';
export { parseNumberStrict };

/** Smallest-denominator fraction p/q (q <= maxDen) equal to x to ~12 digits, or null (e.g. 0.3333333333333333 -> 1/3). */
export function asRatio(x: number, maxDen = 1000): { p: number; q: number } | null {
  if (Number.isInteger(x)) return { p: x, q: 1 };
  const tol = 1e-12 * Math.max(1, Math.abs(x));
  for (let q = 2; q <= maxDen; q++) {
    const p = Math.round(x * q);
    if (Math.abs(x - p / q) <= tol) return { p, q };
  }
  return null;
}

/**
 * base ^ exp over the reals, with the cases a plain Math.pow gets wrong or hides:
 * - 0^0 is flagged indeterminate; 0^negative is a division by zero (Math.pow gives Infinity, which is not an "overflow")
 * - a negative base with a non-integer exponent p/q is real only for odd q ((-8)^(1/3) = -2, (-8)^(-1/3) = -1/2 and
 *   (-8)^(2/3) = +4: the sign is (-1)^p); for even q the principal complex value |b|^e (cos(pi e) + i sin(pi e)) is returned
 */
export function analyzePower(base: number, exp: number): PowerAnalysis {
  if (base === 0 && exp === 0) return { kind: 'indeterminate' };
  if (base === 0 && exp < 0) return { kind: 'divByZero' };

  if (base < 0 && !Number.isInteger(exp)) {
    const mag = Math.pow(-base, exp);
    const ratio = asRatio(exp);
    if (ratio && ratio.q % 2 === 1) {
      const value = Math.abs(ratio.p) % 2 === 1 ? -mag : mag;
      if (!Number.isFinite(value)) return { kind: 'overflow', negative: value < 0 };
      return { kind: 'real', value, underflow: value === 0 };
    }
    if (!Number.isFinite(mag)) return { kind: 'overflow', negative: false };
    const angle = Math.PI * exp;
    return { kind: 'complex', magnitude: mag, re: mag * Math.cos(angle), im: mag * Math.sin(angle) };
  }

  const value = Math.pow(base, exp);
  if (!Number.isFinite(value)) return { kind: 'overflow', negative: value < 0 };
  return { kind: 'real', value, underflow: value === 0 && base !== 0 };
}

const SUFFIX = ['th', 'st', 'nd', 'rd'];
/** 1st, 2nd, 3rd, 4th, 11th, 12th, 13th, 21st ... */
export function ordinal(n: number): string {
  const v = n % 100;
  return `${n}${SUFFIX[(v - 20) % 10] || SUFFIX[v] || SUFFIX[0]}`;
}
