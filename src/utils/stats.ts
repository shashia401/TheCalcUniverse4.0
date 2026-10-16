/**
 * Shared descriptive-statistics engine for average, mean-median-mode, standard-deviation, statistics,
 * descriptive-stats and correlation-calculator.
 *
 * All sums/means/variances use decimal.js at 50 significant digits (a private clone, so the global
 * Decimal config other modules rely on is untouched). Two-pass exact arithmetic means there is no
 * cancellation error: [1e9+4, 1e9+7, 1e9+13, 1e9+16] gives variance 30 exactly, where the textbook
 * sum-of-squares shortcut (E[x^2] - mean^2) loses every digit in binary floating point.
 *
 * Conventions (stated once, used everywhere):
 *  - variance / SD: sample = divide by n-1 (Bessel), population = divide by n. Undefined (null) for sample n < 2.
 *  - mode: every value with the maximum frequency, only if that frequency is > 1 (otherwise "no mode").
 *  - quartiles: 'halves' = median of the lower/upper half, median excluded when n is odd (Moore & McCabe, TI-83/84);
 *    'inclusive' = linear interpolation, Excel QUARTILE.INC / R type 7 / NumPy default;
 *    'exclusive' = Excel QUARTILE.EXC / R type 6 / Minitab (positions (n+1)p, clamped to min/max).
 *  - outliers: strictly below Q1 - 1.5 IQR or strictly above Q3 + 1.5 IQR.
 */
import Decimal from 'decimal.js';
import type { CalculatorResult } from '../types/calculator';

export const D = Decimal.clone({ precision: 50, rounding: Decimal.ROUND_HALF_UP });
export type Dec = Decimal;

const PLAIN_NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;
const THOUSANDS = /^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/;

export interface ParsedDataset {
  values: Dec[];
  /** Tokens that were not numbers (e.g. a header word); reported to the user, never silently dropped. */
  ignored: string[];
}

/**
 * Strict dataset parser. Separators: whitespace, semicolons, commas. Currency/percent signs are stripped.
 * A whitespace-delimited token that looks like a thousands-grouped number ("1,204" or "1,234,567.5") is read as ONE
 * number; "100, 200" (space after the comma) and "85,92" are read as separate values. Hex ("0x10"), "Infinity",
 * "NaN" and trailing junk ("12abc") are rejected, unlike parseFloat / new Decimal(string).
 */
export function parseDataset(raw: string | undefined): ParsedDataset {
  const values: Dec[] = [];
  const ignored: string[] = [];
  for (const chunk of (raw ?? '').split(/[\s;]+/)) {
    const cleaned = chunk.replace(/[$%€£]/g, '').replace(/^,+|,+$/g, '');
    if (!cleaned) {
      if (chunk.replace(/[,$%€£]/g, '')) ignored.push(chunk);
      continue;
    }
    const parts = THOUSANDS.test(cleaned) ? [cleaned.replace(/,/g, '')] : cleaned.split(/,+/);
    for (const p of parts) {
      if (PLAIN_NUMBER.test(p)) values.push(new D(p));
      else if (p) ignored.push(p);
    }
  }
  return { values, ignored };
}

const ZERO = new D(0);

export function sumOf(a: Dec[]): Dec {
  return a.reduce((s, v) => s.plus(v), ZERO);
}

export function sortedCopy(a: Dec[]): Dec[] {
  return [...a].sort((x, y) => x.comparedTo(y));
}

export function medianOfSorted(s: Dec[]): Dec {
  const n = s.length;
  if (n === 0) return ZERO;
  return n % 2 ? s[(n - 1) / 2] : s[n / 2 - 1].plus(s[n / 2]).div(2);
}

export type QuartileMethod = 'halves' | 'inclusive' | 'exclusive';

export function quartilesOfSorted(s: Dec[], method: QuartileMethod = 'halves'): { q1: Dec; q2: Dec; q3: Dec } {
  const n = s.length;
  if (n === 0) return { q1: ZERO, q2: ZERO, q3: ZERO };
  const q2 = medianOfSorted(s);
  if (n === 1) return { q1: s[0], q2, q3: s[0] };
  if (method === 'halves') {
    return { q1: medianOfSorted(s.slice(0, Math.floor(n / 2))), q2, q3: medianOfSorted(s.slice(Math.ceil(n / 2))) };
  }
  const at = (pos: number): Dec => {
    const p = Math.min(Math.max(pos, 0), n - 1);
    const lo = Math.floor(p);
    const frac = p - lo;
    return frac === 0 || lo + 1 >= n ? s[lo] : s[lo].plus(s[lo + 1].minus(s[lo]).times(frac));
  };
  // Exact rational positions: pos7 = (n-1)p, pos6 = (n+1)p - 1 with p = 1/4, 3/4 (multiples of 1/4 are exact in binary).
  return method === 'inclusive'
    ? { q1: at((n - 1) * 0.25), q2, q3: at((n - 1) * 0.75) }
    : { q1: at((n + 1) * 0.25 - 1), q2, q3: at((n + 1) * 0.75 - 1) };
}

