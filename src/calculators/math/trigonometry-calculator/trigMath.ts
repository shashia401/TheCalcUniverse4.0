// Trig values of an angle with exact special-angle handling.
//
// The old code evaluated Math.tan(90 * pi/180) = 1.6e16 and printed it as a value, and called
// 1/sin undefined for any |sin| < 1e-10. Here the angle is reduced modulo 360 exactly (decimal degrees are
// read as exact fractions) and then evaluated through its first-quadrant reference angle, so every
// multiple of 15° is exact and tan(90°), csc(0°), sec(90°) and cot(0°) are reported as undefined.

import { type Frac, fracToNumber, makeFrac, parseDecimalExact } from '../../../utils/rational';

export const DEG = Math.PI / 180;

export interface TrigValues {
  /** angle reduced to [0, 360) */
  normDeg: number;
  /** acute angle to the x-axis, in [0, 90] */
  refDeg: number;
  quadrant: string;
  sin: number;
  cos: number;
  tan: number | null; // null = undefined
  csc: number | null;
  sec: number | null;
  cot: number | null;
  /** radical forms for multiples of 15° */
  exact?: { sin: string; cos: string; tan: string | null };
}

const SIN15 = ['0', '(√6 − √2)/4', '1/2', '√2/2', '√3/2', '(√6 + √2)/4', '1'];
const COS15 = [...SIN15].reverse();
const TAN15: (string | null)[] = ['0', '2 − √3', '√3/3', '1', '√3', '2 + √3', null];

const neg = (s: string): string => (s === '0' ? '0' : /[+−] /.test(s) && !s.startsWith('(') ? `-(${s})` : `-${s}`);

/** Reduce an exact degree value into [0, 360). */
export function reduceDegrees(deg: Frac): Frac {
  const m = 360n * deg.d;
  let n = deg.n % m;
  if (n < 0n) n += m;
  return makeFrac(n, deg.d);
}

/** Parse a decimal degree string exactly; null when malformed. */
export const parseDegrees = (raw: string | undefined): Frac | null => parseDecimalExact(raw, 40);

/** Approximate degrees from radians, snapped to the nearest multiple of 15° when within 1e-9 (π/6 rad is 30°, not 30.000000000000004°). */
export function degreesFromRadians(rad: number): number {
  const d = (rad * 180) / Math.PI;
  const n = Math.round(d / 15) * 15;
  return Math.abs(d - n) < 1e-9 * Math.max(1, Math.abs(d)) ? n : d;
}

/** Trig values from an angle given as normalised degrees (exact multiples of 15 pass `exactMultiple15`). */
export function trigAt(normDeg: number): TrigValues {
  // Only re-normalise when needed: (1e-6 % 360 + 360) % 360 loses the low digits of a tiny angle.
  const n = normDeg >= 0 && normDeg < 360 ? normDeg : ((normDeg % 360) + 360) % 360;
  let ref: number;
  let quadrant: string;
  if (n === 0) [ref, quadrant] = [0, '+x axis'];
  else if (n < 90) [ref, quadrant] = [n, 'Quadrant I'];
  else if (n === 90) [ref, quadrant] = [90, '+y axis'];
  else if (n < 180) [ref, quadrant] = [180 - n, 'Quadrant II'];
  else if (n === 180) [ref, quadrant] = [0, '-x axis'];
  else if (n < 270) [ref, quadrant] = [n - 180, 'Quadrant III'];
  else if (n === 270) [ref, quadrant] = [90, '-y axis'];
  else [ref, quadrant] = [360 - n, 'Quadrant IV'];

  const sinSign = n > 180 ? -1 : 1; // sin < 0 in III, IV
  const cosSign = n > 90 && n < 270 ? -1 : 1; // cos < 0 in II, III
  const sRef = ref === 0 ? 0 : ref === 90 ? 1 : Math.sin(ref * DEG);
  const cRef = ref === 0 ? 1 : ref === 90 ? 0 : Math.cos(ref * DEG);
  const sin = sinSign * sRef;
  const cos = cosSign * cRef;
  const tan = cRef === 0 ? null : (sinSign * cosSign * sRef) / cRef;
  const out: TrigValues = {
    normDeg: n,
    refDeg: ref,
    quadrant,
    sin: sin === 0 ? 0 : sin,
    cos: cos === 0 ? 0 : cos,
    tan: tan === 0 ? 0 : tan,
    csc: sRef === 0 ? null : 1 / sin,
    sec: cRef === 0 ? null : 1 / cos,
    cot: sRef === 0 ? null : cRef === 0 ? 0 : cos / sin,
  };
  if (Number.isInteger(ref / 15)) {
    const i = ref / 15;
    out.exact = {
      sin: sinSign < 0 ? neg(SIN15[i]) : SIN15[i],
      cos: cosSign < 0 ? neg(COS15[i]) : COS15[i],
      tan: TAN15[i] === null ? null : sinSign * cosSign < 0 ? neg(TAN15[i]!) : TAN15[i],
    };
  }
  return out;
}

/** Acute angle between the terminal side and the x-axis for any normalised angle in [0, 360). */
export function referenceAngle(normDeg: number): number {
  const n = normDeg >= 0 && normDeg < 360 ? normDeg : ((normDeg % 360) + 360) % 360;
  if (n <= 90) return n;
  if (n <= 180) return 180 - n;
  if (n <= 270) return n - 180;
  return 360 - n;
}

/** "π/6", "2π/3", "π", "0" for multiples of 15°; null otherwise. */
export function piFraction(deg: number): string | null {
  const k = Math.round(deg / 15);
  if (Math.abs(deg - 15 * k) > 1e-9 * Math.max(1, Math.abs(deg))) return null;
  if (k === 0) return '0';
  const g = (a: number, b: number): number => (b ? g(b, a % b) : a);
  const d = 12;
  const gg = g(Math.abs(k), d);
  const num = k / gg;
  const den = d / gg;
  const sign = num < 0 ? '-' : '';
  const an = Math.abs(num);
  return `${sign}${an === 1 ? '' : an}π${den === 1 ? '' : `/${den}`}`;
}

export const toFloat = fracToNumber;
