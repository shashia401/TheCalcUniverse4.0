import { describe, it, expect } from 'vitest';
import { randomBelow, randomInt, randomDistinctInts, cryptoU32 } from '../../../src/utils/random';
import { chiSqSf } from '../../../src/utils/distributions';
import dice, { rollDice } from '../../../src/calculators/math/dice-roller/index';
import randomNumber, { gridFor, generateGridValues } from '../../../src/calculators/math/random-number/index';
import { getValue } from '../../helpers';

// Deterministic 32-bit stream (mulberry32) so statistical assertions never flake.
function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  };
}

/** Pearson chi-square goodness of fit against a uniform expectation; returns the p-value (scipy chi2.sf equivalent). */
function uniformityP(counts: number[]): number {
  const n = counts.reduce((a, b) => a + b, 0);
  const e = n / counts.length;
  const stat = counts.reduce((s, c) => s + (c - e) ** 2 / e, 0);
  return chiSqSf(stat, counts.length - 1);
}

describe('rejection sampling (no modulo bias)', () => {
  it('draws at or above the largest multiple of n are discarded: n=6 limit is 4294967292', () => {
    // 2^32 mod 6 = 4, so only 2^32 - 4 values are usable. The four rejected draws must NOT be mapped with "% 6".
    const stream = [4294967295, 4294967294, 4294967293, 4294967292, 11];
    let i = 0;
    const v = randomBelow(6, () => stream[i++]);
    expect(v).toBe(11 % 6);
    expect(i).toBe(5);
  });
  it('the largest accepted draw (limit - 1) is used directly', () => {
    expect(randomBelow(6, () => 4294967291)).toBe(4294967291 % 6);
  });
  it('powers of two never reject', () => {
    let calls = 0;
    expect(randomBelow(8, () => (calls++, 4294967295))).toBe(7);
    expect(calls).toBe(1);
  });
  it('n=1 consumes no randomness; invalid n throws', () => {
    let calls = 0;
    expect(randomBelow(1, () => (calls++, 0))).toBe(0);
    expect(calls).toBe(0);
    expect(() => randomBelow(0)).toThrow(RangeError);
    expect(() => randomBelow(1.5)).toThrow(RangeError);
    expect(() => randomBelow(2 ** 53 + 2)).toThrow(RangeError);
  });
  it('53-bit path: n > 2^32 combines two words and stays in range', () => {
    expect(randomBelow(2 ** 53, (() => { const s = [0x1fffff, 0xffffffff]; let i = 0; return () => s[i++]; })())).toBe(2 ** 53 - 1);
    const rnd = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = randomBelow(2 ** 40 + 12345, rnd);
      expect(Number.isInteger(v) && v >= 0 && v < 2 ** 40 + 12345).toBe(true);
    }
  });
  it('randomInt is inclusive on both ends and handles negatives', () => {
    const rnd = mulberry32(1);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) seen.add(randomInt(-2, 2, rnd));
    expect([...seen].sort((a, b) => a - b)).toEqual([-2, -1, 0, 1, 2]);
  });
});

describe('uniformity (chi-square sanity, deterministic seed)', () => {
  for (const sides of [4, 6, 8, 10, 12, 20, 100]) {
    it(`D${sides}: ${sides * 4000} rolls are uniform (p > 0.001)`, () => {
      const rnd = mulberry32(1234 + sides);
      const counts = new Array(sides).fill(0);
      for (let i = 0; i < sides * 4000; i++) counts[randomInt(1, sides, rnd) - 1]++;
      expect(uniformityP(counts)).toBeGreaterThan(0.001);
    });
  }
  it('real crypto source: D6 over 60000 rolls (p > 1e-6, so it essentially never flakes)', () => {
    const counts = new Array(6).fill(0);
    for (let i = 0; i < 60000; i++) counts[randomInt(1, 6, cryptoU32) - 1]++;
    expect(uniformityP(counts)).toBeGreaterThan(1e-6);
  });
  it('2d6 total follows the triangular distribution (7 is 6/36)', () => {
    const rnd = mulberry32(99);
    const N = 180000;
    const counts = new Array(11).fill(0);
    for (let i = 0; i < N; i++) {
      const r = rollDice(2, 6, rnd);
      counts[r[0] + r[1] - 2]++;
    }
    const probs = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1].map((w) => w / 36);
    const stat = counts.reduce((s, c, i) => s + (c - N * probs[i]) ** 2 / (N * probs[i]), 0);
    expect(chiSqSf(stat, 10)).toBeGreaterThan(0.001);
  });
});

