// Independent oracle: Python math.gcd / math.lcm (exact integers).
import { describe, it, expect } from 'vitest';
import gcf from '../../../src/calculators/math/gcf/index';
import lcm from '../../../src/calculators/math/lcm/index';
import { analyzeGcf } from '../../../src/calculators/math/gcf/gcfMath';
import { analyzeLcm, parseLcmInput, multiplesOf } from '../../../src/calculators/math/lcm/lcmMath';
import { getValue } from '../../helpers';

describe('gcf audit', () => {
  it('exact Euclid on values above 2^52 (quotient via BigInt)', () => {
    // python: gcd(9007199254740991, 6004799503160661) = 1 ; 9007199254740991 // 6004799503160661 = 1, remainder 3002399751580330
    const r = gcf.calculate({ a: '9007199254740991', b: '6004799503160661' });
    expect(getValue(r, 'gcf')).toBe('1');
    expect(getValue(r, 'euclidSteps')).toContain('9007199254740991 = 6004799503160661 × 1 + 3002399751580330');
  });
  it('larger number is always first in the Euclid steps', () => {
    expect(analyzeGcf(24, 36).euclidSteps).toEqual(['36 = 24 × 1 + 12', '24 = 12 × 2 + 0', 'GCF(24, 36) = 12']);
  });
  it('Venn leftovers are a/gcf and b/gcf (24 = 2^3·3, 36 = 2^2·3^2 -> 2 | 3)', () => {
    const a = analyzeGcf(24, 36);
    expect(a.shared).toEqual([[2, 2], [3, 1]]);
    expect(a.leftoverA).toEqual([[2, 1]]);
    expect(a.leftoverB).toEqual([[3, 1]]);
  });
  it('rejects decimals and values above 2^53-1 with a message, zero/negative stay incomplete', () => {
    expect(gcf.calculate({ a: '24.9', b: '36' })[0].id).toBe('error');
    expect(gcf.calculate({ a: '9007199254740993', b: '2' })[0].id).toBe('error');
    expect(gcf.calculate({ a: '0', b: '2' })).toEqual([]);
    expect(gcf.calculate({ a: '-4', b: '2' })).toEqual([]);
  });
  it('coprime shows a co-prime note', () => {
    expect(getValue(gcf.calculate({ a: '14', b: '15' }), 'sharedFactors')).toMatch(/co-prime/);
  });
});

describe('lcm audit', () => {
  it('exact beyond 2^53 and beyond the old 1e15 cap', () => {
    // python: lcm(12345678901234567890, 98765432109876543210) = 1354807012498094801236261410
    expect(getValue(lcm.calculate({ numbers: '12345678901234567890, 98765432109876543210' }), 'result')).toBe('1354807012498094801236261410');
  });
  it('lcm(1..30) = 2329089562800 (python)', () => {
    const nums = Array.from({ length: 30 }, (_, i) => i + 1).join(' ');
    expect(getValue(lcm.calculate({ numbers: nums }), 'result')).toBe('2329089562800');
  });
  it('88, 225, 365 -> 1445400 (worked example); GCD of all 12,18,24 is 6 (python)', () => {
    expect(getValue(lcm.calculate({ numbers: '88, 225, 365' }), 'result')).toBe('1445400');
    const r = lcm.calculate({ numbers: '12, 18, 24' });
    expect(getValue(r, 'result')).toBe('72');
    expect(getValue(r, 'gcdValue')).toBe('6');
    expect(getValue(r, 'lcmSteps')).toBe('LCM(12, 18) = (12 × 18) / 6 = 36 | LCM(36, 24) = (36 × 24) / 12 = 72');
  });
  it('2^100+1 and 2^100-1 are coprime so lcm is the product (python)', () => {
    const n = lcm.calculate({ numbers: `${(2n ** 100n + 1n)}, ${(2n ** 100n - 1n)}` });
    expect(getValue(n, 'result')).toBe('1606938044258990275541962092341162602522202993782792835301375');
  });
  it('input validation', () => {
    expect(parseLcmInput('5')).toEqual({ kind: 'incomplete' });
    expect(parseLcmInput('1 2 x').kind).toBe('invalid');
    expect(parseLcmInput(Array(31).fill('2').join(',')).kind).toBe('invalid');
    expect(parseLcmInput('1' + '0'.repeat(100) + ', 2').kind).toBe('invalid');
  });
  it('factorisation view takes max exponents; huge numbers are not factored', () => {
    const a = analyzeLcm([45n, 60n]);
    expect(a.lcmFactors).toEqual([[2, 2], [3, 2], [5, 1]]); // 180
    expect(analyzeLcm([10n ** 30n, 7n]).lcmFactors).toBeNull();
  });
  it('multiplesOf is null past 2^53', () => {
    expect(multiplesOf(3n, 4)).toEqual([3, 6, 9, 12]);
    expect(multiplesOf(10n ** 16n, 2)).toBeNull();
  });
});
