import { describe, it, expect } from 'vitest';
import { niceTicks, linearScale, formatTick } from '../../src/utils/chartScale';

// Expected values derived by hand from the 1-2-5 step rule (not from the code).
describe('niceTicks', () => {
  it('0..100 (5 ticks wanted) -> step 50', () => expect(niceTicks(0, 100, 5)).toEqual([0, 50, 100]));
  it('0..10 -> step 5', () => expect(niceTicks(0, 10, 5)).toEqual([0, 5, 10]));
  it('0..1 -> step 0.5', () => expect(niceTicks(0, 1, 5)).toEqual([0, 0.5, 1]));
  it('spans zero: -3..7 -> -5..10 by 5', () => expect(niceTicks(-3, 7, 5)).toEqual([-5, 0, 5, 10]));
  it('flat data (5,5) is padded', () => expect(niceTicks(5, 5, 5)).toEqual([0, 5, 10]));
  it('no float drift: 0..0.3 -> 0,0.1,0.2,0.3', () => expect(niceTicks(0, 0.3, 4)).toEqual([0, 0.1, 0.2, 0.3]));
  it('swapped bounds are normalised', () => expect(niceTicks(10, 0, 5)).toEqual([0, 5, 10]));
  it('non-finite input yields no ticks', () => {
    expect(niceTicks(NaN, 1)).toEqual([]);
    expect(niceTicks(0, Infinity)).toEqual([]);
  });
  it('always covers the data', () => {
    for (const [lo, hi] of [[0, 37], [12.5, 480], [-90, 40], [0, 1e6], [0.002, 0.009]]) {
      const t = niceTicks(lo, hi, 5);
      expect(t[0]).toBeLessThanOrEqual(lo);
      expect(t[t.length - 1]).toBeGreaterThanOrEqual(hi);
    }
  });
});

describe('linearScale', () => {
  it('maps midpoint', () => expect(linearScale(0, 10, 0, 100)(5)).toBe(50));
  it('supports an inverted range (SVG y axis)', () => expect(linearScale(0, 10, 100, 0)(2)).toBe(80));
  it('zero-width domain maps to the range midpoint', () => expect(linearScale(3, 3, 0, 100)(3)).toBe(50));
});

describe('formatTick', () => {
  it.each([
    [1200, '1200'],
    [25000, '25K'],
    [12345, '12.3K'],
    [2500000, '2.5M'],
    [1.5e9, '1.5B'],
    [0.25, '0.25'],
    [3.14159, '3.14'],
    [0, '0'],
  ])('%s -> %s', (n, s) => expect(formatTick(n)).toBe(s));
});