describe('dice-roller calculator', () => {
  it('2D6+3: total = sum of rolls + 3, expected 10, range 5 to 15, structured roll data', () => {
    const r = dice.calculate({ count: '2', sides: '6', modifier: '3' });
    const rolls = JSON.parse(getValue(r, '_rollData'));
    expect(rolls).toHaveLength(2);
    expect(rolls.every((x: number) => Number.isInteger(x) && x >= 1 && x <= 6)).toBe(true);
    expect(getValue(r, '_sides')).toBe('6');
    expect(Number(getValue(r, 'total'))).toBe(rolls[0] + rolls[1] + 3);
    expect(getValue(r, 'expected')).toBe('10');
    expect(getValue(r, 'totalRange')).toBe('5 to 15');
    expect(getValue(r, 'modifier')).toBe('+3');
    expect(getValue(r, 'count')).toBe('D6 × 2');
  });
  it('1D20+5 expected 15.5 (worked example), 3D6 expected 10.5, 1D100 range 1 to 100', () => {
    expect(getValue(dice.calculate({ count: '1', sides: '20', modifier: '5' }), 'expected')).toBe('15.5');
    expect(getValue(dice.calculate({ count: '3', sides: '6', modifier: '0' }), 'expected')).toBe('10.5');
    expect(getValue(dice.calculate({ count: '1', sides: '100', modifier: '' }), 'totalRange')).toBe('1 to 100');
  });
  it('negative modifier formats with a minus sign and can make totals negative', () => {
    const r = dice.calculate({ count: '1', sides: '4', modifier: '-20' });
    expect(getValue(r, 'modifier')).toBe('-20');
    expect(Number(getValue(r, 'total'))).toBeLessThan(0);
  });
  it('REGRESSION: parseInt truncation — "2.5" dice, "3abc", unknown sides and non-integer modifiers are rejected', () => {
    expect(dice.calculate({ count: '2.5', sides: '6', modifier: '0' })).toEqual([]);
    expect(dice.calculate({ count: '3abc', sides: '6', modifier: '0' })).toEqual([]);
    expect(dice.calculate({ count: '2', sides: '7', modifier: '0' })).toEqual([]);
    expect(dice.calculate({ count: '2', sides: '6', modifier: '1.5' })).toEqual([]);
    expect(dice.calculate({ count: '0', sides: '6', modifier: '0' })).toEqual([]);
    expect(dice.calculate({ count: '', sides: '6', modifier: '0' })).toEqual([]);
  });
  it('average roll excludes the modifier', () => {
    const r = dice.calculate({ count: '4', sides: '6', modifier: '10' });
    const rolls = JSON.parse(getValue(r, '_rollData'));
    const raw = rolls.reduce((a: number, b: number) => a + b, 0);
    expect(getValue(r, 'average')).toBe((raw / 4).toFixed(1));
  });
});

