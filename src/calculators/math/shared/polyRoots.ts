// Real/complex roots of a real polynomial with multiplicities.
//
// 1. Yun's square-free factorisation runs in exact rational arithmetic, so a triple root of
//    x^3 - 3x^2 + 3x - 1 is recognised as "1 (x3)" instead of three noisy numerical roots around 1.
// 2. Each square-free factor (simple roots only) is solved with the Aberth-Ehrlich iteration in doubles
//    and polished with Newton steps on the exact polynomial.

import { type Frac, divFrac, makeFrac, mulFrac, subFrac, fracToNumber } from '../../../utils/rational';

export interface Complex {
  re: number;
  im: number;
}
export interface Root extends Complex {
  multiplicity: number;
}

type Poly = Frac[]; // lowest degree first, no trailing zeros ([] is the zero polynomial)
const ZERO = makeFrac(0n, 1n);

function trim(p: Poly): Poly {
  let n = p.length;
  while (n > 0 && p[n - 1].n === 0n) n--;
  return p.slice(0, n);
}
const deg = (p: Poly) => p.length - 1;
const deriv = (p: Poly): Poly => trim(p.slice(1).map((c, i) => mulFrac(c, makeFrac(BigInt(i + 1), 1n))));
const sub = (a: Poly, b: Poly): Poly => trim(Array.from({ length: Math.max(a.length, b.length) }, (_, i) => subFrac(a[i] ?? ZERO, b[i] ?? ZERO)));

function divmod(a: Poly, b: Poly): { q: Poly; r: Poly } {
  let r = a.slice();
  const q: Poly = Array.from({ length: Math.max(a.length - b.length + 1, 0) }, () => ZERO);
  while (r.length >= b.length && r.length > 0) {
    const k = r.length - b.length;
    const f = divFrac(r[r.length - 1], b[b.length - 1]);
    q[k] = f;
    r = trim(r.map((c, i) => (i >= k ? subFrac(c, mulFrac(f, b[i - k])) : c)));
  }
  return { q: trim(q), r };
}

function gcd(a: Poly, b: Poly): Poly {
  while (b.length > 0) [a, b] = [b, divmod(a, b).r];
  return a.length ? a.map((c) => divFrac(c, a[a.length - 1])) : a; // monic
}

/** Yun: p = prod q_i^i with every q_i square-free; returns [q_1, q_2, ...] (index = multiplicity - 1). */
function yun(p: Poly): Poly[] {
  const out: Poly[] = [];
  const d = deriv(p);
  let c = gcd(p, d);
  let w = divmod(p, c).q;
  let y = divmod(d, c).q;
  let z = sub(y, deriv(w));
  while (deg(w) > 0) {
    const g = gcd(w, z);
    out.push(g);
    w = divmod(w, g).q;
    c = divmod(c, g).q;
    y = divmod(z, g).q;
    z = sub(y, deriv(w));
  }
  return out;
}

const cadd = (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im });
const csub = (a: Complex, b: Complex): Complex => ({ re: a.re - b.re, im: a.im - b.im });
const cmul = (a: Complex, b: Complex): Complex => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
const cdiv = (a: Complex, b: Complex): Complex => {
  const d = b.re * b.re + b.im * b.im;
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
};
const cabs = (a: Complex) => Math.hypot(a.re, a.im);

/** Roots of a square-free real polynomial (coefficients lowest degree first, monic-normalised internally). */
function aberth(coef: number[]): Complex[] {
  const n = coef.length - 1;
  if (n < 1) return [];
  const lead = coef[n];
  const c = coef.map((v) => v / lead);
  if (n === 1) return [{ re: -c[0], im: 0 }];
  const evalP = (z: Complex): { p: Complex; dp: Complex } => {
    let p: Complex = { re: 1, im: 0 };
    let dp: Complex = { re: 0, im: 0 };
    for (let k = n - 1; k >= 0; k--) {
      dp = cadd(cmul(dp, z), p);
      p = cadd(cmul(p, z), { re: c[k], im: 0 });
    }
    return { p, dp };
  };
  const radius = 1 + Math.max(...c.slice(0, n).map(Math.abs));
  let z: Complex[] = Array.from({ length: n }, (_, k) => {
    const ang = (2 * Math.PI * k) / n + 0.4;
    return { re: radius * 0.6 * Math.cos(ang), im: radius * 0.6 * Math.sin(ang) };
  });
  for (let it = 0; it < 500; it++) {
    let maxStep = 0;
    z = z.map((zk, k) => {
      const { p, dp } = evalP(zk);
      if (cabs(p) === 0) return zk;
      const ratio = cdiv(p, dp);
      let s: Complex = { re: 0, im: 0 };
      for (let j = 0; j < n; j++) {
        if (j !== k) s = cadd(s, cdiv({ re: 1, im: 0 }, csub(zk, z[j])));
      }
      const denom = csub({ re: 1, im: 0 }, cmul(ratio, s));
      const step = cdiv(ratio, denom);
      maxStep = Math.max(maxStep, cabs(step) / Math.max(1, cabs(zk)));
      return csub(zk, step);
    });
    if (maxStep < 1e-15) break;
  }
  // Newton polish
  z = z.map((zk) => {
    let cur = zk;
    for (let i = 0; i < 3; i++) {
      const { p, dp } = evalP(cur);
      if (cabs(dp) === 0) break;
      const next = csub(cur, cdiv(p, dp));
      if (!Number.isFinite(next.re) || !Number.isFinite(next.im)) break;
      cur = next;
    }
    return cur;
  });
  return z;
}

/**
 * Roots of the real polynomial with coefficients `coeffs` (highest degree first, exact fractions).
 * Real roots come first (ascending), then one representative of each conjugate pair (im > 0).
 */
export function polyRoots(coeffs: Frac[]): Root[] {
  let p: Poly = trim(coeffs.slice().reverse());
  if (deg(p) < 1) return [];
  const roots: Root[] = [];
  // Exact zero roots first (c0 = c1 = ... = 0).
  let zeros = 0;
  while (p.length > 1 && p[0].n === 0n) {
    p = p.slice(1);
    zeros++;
  }
  if (zeros) roots.push({ re: 0, im: 0, multiplicity: zeros });
  if (deg(p) >= 1) {
    yun(p).forEach((q, i) => {
      if (deg(q) < 1) return;
      for (const z of aberth(q.map(fracToNumber))) {
        const scale = Math.max(1, cabs(z));
        const tiny = Math.abs(z.im) <= 1e-9 * scale;
        roots.push({ re: z.re, im: tiny ? 0 : z.im, multiplicity: i + 1 });
      }
    });
  }
  // Keep one root per conjugate pair; average the pair for a symmetric answer.
  const real = roots.filter((r) => r.im === 0).sort((a, b) => a.re - b.re);
  const cx = roots.filter((r) => r.im > 0).sort((a, b) => a.re - b.re || a.im - b.im);
  const neg = roots.filter((r) => r.im < 0);
  const paired = cx.map((r) => {
    const m = neg.find((q) => Math.abs(q.re - r.re) < 1e-6 * Math.max(1, Math.abs(r.re)) && Math.abs(q.im + r.im) < 1e-6 * Math.max(1, r.im));
    return m ? { re: (r.re + m.re) / 2, im: (r.im - m.im) / 2, multiplicity: r.multiplicity } : r;
  });
  return [...real, ...paired];
}
