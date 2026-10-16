/**
 * Probability distributions (normal, Student t, chi-square, F) built on two verified special functions:
 * the regularized incomplete gamma P/Q(a, x) and the regularized incomplete beta I_x(a, b)
 * (series + modified-Lentz continued fractions, Numerical Recipes 6.2 / 6.4, tolerance ~1e-15).
 *
 * Tail functions are computed DIRECTLY (never as 1 - cdf) so extreme p-values keep full relative precision
 * (e.g. normSf(10) = 7.6198530241605e-24). Checked against scipy.stats in test/calculators/math/distributions.test.ts.
 */

const EPS = 1e-16;
const TINY = 1e-300;
const MAX_ITER = 100000;

const LANCZOS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
  12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

/** ln Γ(x) for x > 0 (Lanczos g=7, n=9; ~1e-15 relative). */
export function lnGamma(x: number): number {
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
  const z = x - 1;
  let s = LANCZOS[0];
  for (let i = 1; i < 9; i++) s += LANCZOS[i] / (z + i);
  const t = z + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(s);
}

/** [P(a,x), Q(a,x)] regularized lower/upper incomplete gamma; the smaller one is computed directly. */
export function gammaPQ(a: number, x: number): [number, number] {
  if (!(a > 0) || Number.isNaN(x)) return [NaN, NaN];
  if (x <= 0) return [0, 1];
  if (x === Infinity) return [1, 0];
  const lnPre = -x + a * Math.log(x) - lnGamma(a);
  if (x < a + 1) {
    // series for P
    let ap = a;
    let del = 1 / a;
    let sum = del;
    for (let n = 0; n < MAX_ITER; n++) {
      ap += 1;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * EPS) break;
    }
    const p = Math.min(1, sum * Math.exp(lnPre));
    return [p, 1 - p];
  }
  // continued fraction for Q (modified Lentz)
  let b = x + 1 - a;
  let c = 1 / TINY;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < MAX_ITER; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < TINY) d = TINY;
    c = b + an / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  const q = Math.min(1, h * Math.exp(lnPre));
  return [1 - q, q];
}

function betaCf(x: number, a: number, b: number): number {
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < TINY) d = TINY;
  d = 1 / d;
  let h = d;
  for (let m = 1; m < MAX_ITER; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** [I_x(a,b), 1 - I_x(a,b)] regularized incomplete beta; the smaller side is computed directly. */
export function betaIBoth(x: number, a: number, b: number): [number, number] {
  if (!(a > 0) || !(b > 0) || Number.isNaN(x)) return [NaN, NaN];
  if (x <= 0) return [0, 1];
  if (x >= 1) return [1, 0];
  const lnBt = lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log1p(-x);
  const bt = Math.exp(lnBt);
  if (x < (a + 1) / (a + b + 2)) {
    const i = Math.min(1, (bt * betaCf(x, a, b)) / a);
    return [i, 1 - i];
  }
  const j = Math.min(1, (bt * betaCf(1 - x, b, a)) / b);
  return [1 - j, j];
}

// ── Normal ──────────────────────────────────────────────────────────────

/** Upper tail P(Z > z), full relative precision far into the tail. */
export function normSf(z: number): number {
  if (Number.isNaN(z)) return NaN;
  if (z === 0) return 0.5;
  const q = gammaPQ(0.5, (z * z) / 2)[1]; // erfc(|z|/sqrt2) = Q(1/2, z^2/2)
  return z > 0 ? 0.5 * q : 1 - 0.5 * q;
}

/** Lower tail P(Z <= z). */
export function normCdf(z: number): number {
  return normSf(-z);
}

/** Standard-normal quantile: smallest z with P(Z <= z) >= p. */
export function normQuantile(p: number): number {
  if (!(p > 0 && p < 1)) return p === 0 ? -Infinity : p === 1 ? Infinity : NaN;
  if (p === 0.5) return 0;
  // solve in the lower tail for accuracy, then mirror
  const lowTail = p < 0.5 ? p : 1 - p;
  let lo = -40;
  let hi = 0;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (normCdf(mid) < lowTail) lo = mid;
    else hi = mid;
    if (hi - lo < 1e-15 * Math.max(1, Math.abs(mid))) break;
  }
  const z = (lo + hi) / 2;
  return p < 0.5 ? z : -z;
}

