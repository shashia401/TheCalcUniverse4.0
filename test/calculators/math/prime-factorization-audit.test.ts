// Oracle: sympy.factorint / isprime.
import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/prime-factorization/index';
import { buildFactorTree, layoutTree, primeList } from '../../../src/calculators/math/prime-factorization/factorTree';
import { getValue } from '../../helpers';

const f = (number: string) => config.calculate({ number });

describe('prime factorization audit', () => {
  it('2^53 - 1 = 6361 x 69431 x 20394401', () => {
    expect(getValue(f('9007199254740991'), 'factorization')).toBe('6361 × 69431 × 20394401');
  });
  it('product of two 8-digit primes (94906247 x 94906249) is instant and exact', () => {
    const t = Date.now();
    expect(getValue(f('9007195909437503'), 'factorization')).toBe('94906247 × 94906249');
    expect(Date.now() - t).toBeLessThan(2000);
  });
  it('largest 15-digit prime-times-9 and a pure power of two', () => {
    expect(getValue(f('8999999999999901'), 'factorization')).toBe('3^2 × 999999999999989');
    expect(getValue(f('4503599627370496'), 'factorization')).toBe('2^52');
    expect(getValue(f('4503599627370496'), 'totalPrimes')).toBe('52');
  });
  it('worked examples 72, 144, 84', () => {
    expect(getValue(f('72'), 'factorization')).toBe('2^3 × 3^2');
    expect(getValue(f('144'), 'factorization')).toBe('2^4 × 3^2');
    expect(getValue(f('84'), 'factorization')).toBe('2^2 × 3 × 7');
    expect(getValue(f('84'), 'primeFactors')).toBe('2, 3, 7');
  });
  it('primes and 1 / out of range / decimals', () => {
    expect(getValue(f('8999999999999971'), 'factorization')).toBe('8999999999999971'); // sympy.isprime -> True
    expect(f('1')).toEqual([]);
    expect(f('9007199254740993')[0].id).toBe('error');
    expect(f('12.5')[0].id).toBe('error');
  });
  it('factor tree leaves multiply back to n and depth stays logarithmic', () => {
    expect(primeList(72)).toEqual([2, 2, 2, 3, 3]);
    const tree = buildFactorTree(72);
    expect(tree.value).toBe(72);
    const leaves: number[] = [];
    const walk = (n: typeof tree) => (n.left && n.right ? (walk(n.left), walk(n.right)) : leaves.push(n.value));
    walk(tree);
    expect(leaves).toEqual([2, 2, 2, 3, 3]);
    const big = layoutTree(buildFactorTree(4503599627370496)); // 52 prime factors
    expect(big.nodes.filter((nd) => nd.isPrime)).toHaveLength(52);
    expect(big.height).toBeLessThan(500);
    expect(layoutTree(buildFactorTree(97)).nodes).toHaveLength(1);
  });
});