describe('random-number calculator', () => {
  it('gridFor: integer and decimal grids include both endpoints', () => {
    expect(gridFor(1, 6, 0)).toEqual({ lo: 1, hi: 6, decimals: 0 });
    expect(gridFor(0, 1, 1)).toEqual({ lo: 0, hi: 10, decimals: 1 });
    expect(gridFor(-1.25, 1.25, 2)).toEqual({ lo: -125, hi: 125, decimals: 2 });
  });
  it('gridFor: fractional bounds round inward for integers (0.2 to 0.8 holds no integer); too-large ranges are refused', () => {
    expect(gridFor(0.2, 0.8, 0)).toBeNull();
    expect(gridFor(0.2, 1.8, 0)).toEqual({ lo: 1, hi: 1, decimals: 0 });
    expect(gridFor(-1e300, 1e300, 0)).toBeNull();
    expect(gridFor(0, 1e12, 5)).toBeNull(); // 1e17 grid points > 2^53
  });
  it('REGRESSION: endpoints are exactly as likely as interior values (old Math.round gave 0 and 1 half weight): 0 to 1 by 0.1, 110000 draws', () => {
    const spec = gridFor(0, 1, 1)!;
    const rnd = mulberry32(2024);
    const counts = new Array(11).fill(0);
    for (const v of generateGridValues(spec, 110000, false, rnd)) counts[v]++;
    expect(uniformityP(counts)).toBeGreaterThan(0.001);
    expect(Math.min(...counts)).toBeGreaterThan(9000); // old method: endpoints near 5000
  });
  it('unique values come from a partial shuffle: asking for the whole range returns a permutation', () => {
    const rnd = mulberry32(5);
    const all = randomDistinctInts(1, 50, 50, rnd);
    expect([...all].sort((a, b) => a - b)).toEqual(Array.from({ length: 50 }, (_, i) => i + 1));
    expect(new Set(randomDistinctInts(1, 49, 6, rnd)).size).toBe(6);
    expect(() => randomDistinctInts(1, 5, 6, rnd)).toThrow(RangeError);
  });
  it('first element of a unique draw is uniform (Fisher-Yates not biased): 1..10, 100000 draws', () => {
    const rnd = mulberry32(31);
    const counts = new Array(10).fill(0);
    for (let i = 0; i < 100000; i++) counts[randomDistinctInts(1, 10, 3, rnd)[0] - 1]++;
    expect(uniformityP(counts)).toBeGreaterThan(0.001);
  });
  it('sparse shuffle handles huge ranges in O(count) memory', () => {
    const rnd = mulberry32(8);
    const out = randomDistinctInts(0, 1e12, 5, rnd);
    expect(new Set(out).size).toBe(5);
    expect(out.every((v) => v >= 0 && v <= 1e12)).toBe(true);
  });
  it('calculate: list, sum, average, min, max, range are mutually consistent (exact decimal arithmetic)', () => {
    const r = randomNumber.calculate({ min: '0', max: '1', count: '50', decimals: '3', unique: 'no' });
    const nums = getValue(r, 'numberList').split(', ').map(Number);
    expect(nums).toHaveLength(50);
    expect(nums.every((n) => n >= 0 && n <= 1 && Math.abs(n * 1000 - Math.round(n * 1000)) < 1e-9)).toBe(true);
    const sumThousandths = nums.reduce((a, n) => a + Math.round(n * 1000), 0);
    expect(getValue(r, 'sum')).toBe((sumThousandths / 1000).toFixed(3));
    expect(getValue(r, 'minValue')).toBe(Math.min(...nums).toFixed(3));
    expect(getValue(r, 'maxValue')).toBe(Math.max(...nums).toFixed(3));
    expect(getValue(r, 'range')).toBe((Math.round((Math.max(...nums) - Math.min(...nums)) * 1000) / 1000).toFixed(3));
  });
  it('REGRESSION: average of integers is not rounded to an integer (it showed "47" for 47.4)', () => {
    const r = randomNumber.calculate({ min: '1', max: '2', count: '3', decimals: '0', unique: 'no' });
    const nums = getValue(r, 'numberList').split(', ').map(Number);
    const avg = nums.reduce((a, b) => a + b, 0) / 3;
    // The average prints to 2 decimals with trailing zeros trimmed ("2", "1.5", "1.67"); it used to be
    // compared with avg.toFixed(2) ("2.00"), which failed whenever the random draw averaged to a whole number.
    expect(getValue(r, 'average')).toBe(String(parseFloat(avg.toFixed(2))));
  });
  it('unique=yes returns distinct values; impossible requests explain themselves instead of returning fewer numbers', () => {
    const ok = randomNumber.calculate({ min: '1', max: '49', count: '6', decimals: '0', unique: 'yes' });
    const nums = getValue(ok, 'numberList').split(', ');
    expect(new Set(nums).size).toBe(6);
    const bad = randomNumber.calculate({ min: '1', max: '5', count: '10', decimals: '0', unique: 'yes' });
    expect(bad).toHaveLength(1);
    expect(bad[0].id).toBe('warning');
    expect(bad[0].value).toContain('Only 5 distinct values');
    const oneDec = randomNumber.calculate({ min: '0', max: '1', count: '12', decimals: '1', unique: 'yes' });
    expect(oneDec[0].value).toContain('Only 11 distinct values');
  });
  it('negative ranges and decimals format with fixed decimals', () => {
    const r = randomNumber.calculate({ min: '-5', max: '-4.5', count: '5', decimals: '2', unique: 'no' });
    for (const s of getValue(r, 'numberList').split(', ')) {
      expect(s).toMatch(/^-\d\.\d{2}$/);
      expect(Number(s)).toBeGreaterThanOrEqual(-5);
      expect(Number(s)).toBeLessThanOrEqual(-4.5);
    }
  });
  it('count is capped at 1000; invalid input returns []', () => {
    const r = randomNumber.calculate({ min: '1', max: '100', count: '5000', decimals: '0', unique: 'no' });
    expect(getValue(r, 'numberList').split(', ')).toHaveLength(1000);
    expect(randomNumber.calculate({ min: '5', max: '1', count: '3', decimals: '0', unique: 'no' })).toEqual([]);
    expect(randomNumber.calculate({ min: '1x', max: '9', count: '3', decimals: '0', unique: 'no' })).toEqual([]);
    expect(randomNumber.calculate({ min: '1', max: '9', count: '2.5', decimals: '0', unique: 'no' })).toEqual([]);
    expect(randomNumber.calculate({ min: '1', max: '9', count: '3', decimals: '9', unique: 'no' })).toEqual([]);
    expect(randomNumber.calculate({ min: '0.2', max: '0.8', count: '3', decimals: '0', unique: 'no' })).toEqual([]);
  });
  it('single-value range always returns that value', () => {
    const r = randomNumber.calculate({ min: '7', max: '7', count: '4', decimals: '0', unique: 'no' });
    expect(getValue(r, 'numberList')).toBe('7, 7, 7, 7');
  });
});
