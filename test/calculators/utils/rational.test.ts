import { describe, it, expect } from 'vitest';
import {
  makeFrac, addFrac, subFrac, mulFrac, divFrac, fracToString, parseIntegerStrict, parseDecimalExact,
  decimalExpansion, formatExpansion, fracToFixed, gcdBig, lcmBig, fracToNumber,
} from '../../../src/utils/rational';

// Expected values below were produced independently with Python's fractions.Fraction / long division.
const f = (n: number | bigint, d: number | bigint = 1) => makeFrac(BigInt(n), BigInt(d));
const show = (n: number | bigint, d: number | bigint = 1) => formatExpansion(decimalExpansion(f(n, d)));

describe('rational arithmetic is exact', () => {
  it('reduces and normalises the sign', () => {
    expect(fracToString(f(6, -8))).toBe('-3/4');
    expect(fracToString(f(0, -5))).toBe('0');
    expect(() => f(1, 0)).toThrow(RangeError);
  });
  it('add / sub / mul / div match Python Fraction', () => {
    expect(fracToString(addFrac(f(3, 4), f(1, 3)))).toBe('13/12');
    expect(fracToString(subFrac(f(-1, 2), f(-1, 3)))).toBe('-1/6');
    expect(fracToString(addFrac(f(12345678901234567890n, 9876543210987654321n), f(1, 3)))).toBe('521261999/329218107');
    expect(fracToString(divFrac(f(2, 3), f(-4, 5)))).toBe('-5/6');
    expect(() => divFrac(f(1, 2), f(0, 3))).toThrow(RangeError);
    expect(fracToString(mulFrac(f(10n ** 30n + 1n, 10n ** 15n), f(10n ** 15n + 1n, 10n ** 30n)))).toBe(
      '1000000000000001000000000000001000000000000001/1000000000000000000000000000000000000000000000',
    );
  });
  it('gcd / lcm with BigInt beyond 2^53', () => {
    expect(gcdBig(-12n, 18n)).toBe(6n);
    expect(gcdBig(0n, 0n)).toBe(0n);
    expect(lcmBig(2n ** 60n, 3n)).toBe(3n * 2n ** 60n);
  });
});

describe('strict parsing', () => {
  it('parseIntegerStrict rejects what parseInt would silently truncate', () => {
    expect(parseIntegerStrict('42')).toBe(42n);
    expect(parseIntegerStrict(' -7 ')).toBe(-7n);
    for (const bad of ['2.5', '1e3', '12abc', '', ' ', 'abc', '--1']) expect(parseIntegerStrict(bad)).toBeNull();
    expect(parseIntegerStrict('9'.repeat(301))).toBeNull(); // bounded work
  });
  it('parseDecimalExact is exact (0.1 is 1/10, not the nearest double)', () => {
    expect(fracToString(parseDecimalExact('0.1')!)).toBe('1/10');
    expect(fracToString(parseDecimalExact('-12.340')!)).toBe('-617/50');
    expect(fracToString(parseDecimalExact('.5')!)).toBe('1/2');
    expect(fracToString(parseDecimalExact('1.5e-3')!)).toBe('3/2000');
    expect(fracToString(parseDecimalExact('2e3')!)).toBe('2000');
    for (const bad of ['', '.', '-', 'abc', '1.2.3', '1e', '1e5000']) expect(parseDecimalExact(bad)).toBeNull();
  });
});

describe('decimal expansion with exact repeating block', () => {
  it('matches long division (Python reference)', () => {
    expect(show(1, 3)).toBe('0.(3)');
    expect(show(1, 6)).toBe('0.1(6)');
    expect(show(1, 7)).toBe('0.(142857)');
    expect(show(1, 8)).toBe('0.125');
    expect(show(-7, 12)).toBe('-0.58(3)');
    expect(show(22, 7)).toBe('3.(142857)');
    expect(show(1, 1024)).toBe('0.0009765625');
    expect(show(5)).toBe('5');
    expect(show(0)).toBe('0');
  });
  it('period of 1/97 is 96 digits (full reptend prime)', () => {
    expect(decimalExpansion(f(1, 97)).repeating).toHaveLength(96);
    expect(decimalExpansion(f(1, 97)).truncated).toBe(false);
  });
  it('reports truncation when the period exceeds the cap', () => {
    const e = decimalExpansion(f(1, 97), 50);
    expect(e.truncated).toBe(true);
    expect(formatExpansion(e).endsWith('…')).toBe(true);
  });
  it('fracToFixed rounds half away from zero and trims zeros', () => {
    expect(fracToFixed(f(1, 3), 8)).toBe('0.33333333');
    expect(fracToFixed(f(2, 3), 4)).toBe('0.6667');
    expect(fracToFixed(f(-1, 2), 0)).toBe('-1'); // -0.5 -> -1 (away from zero)
    expect(fracToFixed(f(5, 1), 4)).toBe('5');
    expect(fracToFixed(f(1, 1000000), 4)).toBe('0');
    expect(fracToFixed(f(-1, 1000), 2)).toBe('0'); // rounds to zero: no "-0"
  });
  it('fracToNumber survives parts larger than the double range', () => {
    expect(fracToNumber(f(3, 4))).toBe(0.75);
    expect(fracToNumber(f(10n ** 400n, 3n * 10n ** 399n))).toBeCloseTo(3.333333333333, 9);
  });
});
