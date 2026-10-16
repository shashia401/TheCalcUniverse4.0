// Exact matrix arithmetic on BigInt fractions (src/utils/rational): determinant, inverse, rank and RREF
// never suffer from floating-point cancellation, so [[1,2],[2,4.0000000000000001]]-style and
// near-singular inputs are decided exactly (a 1e-10 float tolerance wrongly called small-but-regular matrices singular).

import {
  type Frac,
  decimalExpansion,
  divFrac,
  fracToFixed,
  fracToString,
  makeFrac,
  mulFrac,
  parseDecimalExact,
  subFrac,
} from '../../../utils/rational';

export type FMatrix = Frac[][];

const ZERO = makeFrac(0n, 1n);
const ONE = makeFrac(1n, 1n);
const isZero = (f: Frac) => f.n === 0n;
const MAX_PART_DIGITS = 40;

/** Parse an n×n matrix: one row per line (or ';'), entries separated by spaces/commas. null when malformed. */
export function parseMatrix(input: string, size: number): FMatrix | null {
  const rows = input
    .trim()
    .split(/\r?\n|;/)
    .map((r) => r.trim())
    .filter(Boolean);
  if (rows.length !== size) return null;
  const m: FMatrix = [];
  for (const row of rows) {
    const cells = row.split(/[\s,]+/).filter(Boolean);
    if (cells.length !== size) return null;
    const parsed = cells.map((c) => parseDecimalExact(c, 30));
    for (const f of parsed) {
      if (!f || f.n.toString().length > MAX_PART_DIGITS || f.d.toString().length > MAX_PART_DIGITS) return null;
    }
    m.push(parsed as Frac[]);
  }
  return m;
}

const clone = (m: FMatrix): FMatrix => m.map((r) => r.slice());

export function determinant(m: FMatrix): Frac {
  const a = clone(m);
  const n = a.length;
  let det = ONE;
  for (let c = 0; c < n; c++) {
    let p = c;
    while (p < n && isZero(a[p][c])) p++;
    if (p === n) return ZERO;
    if (p !== c) {
      [a[p], a[c]] = [a[c], a[p]];
      det = makeFrac(-det.n, det.d);
    }
    det = mulFrac(det, a[c][c]);
    for (let r = c + 1; r < n; r++) {
      const f = divFrac(a[r][c], a[c][c]);
      for (let k = c; k < n; k++) a[r][k] = subFrac(a[r][k], mulFrac(f, a[c][k]));
    }
  }
  return det;
}

/** Reduced row echelon form and rank (Gauss-Jordan, exact). */
export function rref(m: FMatrix): { matrix: FMatrix; rank: number } {
  const a = clone(m);
  const rows = a.length;
  const cols = a[0]?.length ?? 0;
  let rank = 0;
  for (let c = 0; c < cols && rank < rows; c++) {
    let p = rank;
    while (p < rows && isZero(a[p][c])) p++;
    if (p === rows) continue;
    [a[p], a[rank]] = [a[rank], a[p]];
    const pivot = a[rank][c];
    a[rank] = a[rank].map((v) => divFrac(v, pivot));
    for (let r = 0; r < rows; r++) {
      if (r === rank || isZero(a[r][c])) continue;
      const f = a[r][c];
      a[r] = a[r].map((v, k) => subFrac(v, mulFrac(f, a[rank][k])));
    }
    rank++;
  }
  return { matrix: a, rank };
}

/** Exact inverse, or null when the matrix is singular. */
export function inverse(m: FMatrix): FMatrix | null {
  const n = m.length;
  const aug = m.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? ONE : ZERO))]);
  const { matrix } = rref(aug);
  // Invertible exactly when the left n×n block reduced to the identity (rank of A itself is n).
  for (let i = 0; i < n; i++) if (!matrix[i].slice(0, n).every((v, j) => (i === j ? v.n === v.d : isZero(v)))) return null;
  return matrix.map((r) => r.slice(n));
}

/** Entry as text: integer, exact short decimal ("0.25"), or fraction "n/d". */
export function fmtExact(f: Frac): string {
  if (f.d === 1n) return f.n.toString();
  const e = decimalExpansion(f, 8);
  if (!e.truncated && !e.repeating) return fracToFixed(f, 8);
  return fracToString(f);
}

/** Entry rounded to 6 decimals ("0.333333"), exact for integers. */
export const fmtApprox = (f: Frac): string => fracToFixed(f, 6);
