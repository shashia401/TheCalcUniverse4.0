// Exact positional-base conversion on BigInt: arbitrary length, negative numbers, fractional digits, bases 2-36.
// (parseInt / Number.toString lose digits past 2^53 and cannot do fractions or mixed bases reliably.)
import { Frac, decimalExpansion, formatExpansion, makeFrac } from '../../../utils/rational';

export const MAX_INPUT_DIGITS = 1000;
export const MAX_FRACTION_DIGITS = 24;
const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export interface ParsedBaseNumber {
  value: Frac;
  /** Digits typed after the point (0 for integers). */
  fractionDigits: number;
}

/** "-1A.8" in base 16 -> exact -26.5. Returns null for an empty string, a stray character or a digit >= base. */
export function parseInBase(raw: string, base: number): ParsedBaseNumber | null {
  const s = raw.trim().toUpperCase();
  const m = /^([+-]?)([0-9A-Z]*)(?:\.([0-9A-Z]*))?$/.exec(s);
  if (!m) return null;
  const [, sign, intPart, fracPart = ''] = m;
  if (intPart === '' && fracPart === '') return null;
  if (intPart.length + fracPart.length > MAX_INPUT_DIGITS) return null;
  const b = BigInt(base);
  let num = 0n;
  for (const ch of intPart + fracPart) {
    const d = DIGITS.indexOf(ch);
    if (d < 0 || d >= base) return null;
    num = num * b + BigInt(d);
  }
  const den = b ** BigInt(fracPart.length);
  return { value: makeFrac(sign === '-' ? -num : num, den), fractionDigits: fracPart.length };
}

export interface BaseString {
  text: string;
  /** True when the fractional expansion did not terminate within maxFraction digits. */
  truncated: boolean;
  /** Number of digit characters (sign and point excluded). */
  digitCount: number;
}

/** Exact integer part plus up to `maxFraction` fractional digits (truncated, not rounded) in the target base. */
export function toBaseString(v: Frac, base: number, maxFraction = MAX_FRACTION_DIGITS): BaseString {
  const neg = v.n < 0n;
  const n = neg ? -v.n : v.n;
  const intPart = (n / v.d).toString(base).toUpperCase();
  let rem = n % v.d;
  const b = BigInt(base);
  let frac = '';
  while (rem !== 0n && frac.length < maxFraction) {
    rem *= b;
    frac += DIGITS[Number(rem / v.d)];
    rem %= v.d;
  }
  const truncated = rem !== 0n;
  const isZero = n === 0n;
  return {
    text: `${neg && !isZero ? '-' : ''}${intPart}${frac ? `.${frac}` : ''}`,
    truncated,
    digitCount: intPart.length + frac.length,
  };
}

/** Exact decimal value as text: "-26.5", "0.(3)" for a repeating one. */
export const decimalText = (v: Frac): string => formatExpansion(decimalExpansion(v, 40));

export type BaseOutcome =
  | { kind: 'incomplete' }
  | { kind: 'ok'; from: number; to: number; parsed: ParsedBaseNumber; out: BaseString }
  | { kind: 'invalid' };

const parseBase = (raw: string | undefined): number | null => {
  const s = (raw ?? '').trim();
  if (!/^\d{1,2}$/.test(s)) return null;
  const n = Number(s);
  return n >= 2 && n <= 36 ? n : null;
};

export function convertBase(values: Record<string, string>): BaseOutcome {
  const input = (values.input ?? '').trim();
  if (!input || !values.fromBase || !values.toBase) return { kind: 'incomplete' };
  const from = parseBase(values.fromBase);
  const to = parseBase(values.toBase);
  if (from === null || to === null) return { kind: 'incomplete' };
  const parsed = parseInBase(input, from);
  if (!parsed) return { kind: 'invalid' };
  return { kind: 'ok', from, to, parsed, out: toBaseString(parsed.value, to) };
}
