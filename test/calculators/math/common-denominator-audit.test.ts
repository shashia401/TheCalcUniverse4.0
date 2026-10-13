import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/common-denominator/index';
import { getValue } from '../../helpers';

// Reference values: Python math.lcm.
const run = (numerators: string, denominators: string) => config.calculate({ numerators, denominators });

describe('common-denominator: exact LCD for any size (audit)', () => {
  it('LCD of 12, 18, 30, 45 is 180 with multipliers 15, 10, 6, 4', () => {
    const r = run('1, 1, 1, 1', '12, 18, 30, 45');
    expect(getValue(r, 'lcd')).toBe('180');
    const conv = JSON.parse(getValue(r, '_convertedFractions'));
    expect(conv.map((c: { multiplier: number }) => c.multiplier)).toEqual([15, 10, 6, 4]);
  });
  it('primes beyond 2^26: product is exact (doubles/the old 10^12 guard failed)', () => {
    expect(getValue(run('1, 1', '1000000007, 998244353'), 'lcd')).toBe('998244359987710471');
    expect(getValue(run('1, 1', `${10n ** 40n + 7n}, ${10n ** 40n + 9n}`), 'lcd')).toBe(
      '100000000000000000000000000000000000000160000000000000000000000000000000000000063',
    );
  });
  it('LCD of the first 25 primes (primorial 97#)', () => {
    const primes = '2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97';
    expect(getValue(run('1', primes), 'lcd')).toBe('2305567963945518424753102147331756070');
  });
  it('converted numerators: plain numbers when safe, exact decimal strings beyond 2^53', () => {
    // lcd = lcm(1000000007, 3) = 3000000021; multipliers 3 and 1000000007 (Python)
    const r = run('3, 9007199254740991', '1000000007, 3');
    expect(getValue(r, 'lcd')).toBe('3000000021');
    const conv = JSON.parse(getValue(r, '_convertedFractions'));
    expect(conv[0].numerator).toBe(9);
    expect(conv[1].numerator).toBe('9007199317791385783186937'); // 9007199254740991 x 1000000007
    expect(conv[1].multiplier).toBe(1000000007);
  });
  it('zero and negative numerators are valid (only denominators must be positive)', () => {
    const r = run('0, -1', '4, 6');
    expect(getValue(r, 'lcd')).toBe('12');
    const conv = JSON.parse(getValue(r, '_convertedFractions'));
    expect(conv[0].numerator).toBe(0);
    expect(conv[1].numerator).toBe(-2);
  });
  it('rejects zero / negative denominators and decimals with a message instead of truncating', () => {
    expect(run('1, 1', '0, 3')[0].id).toBe('error');
    expect(run('1, 1', '-2, 3')[0].id).toBe('error');
    expect(run('1, 1', '2.5, 3')[0].id).toBe('error'); // parseInt used to turn 2.5 into 2
    expect(run('1/2, 1', '2, 3')).toEqual([]); // not a number list
  });
  it('bounds the work', () => {
    const many = Array(101).fill('2').join(',');
    expect(run('1', many)[0].id).toBe('error');
    expect(run('1', '9'.repeat(101))[0].id).toBe('error');
  });
});