export interface Summary {
  n: number;
  sorted: Dec[];
  sum: Dec;
  mean: Dec;
  median: Dec;
  modes: Dec[];
  modeCount: number;
  min: Dec;
  max: Dec;
  range: Dec;
  /** Sum of squared deviations from the mean, Σ(x−x̄)². */
  ss: Dec;
  varianceSample: Dec | null;
  variancePop: Dec;
  sdSample: Dec | null;
  sdPop: Dec;
  /** Standard error of the mean, s/√n (null for n < 2). */
  sem: Dec | null;
  q1: Dec;
  q3: Dec;
  iqr: Dec;
  lowerFence: Dec;
  upperFence: Dec;
  outliers: Dec[];
}

/** Everything the six stats calculators need, from one pass over a non-empty dataset. */
export function summarize(values: Dec[], method: QuartileMethod = 'halves'): Summary {
  if (values.length === 0) throw new Error('summarize() needs at least one value');
  const n = values.length;
  const sorted = sortedCopy(values);
  const sum = sumOf(values);
  const mean = sum.div(n);
  const ss = values.reduce((s, v) => s.plus(v.minus(mean).pow(2)), ZERO);
  const variancePop = ss.div(n);
  const varianceSample = n > 1 ? ss.div(n - 1) : null;

  const freq = new Map<string, { v: Dec; c: number }>();
  for (const v of sorted) {
    const k = v.toString();
    const e = freq.get(k);
    if (e) e.c++;
    else freq.set(k, { v, c: 1 });
  }
  let modeCount = 0;
  for (const { c } of freq.values()) modeCount = Math.max(modeCount, c);
  const modes = modeCount > 1 ? [...freq.values()].filter((e) => e.c === modeCount).map((e) => e.v) : [];

  const { q1, q3 } = quartilesOfSorted(sorted, method);
  const iqr = q3.minus(q1);
  const lowerFence = q1.minus(iqr.times(1.5));
  const upperFence = q3.plus(iqr.times(1.5));
  const sdSample = varianceSample ? varianceSample.sqrt() : null;

  return {
    n,
    sorted,
    sum,
    mean,
    median: medianOfSorted(sorted),
    modes,
    modeCount: modes.length ? modeCount : 0,
    min: sorted[0],
    max: sorted[n - 1],
    range: sorted[n - 1].minus(sorted[0]),
    ss,
    varianceSample,
    variancePop,
    sdSample,
    sdPop: variancePop.sqrt(),
    sem: sdSample ? sdSample.div(Math.sqrt(n)) : null,
    q1,
    q3,
    iqr,
    lowerFence,
    upperFence,
    outliers: values.filter((v) => v.lessThan(lowerFence) || v.greaterThan(upperFence)),
  };
}

/** Plain-notation string with up to `sig` significant digits and no trailing zeros ("87.6", "1297.142857"). */
export function fmtDec(d: Dec, sig = 10): string {
  if (d.isZero()) return '0';
  const r = d.toSignificantDigits(sig);
  return r.e >= -7 && r.e < 21 ? r.toFixed() : r.toExponential();
}

/** A visible warning row when some pasted tokens were not numbers (instead of silently dropping them). */
export function ignoredRow(ignored: string[]): CalculatorResult[] {
  if (!ignored.length) return [];
  const shown = ignored.slice(0, 8).join(', ');
  return [{
    id: 'ignored',
    label: 'Ignored (not numbers)',
    value: ignored.length > 8 ? `${shown} … (+${ignored.length - 8} more)` : shown,
    color: 'negative',
  }];
}

// ── Correlation ─────────────────────────────────────────────────────────

/** Average (mid) ranks, 1-based; tied values share the mean of the ranks they span. */
export function averageRanks(values: Dec[]): Dec[] {
  const idx = values.map((v, i) => ({ v, i })).sort((a, b) => a.v.comparedTo(b.v));
  const ranks: Dec[] = new Array(values.length);
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1].v.equals(idx[i].v)) j++;
    const r = new D(i + 1 + j + 1).div(2);
    for (let k = i; k <= j; k++) ranks[idx[k].i] = r;
    i = j + 1;
  }
  return ranks;
}

export interface Correlation {
  n: number;
  meanX: Dec;
  meanY: Dec;
  sxx: Dec;
  syy: Dec;
  sxy: Dec;
  /** Pearson r, or null when either variable is constant (undefined). */
  r: Dec | null;
}

export function pearson(x: Dec[], y: Dec[]): Correlation {
  const n = x.length;
  const meanX = sumOf(x).div(n);
  const meanY = sumOf(y).div(n);
  let sxx = ZERO;
  let syy = ZERO;
  let sxy = ZERO;
  for (let i = 0; i < n; i++) {
    const dx = x[i].minus(meanX);
    const dy = y[i].minus(meanY);
    sxx = sxx.plus(dx.times(dx));
    syy = syy.plus(dy.times(dy));
    sxy = sxy.plus(dx.times(dy));
  }
  const denom = sxx.times(syy).sqrt();
  let r: Dec | null = denom.isZero() ? null : sxy.div(denom);
  if (r) r = Decimal.max(-1, Decimal.min(1, r)) as Dec;
  return { n, meanX, meanY, sxx, syy, sxy, r };
}

/** Spearman rank correlation = Pearson r of the average ranks (correct with ties). */
export function spearman(x: Dec[], y: Dec[]): Dec | null {
  return pearson(averageRanks(x), averageRanks(y)).r;
}
