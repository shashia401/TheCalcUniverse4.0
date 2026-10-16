// Pure 3-vector helpers shared by the cross-product, dot-product and vector calculators.
// Math.hypot avoids the overflow/underflow of sqrt(x*x+...) for components near 1e154 / 1e-154,
// and atan2(|a x b|, a.b) gives the angle without the precision loss acos has near 0 and 180 degrees.

export type V3 = [number, number, number];

export const dot3 = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export const cross3 = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

export const norm3 = (a: V3): number => Math.hypot(a[0], a[1], a[2]);

/** Angle between two vectors in degrees, [0, 180]; null when either is the zero vector (no direction). */
export function angleDeg3(a: V3, b: V3): number | null {
  const na = norm3(a);
  const nb = norm3(b);
  if (na === 0 || nb === 0) return null;
  // Work on unit vectors so components near 1e200 cannot overflow the products.
  const ua = a.map((x) => x / na) as V3;
  const ub = b.map((x) => x / nb) as V3;
  return (Math.atan2(norm3(cross3(ua, ub)), dot3(ua, ub)) * 180) / Math.PI;
}

export const allFinite = (...xs: number[]): boolean => xs.every(Number.isFinite);
