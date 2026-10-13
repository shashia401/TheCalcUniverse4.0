// Exact rational arithmetic on BigInt, shared by the fraction / fraction-to-decimal /
// common-denominator calculators. Everything here is exact: no floating point is ever
// involved, so 1/3 + 1/6 is 1/2 and 12345678901234567890 / 9876543210987654321 stays exact.

const abs = (a: bigint): bigint => (a < 0n ? -a : a);

export function gcdBig(a: bigint, b: bigint): bigint {
  a = abs(a);
  b = abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function lcmBig(a: bigint, b: bigint): bigint {
  if (a === 0n || b === 0n) return 0n;
  return abs((a / gcdBig(a, b)) * b);
}

/** floor(sqrt(n)) for n >= 0, exact for any size (Newton iteration; Math.sqrt would lose digits past 2^53). */
export function isqrt(n: bigint): bigint {
  if (n < 0n) throw new RangeError('isqrt of a negative number');
  if (n < 2n) return n;
  let x = 1n << BigInt((n.toString(2).length + 1) >> 1); // >= sqrt(n)
  for (;;) {
    const y = (x + n / x) >> 1n;
    if (y >= x) return x;
    x = y;
  }
}

/** A fraction in lowest terms with a strictly positive denominator. */
export interface Frac {
  n: bigint;
  d: bigint;
}

/** Reduce n/d to lowest terms (sign carried by n). Throws RangeError when d is 0. */
export function makeFrac(n: bigint, d: bigint): Frac {
  if (d === 0n) throw new RangeError('Denominator cannot be zero');
  const g = gcdBig(n, d) || 1n;
  const s = d < 0n ? -1n : 1n;
  return { n: (n / g) * s, d: (abs(d) / g) };
}

export const addFrac = (a: Frac, b: Frac): Frac => makeFrac(a.n * b.d + b.n * a.d, a.d * b.d);
export const subFrac = (a: Frac, b: Frac): Frac => makeFrac(a.n * b.d - b.n * a.d, a.d * b.d);
export const mulFrac = (a: Frac, b: Frac): Frac => makeFrac(a.n * b.n, a.d * b.d);
/** a / b. Throws RangeError when b is zero. */
export const divFrac = (a: Frac, b: Frac): Frac => makeFrac(a.n * b.d, a.d * b.n);

/** "5", "-3/4". Whole numbers print without a denominator. */
export const fracToString = (f: Frac): string => (f.d === 1n ? f.n.toString() : `${f.n}/${f.d}`);

/**
 * Strict integer parse: optional sign then digits only ("2.5", "1e3", "12abc", "" -> null,
 * unlike parseInt which silently truncates them). `maxDigits` bounds the work.
 */
export function parseIntegerStrict(raw: string | undefined, maxDigits = 300): bigint | null {
  const s = (raw ?? '').trim();
  if (!/^[+-]?\d+$/.test(s)) return null;
  if (s.replace(/^[+-]/, '').length > maxDigits) return null;
  return BigInt(s);
}

/**
 * Exact value of a decimal literal: "-12.340", ".5", "1.5e-3", "+7". Returns null for anything else.
 * 0.1 is exactly 1/10 here (not the binary double nearest to it).
 */
export function parseDecimalExact(raw: string | undefined, maxDigits = 300): Frac | null {
  const s = (raw ?? '').trim();
  const m = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(s);
  if (!m) return null;
  const [, sign, intDigits, fracDigits = '', expRaw] = m;
  if (intDigits === '' && fracDigits === '') return null;
  if (intDigits.length + fracDigits.length > maxDigits) return null;
  const exp = expRaw === undefined ? 0 : Number(expRaw);
  if (!Number.isInteger(exp) || Math.abs(exp) > 1000) return null;
  let num = BigInt((intDigits + fracDigits) || '0');
  let scale = fracDigits.length - exp; // value = num / 10^scale
  if (scale < 0) {
    num *= 10n ** BigInt(-scale);
    scale = 0;
  }
  return makeFrac(sign === '-' ? -num : num, 10n ** BigInt(scale));
}

export interface DecimalExpansion {
  negative: boolean;
  /** Digits before the decimal point (no sign). */
  intPart: string;
  /** Digits after the point that do not repeat. */
  nonRepeating: string;
  /** The repeating block (empty when the decimal terminates). */
  repeating: string;
  /** True when the loop stopped at maxDigits before the pattern closed (period longer than the cap). */
  truncated: boolean;
}

/**
 * Long-division expansion of a fraction with exact remainder tracking, so the repeating block
 * (period) is exact: 1/7 -> 0.(142857), 1/6 -> 0.1(6), 1/8 -> 0.125. The period of n/d can be as long as
 * d - 1 digits, so `maxDigits` caps the work; `truncated` says when the cap was hit first.
 */
export function decimalExpansion(f: Frac, maxDigits = 2000): DecimalExpansion {
  const negative = f.n < 0n;
  const num = abs(f.n);
  const intPart = (num / f.d).toString();
  let rem = num % f.d;
  const digits: string[] = [];
  const seen = new Map<bigint, number>();
  while (rem !== 0n) {
    const at = seen.get(rem);
    if (at !== undefined) {
      return {
        negative,
        intPart,
        nonRepeating: digits.slice(0, at).join(''),
        repeating: digits.slice(at).join(''),
        truncated: false,
      };
    }
    if (digits.length >= maxDigits) {
      return { negative, intPart, nonRepeating: digits.join(''), repeating: '', truncated: true };
    }
    seen.set(rem, digits.length);
    rem *= 10n;
    digits.push((rem / f.d).toString());
    rem %= f.d;
  }
  return { negative, intPart, nonRepeating: digits.join(''), repeating: '', truncated: false };
}

/** "0.1(6)", "-0.(3)", "0.125", "2". A truncated expansion ends with an ellipsis. */
export function formatExpansion(e: DecimalExpansion): string {
  const sign = e.negative ? '-' : '';
  if (!e.nonRepeating && !e.repeating) return `${sign}${e.intPart}`;
  const rep = e.repeating ? `(${e.repeating})` : e.truncated ? '…' : '';
  return `${sign}${e.intPart}.${e.nonRepeating}${rep}`;
}

/** n/d rounded half away from zero to `places` decimals, trailing zeros trimmed ("0.3333", "-1.5", "2"). */
export function fracToFixed(f: Frac, places: number): string {
  const scale = 10n ** BigInt(places);
  const num = abs(f.n) * scale;
  const q = (num * 2n + f.d) / (2n * f.d); // floor((num / d) + 1/2)
  let s = q.toString().padStart(places + 1, '0');
  if (places > 0) s = `${s.slice(0, -places)}.${s.slice(-places)}`;
  if (s.includes('.')) s = s.replace(/\.?0+$/, '');
  return q === 0n ? '0' : (f.n < 0n ? '-' : '') + s;
}

/** Nearest double to n/d without overflowing through Number(n)/Number(d) for huge parts. */
export function fracToNumber(f: Frac): number {
  const nd = Number(f.n) / Number(f.d);
  if (Number.isFinite(nd)) return nd;
  return Number(fracToFixed(f, 12)); // huge parts: fall back to the exact decimal string
}
