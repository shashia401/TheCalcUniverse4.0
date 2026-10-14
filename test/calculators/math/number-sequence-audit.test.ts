// Oracle: python fractions.Fraction (exact), hand-derived formulas.
import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/number-sequence/index';
import { linearForm, parseSequence } from '../../../src/calculators/math/number-sequence/sequenceMath';
import { getValue } from '../../helpers';

const run = (sequence: string, nextCount = '3') => config.calculate({ sequence, nextCount });
const frac = (n: number, d = 1) => ({ n: BigInt(n), d: BigInt(d) });

describe('number sequence audit', () => {
  it('2,4,6,8,10 -> a(n) = 2n (the old builder printed "2n+")', () => {
    const r = run('2, 4, 6, 8, 10');
    expect(getValue(r, 'nthTerm')).toBe('a(n) = 2 + 2(n − 1) = 2n');
    expect(getValue(r, 'nextTerms')).toBe('12, 14, 16');
  });
  it('linear forms (a1 + d(n-1) = dn + (a1-d))', () => {
    expect(linearForm(frac(1), frac(-1))).toBe('n - 1'); // 0,1,2,... was "n+-1"
    expect(linearForm(frac(-3), frac(13))).toBe('-3n + 13'); // 10,7,4
    expect(linearForm(frac(1), frac(0))).toBe('n');
    expect(linearForm(frac(0), frac(5))).toBe('5');
    expect(linearForm(frac(-1), frac(0))).toBe('-n');
    expect(linearForm(frac(1, 2), frac(-1, 2))).toBe('0.5n - 0.5');
  });
  it('0.1 rational steps are exact: 1, 0.1, 0.01 is geometric with r = 0.1 (float 0.01/0.1 = 0.09999999999999999)', () => {
    const r = run('1, 0.1, 0.01', '3');
    expect(getValue(r, 'sequenceType')).toBe('Geometric');
    expect(getValue(r, 'commonRatio')).toBe('0.1');
    expect(getValue(r, 'nextTerms')).toBe('0.001, 0.0001, 0.00001');
  });
  it('arithmetic with decimals has no float drift: 0.1, 0.2, 0.3 -> next 0.4, 0.5', () => {
    const r = run('0.1, 0.2, 0.3', '2');
    expect(getValue(r, 'sequenceType')).toBe('Arithmetic');
    expect(getValue(r, 'nextTerms')).toBe('0.4, 0.5');
  });
  it('geometric 3 -> ratio 1/3 shown as a fraction, exact next terms', () => {
    const r = run('27, 9, 3', '3');
    expect(getValue(r, 'commonRatio')).toBe('1/3');
    expect(getValue(r, 'nextTerms')).toBe('1, 1/3, 1/9');
  });
  it('geometric growth stays exact past 2^53 (3 * 10^k)', () => {
    const r = run('3, 30, 300', '20');
    expect(getValue(r, 'nextTerms').split(', ')[19]).toBe('3' + '0'.repeat(22));
  });
  it('all-zero sequence is arithmetic (d = 0), not "Fibonacci"', () => {
    expect(getValue(run('0, 0, 0, 0'), 'sequenceType')).toBe('Arithmetic');
  });
  it('Fibonacci needs 4 confirming terms; next terms exact', () => {
    expect(getValue(run('1, 1, 2, 3, 5, 8, 13', '3'), 'nextTerms')).toBe('21, 34, 55');
    expect(getValue(run('1, 1, 2'), 'sequenceType')).toBe('Unknown');
  });
  it('negative ratio and negative difference', () => {
    const g = run('2, -4, 8', '2');
    expect(getValue(g, 'sequenceType')).toBe('Geometric');
    expect(getValue(g, 'nextTerms')).toBe('-16, 32');
    expect(getValue(g, 'nthTerm')).toBe('a(n) = 2 × (-2)^(n − 1)');
    expect(getValue(run('10, 7, 4'), 'nthTerm')).toBe('a(n) = 10 − 3(n − 1) = -3n + 13');
  });
  it('invalid tokens are reported instead of dropped; 2 terms are Unknown; 1 is empty', () => {
    expect(run('1, 2, x, 4')[0].id).toBe('error');
    expect(parseSequence('1, 2', '3').kind).toBe('ok');
    expect(getValue(run('1, 2'), 'sequenceType')).toBe('Unknown');
    expect(run('5')).toEqual([]);
    expect(run(Array(101).fill('1').join(','))[0].id).toBe('error');
  });
  it('nextCount is clamped to 1..20, blank means 5', () => {
    expect(getValue(run('1, 2, 3', '99'), 'nextTerms').split(', ')).toHaveLength(20);
    expect(getValue(run('1, 2, 3', '0'), 'nextTerms').split(', ')).toHaveLength(1);
    expect(getValue(run('1, 2, 3', ''), 'nextTerms').split(', ')).toHaveLength(5);
  });
});
