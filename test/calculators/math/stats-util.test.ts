import { describe, it, expect } from 'vitest';
import { parseDataset, summarize, fmtDec, pearson, spearman, averageRanks, D } from '../../../src/utils/stats';
import { tTwoTail } from '../../../src/utils/distributions';

// Reference values: exact fractions.Fraction arithmetic + numpy/scipy (see Python oracle used for this audit).
const ds = (s: string) => parseDataset(s).values;
const num = (d: { toNumber(): number } | null) => (d ? d.toNumber() : NaN);

describe('parseDataset', () => {
  it('splits on commas, spaces, semicolons and newlines', () => {
    expect(ds('1, 2;3\n4 5,6').map(num)).toEqual([1, 2, 3, 4, 5, 6]);
  });
  it('strips $ and % and reads grouped thousands as one number', () => {
    expect(ds('$1,234.56 85% 1,204,').map(num)).toEqual([1234.56, 85, 1204]);
    expect(ds('85,92,78').map(num)).toEqual([85, 92, 78]);
  });
  it('rejects hex, Infinity, NaN and trailing junk instead of accepting them (parseFloat/Decimal would)', () => {
    const p = parseDataset('0x10 Infinity NaN 12abc 7 1e3 -.5');
    expect(p.values.map(num)).toEqual([7, 1000, -0.5]);
    expect(p.ignored).toEqual(['0x10', 'Infinity', 'NaN', '12abc']);
  });
  it('empty / whitespace input gives no values', () => {
    expect(parseDataset('').values).toHaveLength(0);
    expect(parseDataset(undefined).values).toHaveLength(0);
    expect(parseDataset(' , ; ').ignored).toHaveLength(0);
  });
});

describe('summarize vs exact fractions / numpy', () => {
  it('A: 85,92,78,95,88', () => {
    const s = summarize(ds('85 92 78 95 88'));
    expect(fmtDec(s.mean)).toBe('87.6');
    expect(fmtDec(s.sum)).toBe('438');
    expect(fmtDec(s.median)).toBe('88');
    expect(fmtDec(s.varianceSample!)).toBe('43.3');
    expect(fmtDec(s.variancePop)).toBe('34.64');
    expect(num(s.sdSample)).toBeCloseTo(6.58027355054484, 12);
    expect(num(s.sdPop)).toBeCloseTo(5.885575587824865, 12);
    expect(s.modes).toHaveLength(0);
    expect(fmtDec(s.range)).toBe('17');
  });
  it('quartile conventions on A (halves = 81.5/93.5, inclusive = 85/92, exclusive = 81.5/93.5)', () => {
    const v = ds('85 92 78 95 88');
    expect([num(summarize(v, 'halves').q1), num(summarize(v, 'halves').q3)]).toEqual([81.5, 93.5]);
    expect([num(summarize(v, 'inclusive').q1), num(summarize(v, 'inclusive').q3)]).toEqual([85, 92]);
    expect([num(summarize(v, 'exclusive').q1), num(summarize(v, 'exclusive').q3)]).toEqual([81.5, 93.5]);
  });
  it('quartile conventions on D (10 values): halves 498/502, inclusive 498.25/502, exclusive 497.75/502.25', () => {
    const v = ds('498 501 503 497 502 500 499 504 496 502');
    const h = summarize(v, 'halves');
    expect([num(h.q1), num(h.median), num(h.q3), num(h.iqr)]).toEqual([498, 500.5, 502, 4]);
    expect([num(summarize(v, 'inclusive').q1), num(summarize(v, 'inclusive').q3)]).toEqual([498.25, 502]);
    expect([num(summarize(v, 'exclusive').q1), num(summarize(v, 'exclusive').q3)]).toEqual([497.75, 502.25]);
    expect(h.outliers).toHaveLength(0);
  });
  it('E: real-estate set, outlier 1.2M, halves Q1 292,500 Q3 312,500 fence 342,500', () => {
    const s = summarize(ds('285000 310000 295000 305000 1200000 290000 300000 315000'));
    expect([num(s.q1), num(s.q3), num(s.upperFence)]).toEqual([292500, 312500, 342500]);
    expect(s.outliers.map(num)).toEqual([1200000]);
    expect(fmtDec(s.mean)).toBe('412500');
    expect(num(s.sdSample)).toBeCloseTo(318355.1475946321, 6);
    expect(num(summarize(ds('285000 310000 295000 305000 1200000 290000 300000 315000'), 'inclusive').q1)).toBe(293750);
    expect(num(summarize(ds('285000 310000 295000 305000 1200000 290000 300000 315000'), 'exclusive').q3)).toBe(313750);
  });
  it('F: bean plants, lower fence 9.95 flags 3.2; exclusive Q3 is exactly 14.3', () => {
    const v = ds('12.5, 14.2, 11.8, 13.9, 3.2, 15.1, 13.4, 12.9, 14.6, 13.1');
    const s = summarize(v);
    expect([fmtDec(s.q1), fmtDec(s.q3), fmtDec(s.iqr), fmtDec(s.lowerFence)]).toEqual(['12.5', '14.2', '1.7', '9.95']);
    expect(s.outliers.map(num)).toEqual([3.2]);
    expect(fmtDec(s.mean)).toBe('12.47');
    expect(fmtDec(summarize(v, 'exclusive').q3)).toBe('14.3');
    expect(fmtDec(summarize(v, 'inclusive').q1)).toBe('12.6');
  });
  it('large offset data: variance is exactly 30 (naive sum-of-squares loses it in float64)', () => {
    const s = summarize(ds('1000000004 1000000007 1000000013 1000000016'));
    expect(fmtDec(s.varianceSample!)).toBe('30');
    expect(fmtDec(s.variancePop)).toBe('22.5');
    expect(fmtDec(s.mean)).toBe('1000000010');
    const naive = [4, 7, 13, 16].map((x) => 1e9 + x);
    const m = naive.reduce((a, b) => a + b) / 4;
    const bad = (naive.reduce((a, b) => a + b * b, 0) - 4 * m * m) / 3;
    expect(bad).not.toBe(30);
  });
  it('decimal sums are exact (0.1+0.2 = 0.3) and 2^53+1 survives', () => {
    expect(fmtDec(summarize(ds('0.1 0.2')).sum)).toBe('0.3');
    expect(summarize(ds('9007199254740992 1')).sum.toFixed()).toBe('9007199254740993');
  });
  it('mode: all values with max frequency; none when every value is unique', () => {
    expect(summarize(ds('2 2 3 3 5')).modes.map(num)).toEqual([2, 3]);
    expect(summarize(ds('1 2 2 3')).modes.map(num)).toEqual([2]);
    expect(summarize(ds('1 2 3')).modes).toHaveLength(0);
    expect(summarize(ds('1 1.0 1.00')).modes.map(num)).toEqual([1]);
  });
  it('degenerate: n=1, constant data, negative values', () => {
    const one = summarize(ds('7'));
    expect(one.sdSample).toBeNull();
    expect(num(one.sdPop)).toBe(0);
    expect(fmtDec(one.q1)).toBe('7');
    const c = summarize(ds('5 5 5 5'));
    expect(num(c.sdSample)).toBe(0);
    expect(c.outliers).toHaveLength(0);
    const neg = summarize(ds('-3 -1 -2'));
    expect(fmtDec(neg.mean)).toBe('-2');
    expect(fmtDec(neg.median)).toBe('-2');
    expect(() => summarize([])).toThrow();
  });
  it('fmtDec trims, switches to exponent only at extremes', () => {
    expect(fmtDec(new D('87.60'))).toBe('87.6');
    expect(fmtDec(new D(1).div(3))).toBe('0.3333333333');
    expect(fmtDec(new D('1e25'))).toBe('1e+25');
    expect(fmtDec(new D('0'))).toBe('0');
  });
});

