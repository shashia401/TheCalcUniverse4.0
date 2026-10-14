// Oracle: python fractions.Fraction exact sums and math.factorial.
import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/series/index';
import { compensatedSum, fmtTermValue, runSeries, SERIES_MAX_TERMS } from '../../../src/calculators/math/series/seriesMath';
import { getValue } from '../../helpers';

const run = (start: string, end: string, expression: string) => config.calculate({ start, end, expression });

describe('series audit', () => {
  it('worked examples: sum of 1..10 = 55, H_100 = 5.1873775176', () => {
    const a = run('1', '10', 'n');
    expect(getValue(a, 'sum')).toBe('55');
    expect(getValue(a, 'terms')).toBe('1, 2, 3, 4, 5, 6, 7, 8, 9, 10');
    expect(getValue(a, 'termCount')).toBe('10');
    expect(getValue(a, 'lastTerm')).toBe('10');
    const h = run('1', '100', '1/n');
    expect(getValue(h, 'sum')).toBe('5.1873775176');
    expect(getValue(h, 'terms')).toBe('1, 0.5, 0.3333333333, 0.25, 0.2, 0.1666666667, 0.1428571429, 0.125, 0.1111111111, 0.1, 0.0909090909, 0.0833333333, 0.0769230769, 0.0714285714, 0.0666666667, 0.0625, 0.0588235294, 0.0555555556, 0.0526315789, 0.05');
    expect(getValue(h, 'lastTerm')).toBe('0.01');
  });
  it('compensated summation: ten 0.1s add to exactly 1 (naive addition gives 0.9999999999999999)', () => {
    expect(Array(10).fill(0.1).reduce((a: number, b: number) => a + b, 0)).not.toBe(1);
    expect(compensatedSum(Array(10).fill(0.1))).toBe(1);
    expect(getValue(run('1', '10', '0.1'), 'sum')).toBe('1');
  });
  it('Leibniz series from n = 0 approaches pi/4 (python: 0.7853731633975108 after 10000 terms)', () => {
    const r = runSeries('0', '9999', '(-1)^n/(2*n+1)');
    expect(r.kind === 'ok' && Math.abs(r.run.sum - 0.7853731633975108)).toBeLessThan(1e-15);
  });
  it('small terms are not rounded to 0: 1/2^40 = 9.094947018e-13 (was "0")', () => {
    expect(getValue(run('40', '40', '1/2^n'), 'sum')).toBe('9.094947018e-13');
    expect(fmtTermValue(1e-4)).toBe('0.0001');
  });
  it('huge terms print in exponent form, not as fake-exact integers: sum n! for n=1..20 = 2561327494111820313', () => {
    expect(getValue(run('1', '20', 'n!'), 'sum')).toBe('2.561327494e+18');
    expect(getValue(run('1', '5', 'n!'), 'sum')).toBe('153'); // 1+2+6+24+120
  });
  it('sum of squares to 100 = 338350 (python)', () => {
    expect(getValue(run('1', '100', 'n^2'), 'sum')).toBe('338350');
  });
  it('undefined terms are reported with their n instead of being skipped or discarding the result', () => {
    const r = run('1', '10', '1/(n-5)');
    expect(r[0].id).toBe('error');
    expect(r[0].value).toContain('n = 5');
    expect(run('1', '3', 'x + 1')[0].value).toContain('Unknown identifier');
    expect(run('1', '3', '2n')[0].value).toContain('Use * for multiplication');
  });
  it('overflow is reported: sum of 10^n for n = 300..310', () => {
    expect(run('300', '310', '10^n')[0].id).toBe('error');
  });
  it('range handling: start > end, decimals, cap', () => {
    expect(run('5', '1', 'n')[0].id).toBe('error');
    expect(run('1.5', '5', 'n')).toEqual([]);
    const big = run('1', '1000000', '1');
    expect(getValue(big, 'sum')).toBe(String(SERIES_MAX_TERMS));
    expect(getValue(big, 'termCount')).toBe(String(SERIES_MAX_TERMS));
    expect(big.find((x) => x.id === 'note')!.value).toContain('up to 1000000');
    expect(run('1', '5', 'n').find((x) => x.id === 'note')).toBeUndefined();
  });
  it('negative start index works (n = -2..2 of n^2 = 10)', () => {
    expect(getValue(run('-2', '2', 'n^2'), 'sum')).toBe('10');
  });
  it('10,000 terms evaluate quickly', () => {
    const t = Date.now();
    run('1', '10000', 'sin(n)/n');
    expect(Date.now() - t).toBeLessThan(1500);
  });
});
