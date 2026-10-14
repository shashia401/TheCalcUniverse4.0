import { decimalExpansion, formatExpansion, fracToFixed, makeFrac, parseIntegerStrict } from '../../../utils/rational';

export const LD_MAX_DIGITS = 30;

export interface LdStep {
  /** index of the dividend digit that was brought down (the step's right edge in the tableau) */
  col: number;
  /** partial dividend after bringing the digit down */
  partial: bigint;
  qDigit: bigint;
  product: bigint;
  remainder: bigint;
}

export interface LongDivision {
  dividend: bigint;
  divisor: bigint;
  /** truncated toward zero, so dividend = quotient × divisor + remainder */
  quotient: bigint;
  /** carries the sign of the dividend (same convention as JavaScript's % and C) */
  remainder: bigint;
  /** the digit-by-digit algorithm on |dividend| ÷ |divisor| */
  steps: LdStep[];
  decimal6: string;
  /** "0.1(6)" style exact expansion, "…" if the repeating block is longer than the cap */
  expansion: string;
  period: number;
  terminates: boolean;
  truncated: boolean;
}

export type LdParse = { kind: 'incomplete' } | { kind: 'invalid'; message: string } | { kind: 'ok'; result: LongDivision };

export function parseLongDivision(rawA: string | undefined, rawB: string | undefined): LdParse {
  const a = parseIntegerStrict(rawA, LD_MAX_DIGITS);
  const b = parseIntegerStrict(rawB, LD_MAX_DIGITS);
  const bad = (s: string | undefined) => (s ?? '').trim() !== '' && /^[+-]?(\d+\.\d*|\.\d+|\d+[eE][+-]?\d+)$/.test((s ?? '').trim());
  if (bad(rawA) || bad(rawB)) return { kind: 'invalid', message: 'Enter whole numbers (no decimals or exponents).' };
  if ((rawA ?? '').trim().replace(/^[+-]/, '').length > LD_MAX_DIGITS || (rawB ?? '').trim().replace(/^[+-]/, '').length > LD_MAX_DIGITS) {
    if (/^[+-]?\d+$/.test((rawA ?? '').trim()) && /^[+-]?\d+$/.test((rawB ?? '').trim())) {
      return { kind: 'invalid', message: `Numbers are limited to ${LD_MAX_DIGITS} digits.` };
    }
  }
  if (a === null || b === null) return { kind: 'incomplete' };
  if (b === 0n) return { kind: 'invalid', message: 'Cannot divide by zero.' };
  return { kind: 'ok', result: longDivide(a, b) };
}

export function longDivide(dividend: bigint, divisor: bigint): LongDivision {
  const absA = dividend < 0n ? -dividend : dividend;
  const absB = divisor < 0n ? -divisor : divisor;
  const digits = absA.toString();
  const steps: LdStep[] = [];
  let current = 0n;
  for (let i = 0; i < digits.length; i++) {
    current = current * 10n + BigInt(digits[i]);
    const qDigit = current / absB;
    const product = qDigit * absB;
    const remainder = current - product;
    steps.push({ col: i, partial: current, qDigit, product, remainder });
    current = remainder;
  }
  const quotient = dividend / divisor; // BigInt division truncates toward zero
  const remainder = dividend % divisor;
  const frac = makeFrac(dividend, divisor);
  const e = decimalExpansion(frac, 2000);
  return {
    dividend,
    divisor,
    quotient,
    remainder,
    steps,
    decimal6: fracToFixed(frac, 6),
    expansion: formatExpansion(e),
    period: e.repeating.length,
    terminates: !e.repeating && !e.truncated,
    truncated: e.truncated,
  };
}

/** Quotient digits of |dividend| ÷ |divisor| as printed above the bracket (leading zeros dropped, "0" if none). */
export function quotientDigits(steps: LdStep[]): string {
  const s = steps.map((x) => x.qDigit.toString()).join('').replace(/^0+/, '');
  return s || '0';
}
