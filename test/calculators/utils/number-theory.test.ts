import { describe, it, expect } from 'vitest';
import {
  factorize, divisorsOf, isPrime, gcdNum, sigma, parsePositiveSafeInt, capList, formatFactorization, MAX_FACTOR_INPUT,
} from '../../../src/utils/numberTheory';

// Reference values from sympy 1.14 (factorint, divisor_count, divisor_sigma, prevprime).
describe('factorize / isPrime stay exact up to 2^53 - 1', () => {
  it('2^53 - 1 = 6361 x 69431 x 20394401', () => {
    expect(factorize(MAX_FACTOR_INPUT)).toEqual([[6361, 1], [69431, 1], [20394401, 1]]);
    expect(divisorsOf(MAX_FACTOR_INPUT)).toHaveLength(8);
    expect(sigma(factorize(MAX_FACTOR_INPUT))).toBe(9008745449302368n);
  });
  it('largest semiprime of two ~47-bit primes (worst case for trial division) is instant', () => {
    const t = Date.now();
    expect(factorize(9007195909437503)).toEqual([[94906247, 1], [94906249, 1]]);
    expect(factorize(8999999999999999)).toEqual([[757, 1], [7639, 1], [1556360213, 1]]);
    expect(Date.now() - t).toBeLessThan(1000);
  });
  it('primes and prime powers', () => {
    expect(isPrime(9007199254740881)).toBe(true); // prevprime(2^53 - 1)
    expect(isPrime(9007199254740991)).toBe(false);
    expect(isPrime(1)).toBe(false);
    expect(isPrime(2)).toBe(true);
    expect(factorize(2 ** 52)).toEqual([[2, 52]]);
    expect(factorize(3 ** 33)).toEqual([[3, 33]]);
    expect(factorize(1)).toEqual([]);
  });
  it('highly composite number: 10752 divisors, sigma 54860488704000', () => {
    const n = 9316358251200;
    expect(divisorsOf(n)).toHaveLength(10752);
    expect(sigma(factorize(n))).toBe(54860488704000n);
  });
  it('agrees with brute-force trial division on random numbers', () => {
    let seed = 12345;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648);
    for (let i = 0; i < 300; i++) {
      const n = (rnd() % 5_000_000) + 1;
      const brute: number[] = [];
      for (let d = 1; d * d <= n; d++) if (n % d === 0) brute.push(d, n / d);
      const want = [...new Set(brute)].sort((a, b) => a - b);
      expect(divisorsOf(n)).toEqual(want);
    }
  });
  it('rejects non-safe input', () => {
    expect(() => factorize(0)).toThrow();
    expect(() => factorize(2 ** 60)).toThrow();
    expect(() => factorize(1.5)).toThrow();
  });
  it('formats and helpers', () => {
    expect(formatFactorization(factorize(360))).toBe('2^3 × 3^2 × 5');
    expect(formatFactorization([])).toBe('1');
    expect(gcdNum(-12, 18)).toBe(6);
    expect(capList([1, 2, 3], 5)).toBe('1, 2, 3');
    expect(capList([1, 2, 3, 4], 2)).toBe('1, 2, … (2 more)');
  });
});

describe('parsePositiveSafeInt', () => {
  it('classifies input', () => {
    expect(parsePositiveSafeInt('24')).toEqual({ kind: 'ok', n: 24 });
    expect(parsePositiveSafeInt('9007199254740991')).toEqual({ kind: 'ok', n: 9007199254740991 });
    for (const blank of ['', ' ', 'abc', '0', '-5', 'NaN', undefined]) {
      expect(parsePositiveSafeInt(blank as string).kind).toBe('incomplete');
    }
    for (const bad of ['24.5', '1e3', '9007199254740992', '99999999999999999999']) {
      expect(parsePositiveSafeInt(bad).kind).toBe('invalid');
    }
  });
});
