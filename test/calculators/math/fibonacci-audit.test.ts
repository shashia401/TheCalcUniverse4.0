import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/fibonacci/index';
import { getValue } from '../../helpers';

// Reference values: Python big-int Fibonacci (F(100) = 354224848179261915075, OEIS A000045).
const FIB = [0n, 1n];
for (let i = 2; i <= 102; i++) FIB.push(FIB[i - 1] + FIB[i - 2]);

describe('fibonacci is exact for the whole supported range (audit)', () => {
  it('F(100) = 354224848179261915075 (the double code printed 354224848179262000000)', () => {
    const r = config.calculate({ n: '100' });
    expect(getValue(r, 'nthTerm')).toBe('354224848179261915075');
    expect(getValue(r, 'binetApproximation')).toBe('354224848179261915075'); // old float Binet: 354224848179263100000
  });
  it('F(78) is the last term below 2^53, F(79) the first above (both exact)', () => {
    expect(getValue(config.calculate({ n: '78' }), 'nthTerm')).toBe('8944394323791464');
    expect(getValue(config.calculate({ n: '79' }), 'nthTerm')).toBe('14472334024676221');
  });
  it('sum of the first n terms is F(n+2) - 1, and every listed term is exact', () => {
    for (const n of [1, 2, 10, 50, 78, 79, 100]) {
      const r = config.calculate({ n: String(n) });
      expect(getValue(r, 'sum')).toBe((FIB[n + 2] - 1n).toString());
      const terms = getValue(r, 'sequence').split(', ');
      expect(terms).toHaveLength(n);
      terms.forEach((t, i) => expect(t).toBe(FIB[i + 1].toString()));
    }
  });
  it('Binet in 60-digit precision reproduces F(n) for every n in 1..100', () => {
    for (let n = 1; n <= 100; n++) {
      expect(getValue(config.calculate({ n: String(n) }), 'binetApproximation')).toBe(FIB[n].toString());
    }
  });
  it('rejects decimals (parseInt used to round 7.9 down to 7)', () => {
    expect(config.calculate({ n: '7.9' })).toEqual([]);
    expect(config.calculate({ n: '1e1' })).toEqual([]);
    expect(config.inputs[0].max).toBe(100);
  });
});
