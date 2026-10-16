// Triangle solvers shared by the triangle, law-of-sines and law-of-cosines calculators.
// Everything is computed in full double precision (nothing is rounded between steps), with the
// numerically stable forms:
//   * SSS angles from the half-angle tangent formula (acos of (b²+c²−a²)/2bc loses all precision for tiny angles)
//   * SAS third side z = √((x−y)² + 4xy·sin²(γ/2)) (the plain law of cosines cancels catastrophically when γ is tiny)
//   * the other SAS angles from atan2, which is also correct for obtuse angles.
// Angles are in DEGREES; a, b, c are the sides opposite A, B, C.

export interface Tri {
  a: number;
  b: number;
  c: number;
  A: number;
  B: number;
  C: number;
}

const RAD = Math.PI / 180;
export const toRad = (d: number) => d * RAD;
export const toDeg = (r: number) => r / RAD;

/** Three sides -> triangle, or null when the triangle inequality fails (degenerate triangles count as failing). */
export function solveSSS(a: number, b: number, c: number): Tri | null {
  if (!(a > 0 && b > 0 && c > 0) || ![a, b, c].every(Number.isFinite)) return null;
  const s = (a + b + c) / 2;
  const sa = s - a;
  const sb = s - b;
  const sc = s - c;
  if (!(sa > 0 && sb > 0 && sc > 0)) return null;
  const half = (x: number, y: number, z: number) => 2 * Math.atan2(Math.sqrt((y * z) / (s * x)), 1); // tan(A/2) = √((s−b)(s−c)/(s(s−a)))
  const A = toDeg(half(sa, sb, sc));
  const B = toDeg(half(sb, sa, sc));
  return { a, b, c, A, B, C: 180 - A - B };
}

/** Sides x and y with the included angle γ (degrees, 0 < γ < 180) -> triangle with x opp A, y opp B, z opp C = γ. */
export function solveSAS(x: number, y: number, gammaDeg: number): Tri | null {
  if (!(x > 0 && y > 0 && gammaDeg > 0 && gammaDeg < 180) || ![x, y, gammaDeg].every(Number.isFinite)) return null;
  const g = toRad(gammaDeg);
  const sinHalf = Math.sin(g / 2);
  const z = Math.sqrt((x - y) * (x - y) + 4 * x * y * sinHalf * sinHalf);
  const A = toDeg(Math.atan2(x * Math.sin(g), y - x * Math.cos(g)));
  const B = toDeg(Math.atan2(y * Math.sin(g), x - y * Math.cos(g)));
  return { a: x, b: y, c: z, A, B, C: gammaDeg };
}

/** Two angles (any two of A, B, C) and one side (given as `side` opposite `sideVertex`) -> unique triangle. */
export function solveAngleAngleSide(known: { A?: number; B?: number; C?: number }, side: number, sideVertex: 'A' | 'B' | 'C'): Tri | null {
  const entries = (['A', 'B', 'C'] as const).filter((k) => known[k] !== undefined);
  if (entries.length !== 2 || !(side > 0) || !Number.isFinite(side)) return null;
  const [p, q] = entries;
  const missing = (['A', 'B', 'C'] as const).find((k) => known[k] === undefined)!;
  const vp = known[p]!;
  const vq = known[q]!;
  if (!(vp > 0 && vq > 0) || vp + vq >= 180) return null;
  const ang: Record<'A' | 'B' | 'C', number> = { A: 0, B: 0, C: 0 };
  ang[p] = vp;
  ang[q] = vq;
  ang[missing] = 180 - vp - vq;
  const k = side / Math.sin(toRad(ang[sideVertex])); // law of sines constant 2R
  return { a: k * Math.sin(toRad(ang.A)), b: k * Math.sin(toRad(ang.B)), c: k * Math.sin(toRad(ang.C)), A: ang.A, B: ang.B, C: ang.C };
}

export type SSA = { kind: 'none'; reason: string } | { kind: 'solutions'; triangles: Tri[] };

/**
 * Side `s1` opposite the known angle `angleDeg`, plus a second side `s2` (opposite the unknown angle X).
 * sin X = s2·sin(angle)/s1 gives 0, 1 or 2 triangles (the ambiguous case).
 */
export function solveSSA(s1: number, angleDeg: number, s2: number): SSA {
  if (!(s1 > 0 && s2 > 0 && angleDeg > 0 && angleDeg < 180)) return { kind: 'none', reason: 'Sides must be positive and the angle must be between 0° and 180°.' };
  const sinX = (s2 * Math.sin(toRad(angleDeg))) / s1;
  const EPS = 1e-12;
  if (sinX > 1 + EPS) return { kind: 'none', reason: `No triangle: side ${fmtN(s2)} is too long to reach the other side (sin X = ${fmtN(sinX)} > 1).` };
  const x1 = toDeg(Math.asin(Math.min(1, sinX)));
  const candidates = Math.abs(sinX - 1) <= EPS ? [90] : [x1, 180 - x1];
  const triangles: Tri[] = [];
  for (const X of candidates) {
    const rest = 180 - angleDeg - X;
    if (rest <= 1e-9) continue; // angles must sum below 180°
    const k = s1 / Math.sin(toRad(angleDeg));
    triangles.push({ a: s1, b: s2, c: k * Math.sin(toRad(rest)), A: angleDeg, B: X, C: rest });
  }
  if (!triangles.length) return { kind: 'none', reason: 'No triangle: the angles would sum to 180° or more.' };
  return { kind: 'solutions', triangles };
}

const fmtN = (n: number) => String(Number(n.toPrecision(8)));

/** Area from two sides and the included angle: ½·b·c·sin A (stable; Heron's formula cancels for thin triangles). */
export const area = (t: Tri): number => 0.5 * t.b * t.c * Math.sin(toRad(t.A));

export type AngleClass = 'Right' | 'Obtuse' | 'Acute';
export type SideClass = 'Equilateral' | 'Isosceles' | 'Scalene';

/** Classification by the actual (unrounded) triangle, with a relative tolerance for floating-point noise. */
export function classify(t: Tri, tol = 1e-9): { bySides: SideClass; byAngles: AngleClass } {
  const [x, y, z] = [t.a, t.b, t.c].sort((p, q) => p - q);
  const eq = (p: number, q: number) => Math.abs(p - q) <= tol * Math.max(p, q);
  const bySides: SideClass = eq(x, z) ? 'Equilateral' : eq(x, y) || eq(y, z) ? 'Isosceles' : 'Scalene';
  // Largest angle is opposite the longest side z: compare z² with x² + y².
  const lhs = z * z;
  const rhs = x * x + y * y;
  const byAngles: AngleClass = Math.abs(lhs - rhs) <= tol * rhs ? 'Right' : lhs > rhs ? 'Obtuse' : 'Acute';
  return { bySides, byAngles };
}

export type AngleUnit = 'deg' | 'rad';

/** User angle -> degrees. */
export const angleToDeg = (v: number, unit: AngleUnit): number => (unit === 'rad' ? toDeg(v) : v);

const fix8 = (n: number): string => (n !== 0 && Math.abs(n) < 1e-4 ? String(Number(n.toPrecision(6))) : String(parseFloat(n.toFixed(8))));
export { fix8 as fmtNum8 };

/** Degrees -> text in the chosen unit ("30°", "0.5235988 rad"); values within 1e-9 of 0/180 are snapped. */
export function fmtAngle(deg: number, unit: AngleUnit): string {
  return unit === 'rad' ? `${fix8(toRad(deg))} rad` : `${fix8(deg)}°`;
}
