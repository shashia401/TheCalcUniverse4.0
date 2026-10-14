export type PythMode = 'hypotenuse' | 'leg_a' | 'leg_b';

export interface Triangle {
  mode: PythMode;
  a: number;
  b: number;
  c: number;
  area: number;
  perimeter: number;
  /** angle opposite leg a, degrees */
  angleA: number;
  /** angle opposite leg b, degrees */
  angleB: number;
}

export type PythResult = { kind: 'incomplete' } | { kind: 'error'; message: string } | { kind: 'ok'; t: Triangle };

const MAX_SIDE = 1e150; // squares stay finite

function parsePositive(s: string | undefined): number | null {
  const t = (s ?? '').trim();
  if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const deg = (r: number) => (r * 180) / Math.PI;

/**
 * Right-triangle solver. Math.hypot avoids overflow/underflow for the hypotenuse, and the legs use
 * sqrt((c − k)(c + k)) instead of sqrt(c² − k²), which loses all its digits when c is close to k
 * (c = 1e8 + 1, k = 1e8: the subtraction form is off by ~1e-8 relative to the true 14142.1…).
 */
export function solveRightTriangle(modeRaw: string | undefined, as: string | undefined, bs: string | undefined, cs: string | undefined): PythResult {
  const mode = (modeRaw || 'hypotenuse') as PythMode;
  const a = parsePositive(as);
  const b = parsePositive(bs);
  const c = parsePositive(cs);

  let A: number;
  let B: number;
  let C: number;
  if (mode === 'hypotenuse') {
    if (a === null || b === null) return { kind: 'incomplete' };
    if (Math.max(a, b) > MAX_SIDE) return { kind: 'error', message: 'Side lengths above 1e150 are not supported.' };
    A = a;
    B = b;
    C = Math.hypot(a, b);
  } else {
    const leg = mode === 'leg_a' ? b : a;
    if (c === null || leg === null) return { kind: 'incomplete' };
    if (Math.max(c, leg) > MAX_SIDE) return { kind: 'error', message: 'Side lengths above 1e150 are not supported.' };
    if (c <= leg) {
      return { kind: 'error', message: `The hypotenuse (${c}) must be longer than the leg (${leg}); it is the longest side of a right triangle.` };
    }
    const other = Math.sqrt((c - leg) * (c + leg));
    C = c;
    if (mode === 'leg_a') {
      A = other;
      B = leg;
    } else {
      A = leg;
      B = other;
    }
  }
  const angleA = deg(Math.atan2(A, B));
  const angleB = deg(Math.atan2(B, A));
  return { kind: 'ok', t: { mode, a: A, b: B, c: C, area: 0.5 * A * B, perimeter: A + B + C, angleA, angleB } };
}
