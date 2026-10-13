import { describe, it, expect } from 'vitest';
import factor from '../../../src/calculators/math/factor/index';
import commonFactor from '../../../src/calculators/math/common-factor/index';
import { getValue } from '../../helpers';

// Reference values: sympy 1.14 (divisors, factorint, divisor_count, divisor_sigma, gcd, lcm).
describe('factor: large inputs are exact and bounded (audit)', () => {
  it('2^53 - 1 = 6361 x 69431 x 20394401 with 8 factors and sigma 9008745449302368', () => {
    const r = factor.calculate({ number: '9007199254740991' });
    expect(getValue(r, 'count')).toBe('8');
    expect(getValue(r, 'primeFactorization')).toBe('6361 × 69431 × 20394401');
    expect(getValue(r, 'sum')).toBe('9008745449302368'); // beyond 2^53: needs BigInt
    expect(getValue(r, 'isPrime')).toBe('No');
  });
  it('a semiprime of two 27-bit primes finishes immediately', () => {
    const t = Date.now();
    const r = factor.calculate({ number: '9007195909437503' });
    expect(getValue(r, 'primeFactorization')).toBe('94906247 × 94906249');
    expect(getValue(r, 'count')).toBe('4');
    expect(Date.now() - t).toBeLessThan(1000);
  });
  it('prime near the limit is recognised', () => {
    expect(getValue(factor.calculate({ number: '9007199254740881' }), 'isPrime')).toBe('Yes');
  });
  it('highly composite 9316358251200 has 10752 factors; long lists are capped, counts are not', () => {
    const r = factor.calculate({ number: '9316358251200' });
    expect(getValue(r, 'count')).toBe('10752');
    expect(getValue(r, 'sum')).toBe('54860488704000');
    expect(getValue(r, 'factorList')).toContain('… (10252 more)');
    expect(getValue(r, 'factorPairs')).toContain('more pairs');
    expect(JSON.parse(getValue(r, '_pairsData'))).toHaveLength(100);
  });
  it('refuses values above 2^53 - 1 and decimals instead of silently rounding / truncating', () => {
    const big = factor.calculate({ number: '9007199254740993' });
    expect(big).toHaveLength(1);
    expect(big[0].id).toBe('error');
    expect(factor.calculate({ number: '24.9' })[0].id).toBe('error'); // parseInt used to give 24
    expect(factor.calculate({ number: '1e21' })[0].id).toBe('error'); // parseInt used to give 1
  });
  it('declares the supported maximum so the form blocks larger values', () => {
    expect(factor.inputs[0].max).toBe(9007199254740991);
  });
  it('classifies deficient / perfect / abundant from the proper-factor sum', () => {
    // 28 = 1+2+4+7+14 (perfect); 12: 1+2+3+4+6 = 16 (abundant); 10: 1+2+5 = 8 (deficient)
    expect(factor.calculate({ number: '28' }).find((x) => x.id === 'sum')!.interpretation).toMatch(/28 is a perfect number/);
    expect(factor.calculate({ number: '12' }).find((x) => x.id === 'sum')!.interpretation).toMatch(/add up to 16.*abundant/);
    expect(factor.calculate({ number: '10' }).find((x) => x.id === 'sum')!.interpretation).toMatch(/add up to 8.*deficient/);
    expect(factor.calculate({ number: '1' }).find((x) => x.id === 'sum')!.interpretation).toMatch(/deficient/);
  });
  it('prime factorisation row', () => {
    expect(getValue(factor.calculate({ number: '360' }), 'primeFactorization')).toBe('2^3 × 3^2 × 5');
    expect(getValue(factor.calculate({ number: '1' }), 'primeFactorization')).toBe('1');
  });
});

describe('common-factor (audit)', () => {
  it('GCF/LCM of large numbers match sympy', () => {
    const r = commonFactor.calculate({ a: '963761198400', b: '9316358251200' });
    expect(getValue(r, 'gcf')).toBe('321253732800');
    expect(getValue(r, 'lcm')).toBe('27949074753600');
    expect(getValue(r, 'commonCount')).toBe('5376');
  });
  it('coprime numbers: GCF 1, LCM = product (beyond 2^53 is exact)', () => {
    const r = commonFactor.calculate({ a: '4503599627370496', b: '5559060566555523' }); // 2^52 and 3^33
    expect(getValue(r, 'gcf')).toBe('1');
    expect(getValue(r, 'commonFactors')).toBe('1');
    expect(getValue(r, 'lcm')).toBe('25035783096069471761256476049408'); // python: 2**52 * 3**33
  });
  it('rejects decimals / over-range per field, blanks stay empty', () => {
    expect(commonFactor.calculate({ a: '12.5', b: '18' })[0].id).toBe('error');
    expect(commonFactor.calculate({ a: '12', b: '9007199254740993' })[0].value).toMatch(/Number B/);
    expect(commonFactor.calculate({ a: '', b: '18' })).toEqual([]);
    expect(commonFactor.calculate({ a: '0', b: '18' })).toEqual([]);
  });
  it('declares the maximum on both inputs', () => {
    expect(commonFactor.inputs.map((i) => i.max)).toEqual([9007199254740991, 9007199254740991]);
  });
});
