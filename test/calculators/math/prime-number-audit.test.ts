// Oracle: sympy.isprime / factorint / divisor_count.
import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/prime-number/index';
import { analyzePrime } from '../../../src/calculators/math/prime-number/primeNumberMath';
import { getValue } from '../../helpers';

const f = (n: string) => config.calculate({ n });

describe('prime number audit', () => {
  it('1 is neither prime nor composite', () => {
    const r = f('1');
    expect(getValue(r, 'isPrime')).toBe('No');
    expect(getValue(r, 'factors')).toContain('neither prime nor composite');
    expect(getValue(r, 'divisorCount')).toBe('1');
  });
  it('Carmichael / strong pseudoprime traps are composite: 561, 3215031751 (psp to bases 2,3,5,7)', () => {
    expect(getValue(f('561'), 'isPrime')).toBe('No');
    expect(analyzePrime(3215031751).prime).toBe(false); // = 151 x 751 x 28351
    expect(analyzePrime(3215031751).factors).toEqual([151, 751, 28351]);
  });
  it('large primes up to 2^53: 9007199254740881 (largest prime below 2^53), 1000000000000037', () => {
    expect(getValue(f('9007199254740881'), 'isPrime')).toBe('Yes');
    expect(getValue(f('1000000000000037'), 'isPrime')).toBe('Yes');
    expect(getValue(f('9007199254740991'), 'isPrime')).toBe('No'); // 6361 x 69431 x 20394401
  });
  it('divisor counts: 720 -> 30, 2^53-2 -> 256 (8 distinct primes)', () => {
    expect(getValue(f('720'), 'divisorCount')).toBe('30');
    expect(getValue(f('9007199254740990'), 'divisorCount')).toBe('256');
  });
  it('steps: trial division for small n, Miller-Rabin explanation above 10 million', () => {
    expect(getValue(f('97'), 'primalityCheck')).toContain('No divisors found up to 9');
    expect(getValue(f('91'), 'primalityCheck')).toContain('91 ÷ 7 = 13');
    expect(getValue(f('10000019'), 'primalityCheck')).toContain('Miller');
    expect(getValue(f('1000000000000039'), 'primalityCheck')).toContain('smallest prime factor');
  });
  it('rejects decimals/too large with a message; 0 and negatives are empty', () => {
    expect(f('7.5')[0].id).toBe('error');
    expect(f('9007199254740993')[0].id).toBe('error');
    expect(f('0')).toEqual([]);
    expect(f('-7')).toEqual([]);
  });
  it('M136279841 digit count claim (FAQ): floor(p*log10(2)) + 1 = 41,024,320', () => {
    expect(Math.floor(136279841 * Math.log10(2)) + 1).toBe(41024320);
  });
});
