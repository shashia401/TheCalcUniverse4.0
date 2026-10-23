import { MAX_FACTOR_INPUT, factorize } from '../../../utils/numberTheory';
import { gcdBig } from '../../../utils/rational';

export const LCM_MAX_COUNT = 30;
export const LCM_MAX_DIGITS = 100;

export type LcmParse =
  | { kind: 'incomplete' }
  | { kind: 'invalid'; message: string }
  | { kind: 'ok'; nums: bigint[] };

/**
 * "12, 18 24" -> [12n, 18n, 24n]. Every token must be a positive whole number: the old parseInt() silently turned
 * "2.5" into 2 and dropped "x" / "-3" from the list, which changed the LCM without telling the user.
 */
export function parseLcmInput(raw: string | undefined): LcmParse {
  const tokens = (raw ?? '').split(/[,;\s]+/).filter(Boolean);
  if (tokens.length < 2) return { kind: 'incomplete' };
  if (tokens.length > LCM_MAX_COUNT) return { kind: 'invalid', message: `Enter at most ${LCM_MAX_COUNT} numbers.` };
  const nums: bigint[] = [];
  for (const t of tokens) {
    if (!/^\d+$/.test(t)) return { kind: 'invalid', message: `"${t.slice(0, 20)}" is not a positive whole number.` };
    if (t.length > LCM_MAX_DIGITS) return { kind: 'invalid', message: `Numbers are limited to ${LCM_MAX_DIGITS} digits.` };
    const n = BigInt(t);
    if (n === 0n) return { kind: 'invalid', message: 'Zero has no least common multiple with other numbers (LCM(0, n) is 0 by convention); enter positive numbers.' };
    nums.push(n);
  }
  return { kind: 'ok', nums };
}

export interface LcmAnalysis {
  lcm: bigint;
  /** GCD of all the numbers. */
  gcd: bigint;
  /** Pairwise chain, one line per step: "LCM(12, 18) = (12 × 18) / 6 = 36". */
  steps: string[];
  /** Prime factorisations (only for numbers that fit a safe integer); null entries are too big to factor here. */
  factors: ([number, number][] | null)[];
  /** Highest exponent of each prime across the factorable numbers (null when any number is too big). */
  lcmFactors: [number, number][] | null;
}

export function analyzeLcm(nums: bigint[]): LcmAnalysis {
  let lcm = nums[0];
  let gcd = nums[0];
  const steps: string[] = [];
  for (let i = 1; i < nums.length; i++) {
    const g = gcdBig(lcm, nums[i]);
    const next = (lcm / g) * nums[i];
    steps.push(`LCM(${lcm}, ${nums[i]}) = (${lcm} × ${nums[i]}) / ${g} = ${next}`);
    lcm = next;
    gcd = gcdBig(gcd, nums[i]);
  }
  const limit = BigInt(MAX_FACTOR_INPUT);
  const factors = nums.map((n) => (n <= limit ? factorize(Number(n)) : null));
  let lcmFactors: [number, number][] | null = null;
  if (factors.every((f) => f !== null)) {
    const max = new Map<number, number>();
    for (const f of factors as [number, number][][]) for (const [p, e] of f) max.set(p, Math.max(max.get(p) ?? 0, e));
    lcmFactors = [...max.entries()].sort((a, b) => a[0] - b[0]);
  }
  return { lcm, gcd, steps, factors, lcmFactors };
}

