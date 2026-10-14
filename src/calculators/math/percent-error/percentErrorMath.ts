import Decimal from 'decimal.js';

// Private Decimal constructor so the shared global Decimal config is left alone.
const D = Decimal.clone({ precision: 30, rounding: Decimal.ROUND_HALF_UP });

export type PercentErrorResult =
  | { kind: 'incomplete' }
  | { kind: 'error'; message: string }
  | {
      kind: 'ok';
      accepted: Decimal;
      experimental: Decimal;
      absoluteError: Decimal;
      /** |vA − vE| / |vA| × 100 */
      percentError: Decimal;
      /** (vE − vA) / |vA| × 100, positive = overestimate */
      signedError: Decimal;
      /** 100 − percent error, floored at 0 (an error above 100% is not a negative accuracy) */
      accuracy: Decimal;
      relativeError: Decimal;
      direction: 'overestimate' | 'underestimate' | 'exact';
    };

function parse(s: string | undefined): Decimal | null {
  const t = (s ?? '').trim();
  if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t)) return null;
  try {
    const d = new D(t);
    return d.isFinite() ? d : null;
  } catch {
    return null;
  }
}

/** Plain-notation, 4 decimal places, trailing zeros trimmed, never "1e+21" (Decimal#toFixed never uses exponents). */
export const fmt4 = (n: Decimal): string => {
  const s = n.toDecimalPlaces(4).toFixed();
  return s === '-0' ? '0' : s;
};

export function computePercentError(acceptedStr: string | undefined, experimentalStr: string | undefined): PercentErrorResult {
  const a = parse(acceptedStr);
  const e = parse(experimentalStr);
  if (!a || !e) return { kind: 'incomplete' };
  if (a.isZero()) return { kind: 'error', message: 'The accepted value cannot be zero (percent error divides by it). Use the absolute error instead.' };
  if (Math.abs(a.e) > 100 || (!e.isZero() && Math.abs(e.e) > 100)) return { kind: 'error', message: 'Values must be between 1e-100 and 1e100.' };

  const diff = e.minus(a);
  const absoluteError = diff.abs();
  const relativeError = absoluteError.div(a.abs());
  const percentError = relativeError.times(100);
  const signedError = diff.div(a.abs()).times(100);
  const accuracy = Decimal.max(0, new D(100).minus(percentError));
  return {
    kind: 'ok',
    accepted: a,
    experimental: e,
    absoluteError,
    percentError,
    signedError,
    accuracy,
    relativeError,
    direction: diff.isZero() ? 'exact' : diff.isPositive() ? 'overestimate' : 'underestimate',
  };
}
