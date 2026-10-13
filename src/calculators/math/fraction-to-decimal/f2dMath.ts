// Pure, exact conversion logic shared by index.ts and FractionToDecimalPanel (no result-string parsing).
import {
  Frac,
  makeFrac,
  divFrac,
  mulFrac,
  subFrac,
  parseDecimalExact,
  decimalExpansion,
  formatExpansion,
  fracToFixed,
} from '../../../utils/rational';

export type F2dMode = 'ftod' | 'dtof' | 'mixed';

export interface F2dComputation {
  mode: F2dMode;
  /** The value as an exact reduced fraction. */
  frac: Frac;
  /** Unreduced improper fraction (mixed -> improper conversion), else null. */
  improper: { n: bigint; d: bigint } | null;
  /** Fraction drawn in the pie (as entered when whole numbers, else the reduced value). */
  viz: { n: bigint; d: bigint; label: string };
}

export type F2dOutcome =
  | { kind: 'incomplete' }
  | { kind: 'invalid'; message: string }
  | { kind: 'ok'; comp: F2dComputation };

const blank = (v: string | undefined) => (v ?? '').trim() === '';
const isWhole = (f: Frac) => f.d === 1n;

export function computeF2d(values: Record<string, string>): F2dOutcome {
  const mode: F2dMode = values.mode === 'dtof' || values.mode === 'mixed' ? values.mode : 'ftod';

  if (mode === 'dtof') {
    if (blank(values.decimal)) return { kind: 'incomplete' };
    const frac = parseDecimalExact(values.decimal);
    if (!frac) return { kind: 'invalid', message: 'Enter the decimal as plain digits, e.g. 0.75 or -2.5.' };
    return { kind: 'ok', comp: { mode, frac, improper: null, viz: { n: frac.n, d: frac.d, label: `${frac.n}/${frac.d}` } } };
  }

  if (blank(values.numerator) || blank(values.denominator)) return { kind: 'incomplete' };
  const num = parseDecimalExact(values.numerator);
  const den = parseDecimalExact(values.denominator);
  if (!num || !den) return { kind: 'invalid', message: 'Numerator and denominator must be plain numbers.' };
  if (den.n === 0n) return { kind: 'invalid', message: 'The denominator cannot be zero.' };

  if (mode === 'ftod') {
    const frac = divFrac(num, den);
    const whole = isWhole(num) && isWhole(den);
    return {
      kind: 'ok',
      comp: {
        mode,
        frac,
        improper: null,
        viz: whole
          ? { n: num.n, d: den.n, label: `${num.n}/${den.n}` }
          : { n: frac.n, d: frac.d, label: `${frac.n}/${frac.d}` },
      },
    };
  }

  // mixed number: the sign belongs to the whole number, the fraction part is a magnitude
  const wholeRaw = blank(values.wholeNumber) ? { n: 0n, d: 1n } : parseDecimalExact(values.wholeNumber);
  if (!wholeRaw || !isWhole(wholeRaw)) return { kind: 'invalid', message: 'The whole-number part must be an integer.' };
  if (!isWhole(num) || !isWhole(den)) {
    return { kind: 'invalid', message: 'Numerator and denominator of a mixed number must be integers.' };
  }
  if (num.n < 0n || den.n < 0n) {
    return {
      kind: 'invalid',
      message: 'Put the minus sign on the whole number (−2 3/4 means −(2 + 3/4)); the fraction part must not be negative.',
    };
  }
  const w = wholeRaw.n;
  const negative = w < 0n;
  const absW = negative ? -w : w;
  const impN = absW * den.n + num.n;
  const sign = negative ? -1n : 1n;
  const frac = makeFrac(sign * impN, den.n);
  return {
    kind: 'ok',
    comp: {
      mode,
      frac,
      improper: { n: sign * impN, d: den.n },
      viz: { n: impN, d: den.n, label: `${w === 0n ? '' : `${w} `}${num.n}/${den.n}` },
    },
  };
}

export const percentOf = (f: Frac): string => `${fracToFixed(mulFrac(f, makeFrac(100n, 1n)), 4)}%`;

/** Rounded decimal (<= 10 places) and the exact expansion with its repeating block / period. */
export function describeDecimal(f: Frac) {
  const e = decimalExpansion(f, 2000);
  const rounded = fracToFixed(f, 10);
  const terminating = !e.repeating && !e.truncated;
  return {
    rounded,
    exact: formatExpansion(e),
    terminating,
    period: e.repeating.length,
    truncated: e.truncated,
  };
}

/**
 * Best rational approximation of f with denominator <= maxDen (continued-fraction convergents plus the
 * best semiconvergent), used to suggest 1/3 for the typed decimal 0.333333.
 */
export function nearestSimpleFraction(f: Frac, maxDen = 1000n): Frac {
  if (f.d <= maxDen) return f;
  const neg = f.n < 0n;
  const target: Frac = neg ? { n: -f.n, d: f.d } : f;
  const err = (x: Frac): Frac => absFrac(subFrac(x, target));
  let [p0, q0, p1, q1] = [0n, 1n, 1n, 0n]; // h(-2)/k(-2), h(-1)/k(-1)
  let [n, d] = [target.n, target.d];
  while (d !== 0n) {
    const a = n / d;
    const q2 = a * q1 + q0;
    if (q2 > maxDen) {
      const k = (maxDen - q0) / q1; // largest semiconvergent step that still fits
      const c1 = makeFrac(p1, q1);
      const c2 = makeFrac(k * p1 + p0, k * q1 + q0);
      const e1 = err(c1);
      const e2 = err(c2);
      const best = e2.n * e1.d < e1.n * e2.d ? c2 : c1;
      return neg ? { n: -best.n, d: best.d } : best;
    }
    [p0, q0, p1, q1] = [p1, q1, a * p1 + p0, q2];
    [n, d] = [d, n - a * d];
  }
  const exact = makeFrac(p1, q1);
  return neg ? { n: -exact.n, d: exact.d } : exact;
}

const absFrac = (x: Frac): Frac => (x.n < 0n ? { n: -x.n, d: x.d } : x);
