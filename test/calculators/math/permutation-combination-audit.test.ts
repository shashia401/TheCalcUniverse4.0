// Oracle: python math.comb / math.perm / math.factorial (exact big integers).
import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/permutation-combination/index';
import { combBig, permBig, computePermComb, countsForChart } from '../../../src/calculators/math/permutation-combination/permCombMath';
import { getValue } from '../../helpers';

const run = (n: string, r: string, orderMatters: string, repetition?: string) => config.calculate({ n, r, orderMatters, ...(repetition ? { repetition } : {}) });

describe('permutation / combination audit', () => {
  it('52C5 = 2,598,960 and 49C6 = 13,983,816', () => {
    expect(getValue(run('52', '5', 'combination'), 'result')).toBe('2,598,960');
    expect(getValue(run('49', '6', 'combination'), 'result')).toBe('13,983,816');
  });
  it('exact for big results: 60C30 = 118264581564861424, 20P20 = 20!', () => {
    expect(combBig(60, 30)).toBe(118264581564861424n);
    expect(permBig(20, 20)).toBe(2432902008176640000n);
    expect(getValue(run('20', '20', 'permutation'), 'result')).toBe('2,432,902,008,176,640,000');
  });
  it('n above the old 170 limit works: 1000C500 has 300 digits, shown in scientific notation with exact line', () => {
    const r = run('1000', '500', 'combination');
    expect(getValue(r, 'result')).toBe('2.702882e+299');
    const exact = getValue(r, 'exact');
    expect(exact).toHaveLength(300);
    expect(exact.startsWith('270288240945436569515614693625975275496152')).toBe(true);
    expect(exact.endsWith('5904631820')).toBe(false); // sanity: not a truncated string
  });
  it('symmetry and edges: nC0 = nCn = 1, nPn = n!, 0C0 = 1', () => {
    expect(combBig(10, 0)).toBe(1n);
    expect(combBig(10, 10)).toBe(1n);
    expect(combBig(10, 3)).toBe(combBig(10, 7));
    expect(getValue(run('0', '0', 'combination'), 'result')).toBe('1');
    expect(getValue(run('5', '5', 'permutation'), 'result')).toBe('120');
  });
  it('r > n gives 0 (no repetition) instead of nothing', () => {
    expect(getValue(run('3', '5', 'combination'), 'result')).toBe('0');
    expect(getValue(run('3', '5', 'combination'), 'formulaApplied')).toContain('0 ways');
  });
  it('with repetition: permutations n^r, combinations C(n+r-1, r)', () => {
    expect(getValue(run('10', '4', 'permutation', 'yes'), 'result')).toBe('10,000'); // 10^4
    expect(getValue(run('5', '3', 'combination', 'yes'), 'result')).toBe('35'); // C(7,3)
    expect(getValue(run('3', '5', 'combination', 'yes'), 'result')).toBe('21'); // C(7,5)
    expect(getValue(run('0', '3', 'combination', 'yes'), 'result')).toBe('0');
    expect(getValue(run('0', '0', 'permutation', 'yes'), 'result')).toBe('1');
  });
  it('factorial breakdown rows', () => {
    const r = run('5', '3', 'permutation');
    expect(getValue(r, 'nFactorial')).toBe('120');
    expect(getValue(r, 'rFactorial')).toBe('6');
    expect(getValue(r, 'nMinusRFactorial')).toBe('2');
    expect(getValue(r, 'formulaApplied')).toBe('5! / 2! = 120 / 2 = 60');
  });
  it('rejects decimals and values above 1000, ignores blanks', () => {
    expect(run('5.5', '2', 'combination')[0].id).toBe('error');
    expect(run('1001', '2', 'combination')[0].id).toBe('error');
    expect(run('', '2', 'combination')).toEqual([]);
    expect(computePermComb('-1', '2', 'combination').kind).toBe('incomplete');
  });
  it('chart counts for n = 4 (python: [comb(4,i) ...] = 1,4,6,4,1)', () => {
    expect(countsForChart(4, false, false)).toEqual([1, 4, 6, 4, 1]);
    expect(countsForChart(3, true, false)).toEqual([1, 3, 6, 6]);
    expect(countsForChart(2, true, true)).toEqual([1, 2, 4]);
  });
});