/** First `count` multiples of n as plain numbers; null when they would pass 2^53 (a double is no longer exact). */
export function multiplesOf(n: bigint, count: number): number[] | null {
  if (n * BigInt(count) > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  return Array.from({ length: count }, (_, i) => Number(n) * (i + 1));
}

export interface LadderRow {
  /** The prime every divisible entry was divided by on this row. */
  divisor: number;
  /** The row of numbers after dividing (entries the prime did not divide are brought down unchanged). */
  values: number[];
}

/**
 * Division (ladder / cake) method: divide by a prime that divides at least one entry, bring down the entries it does not
 * divide, and repeat until every entry is 1. The LCM is the product of the divisors. Null when a number is too big to factor
 * exactly, or when the ladder would be longer than `maxRows` (the table would stop being readable).
 */
export function ladderMethod(nums: bigint[], maxRows = 24): { start: number[]; rows: LadderRow[] } | null {
  const limit = BigInt(MAX_FACTOR_INPUT);
  if (nums.some((n) => n > limit)) return null;
  const start = nums.map(Number);
  const primes = new Set<number>();
  for (const n of start) for (const [p] of factorize(n)) primes.add(p);
  let current = start.slice();
  const rows: LadderRow[] = [];
  for (const p of [...primes].sort((a, b) => a - b)) {
    while (current.some((v) => v % p === 0)) {
      current = current.map((v) => (v % p === 0 ? v / p : v));
      rows.push({ divisor: p, values: current });
      if (rows.length > maxRows) return null;
    }
  }
  return { start, rows };
}

export type LcmFractionParse =
  | { kind: 'none' }
  | { kind: 'incomplete' }
  | { kind: 'invalid'; message: string }
  | { kind: 'ok'; fractions: { n: bigint; d: bigint }[]; reduced: boolean };

/**
 * "1/2, 3/4" -> two fractions in lowest terms. Fraction mode starts as soon as any token contains "/". Whole numbers in the
 * same list count as n/1. Mixed numbers are not read ("1 1/2" would be two tokens), so the help text says to write 3/2.
 */
export function parseLcmFractionInput(raw: string | undefined): LcmFractionParse {
  if (!(raw ?? '').includes('/')) return { kind: 'none' };
  const tokens = (raw ?? '').split(/[,;\s]+/).filter(Boolean);
  if (tokens.length < 2) return { kind: 'incomplete' };
  if (tokens.length > LCM_MAX_COUNT) return { kind: 'invalid', message: `Enter at most ${LCM_MAX_COUNT} fractions.` };
  const fractions: { n: bigint; d: bigint }[] = [];
  let reduced = false;
  for (const t of tokens) {
    const m = /^(\d+)(?:\/(\d+))?$/.exec(t);
    if (!m) return { kind: 'invalid', message: `"${t.slice(0, 20)}" is not a fraction like 3/4 or a whole number. Write mixed numbers as improper fractions (1 1/2 = 3/2).` };
    if (m[1].length > LCM_MAX_DIGITS || (m[2] ?? '').length > LCM_MAX_DIGITS) return { kind: 'invalid', message: `Numbers are limited to ${LCM_MAX_DIGITS} digits.` };
    let n = BigInt(m[1]);
    let d = BigInt(m[2] ?? '1');
    if (d === 0n) return { kind: 'invalid', message: `"${t.slice(0, 20)}" has a denominator of zero.` };
    if (n === 0n) return { kind: 'invalid', message: 'Zero has no least common multiple with other numbers; enter positive fractions.' };
    const g = gcdBig(n, d);
    if (g > 1n) { n /= g; d /= g; reduced = true; }
    fractions.push({ n, d });
  }
  return { kind: 'ok', fractions, reduced };
}

export interface LcmFractionAnalysis {
  /** LCM of the numerators (fractions in lowest terms). */
  lcmNum: bigint;
  /** GCD of the denominators. */
  gcdDen: bigint;
  /** LCM of the fractions = lcmNum / gcdDen, already in lowest terms. */
  lcm: { n: bigint; d: bigint };
  /** Least common denominator: the LCM of the denominators, used to add or compare the fractions. */
  lcd: bigint;
  /** Each fraction rewritten over the LCD. */
  overLcd: { n: bigint; d: bigint }[];
  /** How many times each fraction goes into the LCM (always a whole number). */
  times: bigint[];
}

export function analyzeLcmFractions(fractions: { n: bigint; d: bigint }[]): LcmFractionAnalysis {
  let lcmNum = fractions[0].n;
  let gcdDen = fractions[0].d;
  let lcd = fractions[0].d;
  for (const f of fractions.slice(1)) {
    lcmNum = (lcmNum / gcdBig(lcmNum, f.n)) * f.n;
    gcdDen = gcdBig(gcdDen, f.d);
    lcd = (lcd / gcdBig(lcd, f.d)) * f.d;
  }
  // A prime dividing every denominator cannot divide any numerator (each fraction is in lowest terms), so this is reduced.
  const lcm = { n: lcmNum, d: gcdDen };
  return {
    lcmNum,
    gcdDen,
    lcm,
    lcd,
    overLcd: fractions.map((f) => ({ n: f.n * (lcd / f.d), d: lcd })),
    times: fractions.map((f) => (lcm.n * f.d) / (lcm.d * f.n)),
  };
}

export const fractionText = (f: { n: bigint; d: bigint }): string => (f.d === 1n ? f.n.toString() : `${f.n}/${f.d}`);
