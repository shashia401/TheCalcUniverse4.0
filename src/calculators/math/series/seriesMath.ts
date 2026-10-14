import { safeEval } from '../shared/safeEval';

export const SERIES_MAX_TERMS = 10000;

export interface SeriesRun {
  start: number;
  /** the end index actually summed (smaller than the requested end when the cap was hit) */
  end: number;
  requestedEnd: number;
  truncated: boolean;
  sum: number;
  terms: number[];
  count: number;
  last: number;
}

export type SeriesOutcome =
  | { kind: 'incomplete' }
  | { kind: 'error'; message: string }
  | { kind: 'ok'; run: SeriesRun };

/** Neumaier-compensated summation: terms of very different size (1 + 1e-16 + ... ) do not lose the small ones. */
export function compensatedSum(values: number[]): number {
  let sum = 0;
  let c = 0;
  for (const v of values) {
    const t = sum + v;
    c += Math.abs(sum) >= Math.abs(v) ? sum - t + v : v - t + sum;
    sum = t;
  }
  return sum + c;
}

const safeInt = (s: string | undefined): number | null => {
  const t = (s ?? '').trim();
  if (!/^[+-]?\d+$/.test(t)) return null;
  const n = Number(t);
  return Number.isSafeInteger(n) ? n : null;
};

/** Σ_{n=start}^{end} f(n). Any term that cannot be evaluated is reported; the old code skipped or discarded it silently. */
export function runSeries(startRaw: string | undefined, endRaw: string | undefined, expressionRaw: string | undefined): SeriesOutcome {
  const expression = (expressionRaw ?? '').trim();
  const start = safeInt(startRaw);
  const end = safeInt(endRaw);
  if (start === null || end === null || !expression) return { kind: 'incomplete' };
  if (start > end) return { kind: 'error', message: `The start index (${start}) must not be larger than the end index (${end}).` };

  const actualEnd = Math.min(end, start + SERIES_MAX_TERMS - 1);
  const terms: number[] = [];
  for (let n = start; n <= actualEnd; n++) {
    let v: number;
    try {
      v = safeEval(expression, { n });
    } catch (e) {
      const msg = (e as Error).message || 'invalid expression';
      const hint = /Unexpected|Expected/.test(msg) ? ' Use * for multiplication (write 2*n, not 2n) and ^ for powers.' : '';
      return { kind: 'error', message: `Cannot evaluate the expression at n = ${n}: ${msg}.${hint}` };
    }
    if (!Number.isFinite(v)) return { kind: 'error', message: `The term at n = ${n} is not a finite number.` };
    terms.push(v);
  }
  const sum = compensatedSum(terms);
  if (!Number.isFinite(sum)) return { kind: 'error', message: 'The sum is too large to represent (it overflows a double).' };
  return {
    kind: 'ok',
    run: { start, end: actualEnd, requestedEnd: end, truncated: actualEnd < end, sum, terms, count: terms.length, last: terms[terms.length - 1] },
  };
}

/** 10 decimals for ordinary sizes, 10 significant digits in exponent form otherwise (1/2^40 used to print as "0", 20! as a fake-exact integer). */
export function fmtTermValue(n: number): string {
  if (n === 0) return '0';
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString();
  const a = Math.abs(n);
  if (a >= 1e-4 && a < 1e15) return parseFloat(n.toFixed(10)).toString();
  return n.toExponential(9).replace(/\.?0+e/, 'e');
}
