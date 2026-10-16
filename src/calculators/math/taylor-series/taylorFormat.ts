/**
 * Recognise a coefficient as p/q (q <= 5e6) via continued fractions, so sin(x) prints x - x^3/6 + x^5/120
 * instead of -0.166667*x^3. Returns null when no such fraction matches to 14 significant digits.
 * Input must be non-negative.
 */
export function ratApprox(v: number): [number, number] | null {
  if (!Number.isFinite(v) || v < 0) return null;
  if (v === 0) return [0, 1];
  let h1 = 1;
  let h0 = 0;
  let k1 = 0;
  let k0 = 1;
  let x = v;
  for (let i = 0; i < 40; i++) {
    const a = Math.floor(x);
    const h2 = a * h1 + h0;
    const k2 = a * k1 + k0;
    if (k2 > 5e6 || h2 > 1e15) return null;
    h0 = h1;
    h1 = h2;
    k0 = k1;
    k1 = k2;
    if (Math.abs(v - h1 / k1) <= 2e-15 * v) return [h1, k1];
    const frac = x - a;
    if (frac < 1e-15) return null;
    x = 1 / frac;
  }
  return null;
}

export const MAX_ORDER = 20;

/** Horner evaluation of sum c_k (x - a)^k. */
export function evalTaylor(c: number[], a: number, x: number): number {
  let s = 0;
  for (let k = c.length - 1; k >= 0; k--) s = s * (x - a) + c[k];
  return s;
}
