// Exact polynomial evaluation on BigInt fractions (Horner). Decimal inputs are read exactly, so
// P(0.1) for 10x^3 - 3x^2 + 0.3x - 0.003 is exactly 0, not 3.5e-19.

import {
  type Frac,
  addFrac,
  decimalExpansion,
  fracToFixed,
  formatExpansion,
  makeFrac,
  mulFrac,
  parseDecimalExact,
} from '../../../utils/rational';

export const MAX_COEFFS = 60;
const MAX_DIGITS = 30;
const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
export const superscript = (n: number): string => String(n).split('').map((d) => SUP[d] ?? d).join('');

/** Coefficients highest degree first, separated by commas / semicolons / whitespace. Leading zeros are dropped. */
export function parseCoeffs(raw: string | undefined): Frac[] | null {
  const parts = (raw ?? '').trim().split(/[,;\s]+/).filter(Boolean);
  if (!parts.length || parts.length > MAX_COEFFS) return null;
  const out: Frac[] = [];
  for (const p of parts) {
    const f = parseDecimalExact(p, MAX_DIGITS);
    if (!f) return null;
    out.push(f);
  }
  let i = 0;
  while (i < out.length - 1 && out[i].n === 0n) i++;
  return out.slice(i);
}

export function parseX(raw: string | undefined): Frac | null {
  return parseDecimalExact(raw, MAX_DIGITS);
}

const frac = (n: number): Frac => makeFrac(BigInt(n), 1n);

export function evalHorner(c: Frac[], x: Frac): Frac {
  let r = c[0];
  for (let i = 1; i < c.length; i++) r = addFrac(mulFrac(r, x), c[i]);
  return r;
}

export function derivativeCoeffs(c: Frac[]): Frac[] {
  const n = c.length - 1;
  if (n === 0) return [frac(0)];
  return c.slice(0, n).map((a, i) => mulFrac(a, frac(n - i)));
}

export function powFrac(x: Frac, e: number): Frac {
  let r = frac(1);
  for (let i = 0; i < e; i++) r = mulFrac(r, x);
  return r;
}

/** Exact text for a fraction: integers in full (scientific beyond 30 digits), terminating decimals exactly, else 10 decimals. */
export function fmtFrac(f: Frac): string {
  if (f.d === 1n) {
    const s = f.n.toString();
    const digits = s.replace('-', '');
    if (digits.length <= 30) return s;
    return `${f.n < 0n ? '-' : ''}${digits[0]}.${digits.slice(1, 10)}e+${digits.length - 1}`;
  }
  const e = decimalExpansion(f, 15);
  if (!e.truncated && !e.repeating) return formatExpansion(e);
  return fracToFixed(f, 10);
}

export const isExactDecimal = (f: Frac): boolean => {
  if (f.d === 1n) return true;
  const e = decimalExpansion(f, 15);
  return !e.truncated && !e.repeating;
};

/** "x² − 3x + 2" (coefficients highest degree first). */
export function polyString(c: Frac[]): string {
  let out = '';
  const n = c.length - 1;
  c.forEach((a, i) => {
    if (a.n === 0n) return;
    const power = n - i;
    const neg = a.n < 0n;
    const abs = makeFrac(neg ? -a.n : a.n, a.d);
    out += out === '' ? (neg ? '-' : '') : neg ? ' − ' : ' + ';
    const isOne = abs.n === 1n && abs.d === 1n;
    const coef = fmtFrac(abs);
    if (power === 0) out += coef;
    else out += (isOne ? '' : coef) + 'x' + (power > 1 ? superscript(power) : '');
  });
  return out || '0';
}