describe('correlation vs scipy', () => {
  it('Pearson r = 0.7745966692414834, Spearman (ties) = 0.7378647873726218, p = 0.12402706265755474 (n=5)', () => {
    const x = ds('1 2 3 4 5');
    const y = ds('2 4 5 4 5');
    const c = pearson(x, y);
    expect(num(c.r)).toBeCloseTo(0.7745966692414834, 14);
    expect(num(spearman(x, y))).toBeCloseTo(0.7378647873726218, 14);
    const r = num(c.r);
    const t = (r * Math.sqrt(3)) / Math.sqrt(1 - r * r);
    expect(tTwoTail(t, 3)).toBeCloseTo(0.12402706265755474, 12);
  });
  it('tied data: Pearson 0.8971694576178272, Spearman 0.8715757936489196, slope 0.1874125874125874', () => {
    const x = ds('10 20 20 30 40 50 50 50');
    const y = ds('5 3 4 8 7 12 10 11');
    const c = pearson(x, y);
    expect(num(c.r)).toBeCloseTo(0.8971694576178272, 14);
    expect(num(spearman(x, y))).toBeCloseTo(0.8715757936489196, 14);
    expect(num(c.sxy.div(c.sxx))).toBeCloseTo(0.1874125874125874, 14);
  });
  it('average ranks share tied positions', () => {
    expect(averageRanks(ds('10 20 20 30')).map(num)).toEqual([1, 2.5, 2.5, 4]);
  });
  it('constant variable gives undefined r (null), not 0 or NaN', () => {
    expect(pearson(ds('1 2 3'), ds('4 4 4')).r).toBeNull();
    expect(spearman(ds('1 2 3'), ds('4 4 4'))).toBeNull();
  });
  it('perfect lines give exactly +/-1', () => {
    expect(num(pearson(ds('1 2 3 4'), ds('2 4 6 8')).r)).toBe(1);
    expect(num(pearson(ds('1 2 3 4'), ds('8 6 4 2')).r)).toBe(-1);
  });
});