// ── Student t ───────────────────────────────────────────────────────────

/** Two-sided tail P(|T| >= |t|) for df degrees of freedom. */
export function tTwoTail(t: number, df: number): number {
  if (Number.isNaN(t) || !(df > 0)) return NaN;
  if (t === 0) return 1;
  if (!Number.isFinite(t)) return 0;
  return betaIBoth(df / (df + t * t), df / 2, 0.5)[0];
}

/** Upper tail P(T > t). */
export function tSf(t: number, df: number): number {
  const two = tTwoTail(t, df);
  return t >= 0 ? two / 2 : 1 - two / 2;
}

export function tCdf(t: number, df: number): number {
  return tSf(-t, df);
}

/** t such that P(|T| >= t) = alphaTwoTail (a positive critical value). */
export function tCritical(alphaTwoTail: number, df: number): number {
  if (!(alphaTwoTail > 0 && alphaTwoTail < 1) || !(df > 0)) return NaN;
  let lo = 0;
  let hi = 1;
  while (tTwoTail(hi, df) > alphaTwoTail && hi < 1e15) hi *= 2;
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2;
    if (tTwoTail(mid, df) > alphaTwoTail) lo = mid;
    else hi = mid;
    if (hi - lo < 1e-14 * Math.max(1, hi)) break;
  }
  return (lo + hi) / 2;
}

/** x >= 0 with sf(x) = q for a decreasing survival function (bisection, ~1e-14 relative). */
function solveUpper(sf: (x: number) => number, q: number): number {
  if (!(q > 0 && q < 1)) return NaN;
  let lo = 0;
  let hi = 1;
  while (sf(hi) > q && hi < 1e15) hi *= 2;
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2;
    if (sf(mid) > q) lo = mid;
    else hi = mid;
    if (hi - lo < 1e-14 * Math.max(1, hi)) break;
  }
  return (lo + hi) / 2;
}

// ── Chi-square ──────────────────────────────────────────────────────────

/** Critical value with upper-tail probability alphaUpper (e.g. 0.05 -> the 95th percentile). */
export function chiSqCritical(alphaUpper: number, k: number): number {
  return solveUpper((x) => chiSqSf(x, k), alphaUpper);
}

/** Upper tail P(X >= x) for chi-square with k degrees of freedom. */
export function chiSqSf(x: number, k: number): number {
  return gammaPQ(k / 2, x / 2)[1];
}

export function chiSqCdf(x: number, k: number): number {
  return gammaPQ(k / 2, x / 2)[0];
}

// ── F ───────────────────────────────────────────────────────────────────

/** Upper tail P(F >= x) for F(d1, d2). */
export function fSf(x: number, d1: number, d2: number): number {
  if (Number.isNaN(x) || !(d1 > 0) || !(d2 > 0)) return NaN;
  if (x <= 0) return 1;
  if (x === Infinity) return 0;
  return betaIBoth((d2) / (d2 + d1 * x), d2 / 2, d1 / 2)[0];
}

export function fCdf(x: number, d1: number, d2: number): number {
  if (Number.isNaN(x) || !(d1 > 0) || !(d2 > 0)) return NaN;
  if (x <= 0) return 0;
  if (x === Infinity) return 1;
  return betaIBoth((d1 * x) / (d1 * x + d2), d1 / 2, d2 / 2)[0];
}

/** F critical value with upper-tail probability alphaUpper. */
export function fCritical(alphaUpper: number, d1: number, d2: number): number {
  return solveUpper((x) => fSf(x, d1, d2), alphaUpper);
}
