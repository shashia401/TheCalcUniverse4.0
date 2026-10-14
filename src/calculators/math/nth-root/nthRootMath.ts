import { MAX_FACTOR_INPUT, factorize } from '../../../utils/numberTheory';

export const MAX_ROOT_INDEX = 1000;

const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };

/** √ ∛ ∜ then superscript-index form (⁵√) — the old code printed ∛ for every index above 2. */
export const radicalSymbol = (n: number): string =>
  n === 2 ? '√' : n === 3 ? '∛' : n === 4 ? '∜' : `${String(n).split('').map((d) => SUP[d]).join('')}√`;

/** Up to 10 decimals for ordinary sizes, 12 significant digits for very small / large values (toFixed(10) printed 1e-15 as "0"). */
export function fmtRoot(v: number): string {
  if (v === 0) return '0';
  const a = Math.abs(v);
  if (a >= 1e-4 && a < 1e15) return parseFloat(v.toFixed(10)).toString();
  return parseFloat(v.toPrecision(12)).toString();
}

export type NthRoot =
  | { kind: 'incomplete' }
  | { kind: 'error'; message: string }
  | {
      kind: 'ok';
      n: number;
      x: number;
      /** real nth root (sign kept for odd n) */
      value: number;
      /** exact simplified radical for integer radicands, e.g. "2∜3"; '' when there is nothing to simplify */
      simplified: string;
    };

export function parseNthRoot(indexRaw: string | undefined, radicandRaw: string | undefined): NthRoot {
  const ni = (indexRaw ?? '').trim();
  const xi = (radicandRaw ?? '').trim();
  if (!/^\d+$/.test(ni) || !/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(xi)) return { kind: 'incomplete' };
  const n = Number(ni);
  const x = Number(xi);
  if (n < 1 || !Number.isFinite(x)) return { kind: 'incomplete' };
  if (n > MAX_ROOT_INDEX) return { kind: 'error', message: `The root index is limited to ${MAX_ROOT_INDEX}.` };

  if (n % 2 === 0 && x < 0) {
    // Principal complex root: |x|^(1/n) · (cos(π/n) + i·sin(π/n))
    const m = Math.pow(-x, 1 / n);
    const re = m * Math.cos(Math.PI / n);
    const im = m * Math.sin(Math.PI / n);
    const reS = Math.abs(re) < 1e-12 * m ? '0' : fmtRoot(re);
    return {
      kind: 'error',
      message: `An even root of a negative number is not a real number. Its principal complex value is ${reS} + ${fmtRoot(im)}i.`,
    };
  }

  const ax = Math.abs(x);
  let value = n === 1 ? ax : n === 2 ? Math.sqrt(ax) : n === 3 ? Math.cbrt(ax) : Math.pow(ax, 1 / n);
  // Snap to the exact integer root when there is one (Math.pow(64, 1/3) is 3.9999999999999996).
  const ri = Math.round(value);
  if (Number.isInteger(ax) && ax <= MAX_FACTOR_INPUT && ri >= 0 && BigInt(ri) ** BigInt(n) === BigInt(ax)) value = ri;
  if (x < 0) value = -value;
  if (!Number.isFinite(value)) return { kind: 'incomplete' };

  return { kind: 'ok', n, x, value, simplified: n === 1 ? '' : simplifyRadical(n, x) };
}

/**
 * Exact simplification of ⁿ√x for an integer x: pull p^floor(e/n) out of every prime power p^e in x.
 * 48 -> 4∜3 is wrong for n=2 but 2∜3 for n=4; 64, n=3 -> 4 (not "2∛8").
 */
export function simplifyRadical(n: number, x: number): string {
  if (!Number.isInteger(x) || x === 0 || Math.abs(x) > MAX_FACTOR_INPUT) return '';
  const neg = x < 0;
  let outside = 1n;
  let inside = 1n;
  for (const [p, e] of factorize(Math.abs(x))) {
    outside *= BigInt(p) ** BigInt(Math.floor(e / n));
    inside *= BigInt(p) ** BigInt(e % n);
  }
  const sign = neg ? '-' : '';
  if (inside === 1n) return `${sign}${outside}`;
  if (outside === 1n) return ''; // nothing to simplify
  return `${sign}${outside}${radicalSymbol(n)}${inside}`;
}
