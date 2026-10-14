import { bigToScientific, factorialBig, groupDigits } from '../../../utils/bigMath';

export const PC_MAX = 1000;

/** nPr = n·(n−1)···(n−r+1), exact (the old double-precision n!/(n−r)! drifted off the integers). */
export function permBig(n: number, r: number): bigint {
  if (r < 0 || r > n) return 0n;
  let out = 1n;
  for (let i = 0; i < r; i++) out *= BigInt(n - i);
  return out;
}

/** nCr by the multiplicative formula; every intermediate division is exact. */
export function combBig(n: number, r: number): bigint {
  if (r < 0 || r > n) return 0n;
  const k = Math.min(r, n - r);
  let out = 1n;
  for (let i = 1; i <= k; i++) out = (out * BigInt(n - k + i)) / BigInt(i);
  return out;
}

/** Digit-grouped when it fits on a line, otherwise 7-significant-digit scientific notation (no float overflow). */
export function fmtBigCount(b: bigint): string {
  const s = b.toString();
  return s.length <= 21 ? groupDigits(s) : bigToScientific(b, 7);
}

export interface PermCombResult {
  n: number;
  r: number;
  isPerm: boolean;
  repetition: boolean;
  value: bigint;
  /** short symbol such as "5P3" / "5C3" / "5^3" / "C(7,3) multiset" */
  symbol: string;
  formula: string;
  applied: string;
  cells: { label: string; value: string }[];
}

export type PermCombParse = { kind: 'incomplete' } | { kind: 'invalid'; message: string } | { kind: 'ok'; result: PermCombResult };

export function computePermComb(nRaw: string | undefined, rRaw: string | undefined, orderRaw: string | undefined, repRaw?: string): PermCombParse {
  const ns = (nRaw ?? '').trim();
  const rs = (rRaw ?? '').trim();
  if (/^\d*\.\d*$|[eE]/.test(ns) && /\d/.test(ns)) return { kind: 'invalid', message: 'n must be a whole number.' };
  if (/^\d*\.\d*$|[eE]/.test(rs) && /\d/.test(rs)) return { kind: 'invalid', message: 'r must be a whole number.' };
  if (!/^\d+$/.test(ns) || !/^\d+$/.test(rs)) return { kind: 'incomplete' };
  const n = Number(ns);
  const r = Number(rs);
  if (n > PC_MAX || r > PC_MAX) return { kind: 'invalid', message: `n and r are limited to ${PC_MAX}.` };

  const isPerm = orderRaw === 'permutation';
  const repetition = repRaw === 'yes';
  const f = (x: bigint) => fmtBigCount(x);

  if (repetition) {
    if (isPerm) {
      const value = n === 0 && r === 0 ? 1n : BigInt(n) ** BigInt(r);
      return {
        kind: 'ok',
        result: { n, r, isPerm, repetition, value, symbol: `${n}^${r}`, formula: `P(n,r) with repetition = n^r`, applied: `${n}^${r} = ${f(value)}`, cells: [] },
      };
    }
    const value = n === 0 ? (r === 0 ? 1n : 0n) : combBig(n + r - 1, r);
    return {
      kind: 'ok',
      result: {
        n, r, isPerm, repetition, value,
        symbol: `C(${n + r - 1},${r})`,
        formula: `C(n+r−1, r) = (n+r−1)! / (r! × (n−1)!)`,
        applied: n === 0 ? `n = 0: ${r === 0 ? '1 way (choose nothing)' : 'no items to choose from, 0 ways'}` : `(${n}+${r}−1)! / (${r}! × ${n - 1}!) = ${f(value)}`,
        cells: n === 0 ? [] : [
          { label: '(n+r−1)!', value: f(factorialBig(n + r - 1)) },
          { label: 'r!', value: f(factorialBig(r)) },
          { label: '(n−1)!', value: f(factorialBig(n - 1)) },
        ],
      },
    };
  }

  const symbol = `${n}${isPerm ? 'P' : 'C'}${r}`;
  if (r > n) {
    return {
      kind: 'ok',
      result: {
        n, r, isPerm, repetition, value: 0n, symbol,
        formula: isPerm ? `P(${n},${r}) = ${n}! / (${n} − ${r})!` : `C(${n},${r}) = ${n}! / (${r}! × (${n} − ${r})!)`,
        applied: `r > n: you cannot choose ${r} different items from only ${n}, so there are 0 ways.`,
        cells: [],
      },
    };
  }
  const value = isPerm ? permBig(n, r) : combBig(n, r);
  const nf = factorialBig(n);
  const rf = factorialBig(r);
  const dif = factorialBig(n - r);
  return {
    kind: 'ok',
    result: {
      n, r, isPerm, repetition, value, symbol,
      formula: isPerm ? `P(${n},${r}) = ${n}! / (${n} − ${r})!` : `C(${n},${r}) = ${n}! / (${r}! × (${n} − ${r})!)`,
      applied: isPerm
        ? `${n}! / ${n - r}! = ${f(nf)} / ${f(dif)} = ${f(value)}`
        : `${n}! / (${r}! × ${n - r}!) = ${f(nf)} / (${f(rf)} × ${f(dif)}) = ${f(value)}`,
      cells: [
        { label: 'n!', value: f(nf) },
        { label: 'r!', value: f(rf) },
        { label: '(n−r)!', value: f(dif) },
      ],
    },
  };
}

/** Counts for r = 0..n (n ≤ 20 keeps every value a safe-to-plot double) for the bar chart. */
export function countsForChart(n: number, isPerm: boolean, repetition: boolean): number[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    if (repetition) return Number(isPerm ? (n === 0 && i === 0 ? 1n : BigInt(n) ** BigInt(i)) : n === 0 ? (i === 0 ? 1n : 0n) : combBig(n + i - 1, i));
    return Number(isPerm ? permBig(n, i) : combBig(n, i));
  });
}
