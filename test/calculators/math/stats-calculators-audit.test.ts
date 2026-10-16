import { describe, it, expect } from 'vitest';
import average from '../../../src/calculators/math/average/index';
import meanMedianMode from '../../../src/calculators/math/mean-median-mode/index';
import standardDeviation from '../../../src/calculators/math/standard-deviation/index';
import statistics from '../../../src/calculators/math/statistics/index';
import descriptive from '../../../src/calculators/math/descriptive-stats/index';
import { getValue } from '../../helpers';

// Reference values: exact fractions.Fraction arithmetic + statistics/numpy (Python), see the audit notes.

describe('one shared engine: the five stats calculators agree on identical data', () => {
  const DATA = '85, 92, 78, 95, 88';
  it('mean 87.6, median 88 everywhere', () => {
    expect(getValue(average.calculate({ data: DATA }), 'mean')).toBe('87.6');
    expect(getValue(meanMedianMode.calculate({ data: DATA }), 'mean')).toBe('87.6');
    expect(getValue(standardDeviation.calculate({ dataSet: DATA, population: 'sample' }), 'mean')).toBe('87.6');
    expect(getValue(statistics.calculate({ data: DATA, type: 'sample' }), 'mean')).toBe('87.6');
    expect(getValue(descriptive.calculate({ data: DATA }), 'mean')).toBe('87.6');
    expect(getValue(average.calculate({ data: DATA }), 'median')).toBe('88');
    expect(getValue(meanMedianMode.calculate({ data: DATA }), 'median')).toBe('88');
    expect(getValue(standardDeviation.calculate({ dataSet: DATA, population: 'sample' }), 'median')).toBe('88');
    expect(getValue(statistics.calculate({ data: DATA, type: 'sample' }), 'q2')).toBe('88');
    expect(getValue(descriptive.calculate({ data: DATA }), 'median')).toBe('88');
  });
  it('sample SD 6.58027355 (statistics.stdev) and population SD 5.88557559 (statistics.pstdev)', () => {
    expect(getValue(standardDeviation.calculate({ dataSet: DATA, population: 'sample' }), 'stdDev')).toBe('6.580273551');
    expect(getValue(statistics.calculate({ data: DATA, type: 'sample' }), 'stddev')).toBe('6.5802736'); // 8 sig digits
    expect(getValue(standardDeviation.calculate({ dataSet: DATA, population: 'population' }), 'stdDev')).toBe('5.885575588');
    expect(getValue(descriptive.calculate({ data: DATA, type: 'population' }), 'variance')).toBe('34.64 / 5.885575588');
    expect(getValue(descriptive.calculate({ data: DATA }), 'variance')).toBe('43.3 / 6.580273551');
  });
});

describe('average (worked examples + fixes)', () => {
  it('Hannah: mean 1297.142857, median 1150, sum 9080, range 1520', () => {
    const r = average.calculate({ data: '1240, 980, 1150, 1320, 1090, 2410, 890' });
    expect(getValue(r, 'mean')).toBe('1297.142857');
    expect(getValue(r, 'median')).toBe('1150');
    expect(getValue(r, 'sum')).toBe('9080');
    expect(getValue(r, 'range')).toBe('1520');
  });
  it('Rajesh: mean 509.2, median 342, sum 2546, range 906', () => {
    const r = average.calculate({ data: '342, 298, 315, 387, 1204' });
    expect(getValue(r, 'mean')).toBe('509.2');
    expect(getValue(r, 'median')).toBe('342');
    expect(getValue(r, 'sum')).toBe('2546');
    expect(getValue(r, 'range')).toBe('906');
  });
  it('REGRESSION: 0.1 + 0.2 sums to 0.3 (was 0.30000000000000004) and the 4-decimal padding is gone', () => {
    const r = average.calculate({ data: '0.1, 0.2' });
    expect(getValue(r, 'sum')).toBe('0.3');
    expect(getValue(r, 'mean')).toBe('0.15');
  });
  it('REGRESSION: integers beyond 2^53 keep their exact sum', () => {
    expect(getValue(average.calculate({ data: '9007199254740992 1' }), 'sum')).toBe('9007199254740993');
  });
  it('REGRESSION: "12abc" and "0x10" are reported as ignored instead of parsed as 12 / 16', () => {
    const r = average.calculate({ data: '12abc 0x10 4 6' });
    expect(getValue(r, 'count')).toBe('2');
    expect(getValue(r, 'mean')).toBe('5');
    expect(getValue(r, 'ignored')).toBe('12abc, 0x10');
  });
  it('single value works; $/% and thousands separators are stripped', () => {
    expect(getValue(average.calculate({ data: '7' }), 'mean')).toBe('7');
    const r = average.calculate({ data: '$1,204 85% 100' });
    expect(getValue(r, 'sum')).toBe('1389');
  });
  it('scientific notation is accepted (limitation text said otherwise)', () => {
    expect(getValue(average.calculate({ data: '1e3 3e3' }), 'mean')).toBe('2000');
  });
  it('panel data carries full-precision numbers in input order', () => {
    const d = JSON.parse(getValue(average.calculate({ data: '3 1 2' }), '_data'));
    expect(d).toEqual({ values: [3, 1, 2], mean: 2, median: 2 });
  });
});

describe('mean-median-mode', () => {
  it('Elena: mean 466.857142857, median 367, no mode, range 807', () => {
    const r = meanMedianMode.calculate({ data: '342, 298, 415, 389, 352, 1105, 367' });
    expect(getValue(r, 'mean')).toBe('466.8571429');
    expect(getValue(r, 'median')).toBe('367');
    expect(getValue(r, 'mode')).toBe('No mode (all values unique)');
    expect(getValue(r, 'range')).toBe('807');
  });
  it('Thompson: mean 81.7, median 85, mode 85, range 31', () => {
    const r = meanMedianMode.calculate({ data: '72, 85, 91, 78, 85, 63, 85, 94, 88, 76' });
    expect(getValue(r, 'mean')).toBe('81.7');
    expect(getValue(r, 'median')).toBe('85');
    expect(getValue(r, 'mode')).toBe('85');
    expect(getValue(r, 'range')).toBe('31');
    expect(getValue(r, 'medianDetail')).toBe('(85 + 85) / 2 = 85');
  });
  it('Raj: mean 9.583333333, median 6.5, no mode, range 42', () => {
    const r = meanMedianMode.calculate({ data: '15, 2, 8, 42, 7, 3, 12, 5, 0, 6, 4, 11' });
    expect(getValue(r, 'mean')).toBe('9.583333333');
    expect(getValue(r, 'median')).toBe('6.5');
    expect(getValue(r, 'sortedData')).toBe('0, 2, 3, 4, 5, 6, 7, 8, 11, 12, 15, 42');
    expect(getValue(r, 'range')).toBe('42');
  });
  it('multimodal data lists every mode, sorted', () => {
    expect(getValue(meanMedianMode.calculate({ data: '5 3 3 5 9' }), 'mode')).toBe('3, 5');
  });
  it('odd count has no medianDetail row; fewer than 2 values gives []', () => {
    expect(meanMedianMode.calculate({ data: '1 2 3' }).find((x) => x.id === 'medianDetail')).toBeUndefined();
    expect(meanMedianMode.calculate({ data: '1' })).toEqual([]);
  });
});

describe('standard-deviation (worked examples recomputed with statistics.stdev)', () => {
  const sd = (data: string, population = 'sample') => standardDeviation.calculate({ dataSet: data, population });
  it('tablets: s = 2.669269563, variance 7.125, median 500.5, CV 0.53%', () => {
    const r = sd('498, 502, 499, 505, 497, 503, 501, 500');
    expect(getValue(r, 'stdDev')).toBe('2.669269563');
    expect(getValue(r, 'variance')).toBe('7.125');
    expect(getValue(r, 'mean')).toBe('500.625');
    expect(getValue(r, 'median')).toBe('500.5');
    expect(getValue(r, 'cv')).toBe('0.53%');
  });
  it('math scores (text used to say 6.760 / 45.714 / median 81 / CV 8.15%): s = 6.948792290, variance 48.28571429, median 84.5, CV 8.37%', () => {
    const r = sd('72, 85, 91, 78, 88, 76, 84, 90');
    expect(getValue(r, 'stdDev')).toBe('6.94879229');
    expect(getValue(r, 'variance')).toBe('48.28571429');
    expect(getValue(r, 'median')).toBe('84.5');
    expect(getValue(r, 'cv')).toBe('8.37%');
  });
  it('english scores: s = 1.669045921, CV 2.05%', () => {
    const r = sd('80, 82, 81, 84, 79, 83, 81, 80');
    expect(getValue(r, 'stdDev')).toBe('1.669045921');
    expect(getValue(r, 'cv')).toBe('2.05%');
  });
  it('Fund A (text used to say 7.190 / 51.7 / 92.18%): s = 6.833739825, variance 46.7, CV 87.61%', () => {
    const r = sd('8, 12, -3, 15, 7');
    expect(getValue(r, 'stdDev')).toBe('6.833739825');
    expect(getValue(r, 'variance')).toBe('46.7');
    expect(getValue(r, 'cv')).toBe('87.61%');
    expect(getValue(r, 'range')).toBe('-3 to 15 (span: 18)');
  });
  it('Fund B: s = 1.140175425, CV 12.13%', () => {
    const r = sd('9, 10, 8, 9, 11');
    expect(getValue(r, 'stdDev')).toBe('1.140175425');
    expect(getValue(r, 'cv')).toBe('12.13%');
  });
  it('population vs sample divisor: [1e9+4, 1e9+7, 1e9+13, 1e9+16] gives exactly 30 and 22.5 (naive float formula cannot)', () => {
    const data = '1000000004 1000000007 1000000013 1000000016';
    expect(getValue(sd(data), 'variance')).toBe('30');
    expect(getValue(sd(data, 'population'), 'variance')).toBe('22.5');
    expect(getValue(sd(data), 'mean')).toBe('1000000010');
  });
  it('constant data: SD 0, CV 0.00%; labels switch with the data type', () => {
    const r = sd('4 4 4 4', 'population');
    expect(getValue(r, 'stdDev')).toBe('0');
    expect(getValue(r, 'cv')).toBe('0.00%');
    expect(r.find((x) => x.id === 'stdDev')?.label).toBe('Standard Deviation (σ)');
    expect(sd('1 2 3').find((x) => x.id === 'stdDev')?.label).toBe('Standard Deviation (s)');
  });
  it('panel data carries exact mean / SS / variance / SD and the modes', () => {
    const d = JSON.parse(getValue(sd('2 2 3 3 5'), '_data'));
    expect(d.mean).toBe(3);
    expect(d.ss).toBe(6);
    expect(d.variance).toBe(1.5);
    expect(d.modes).toEqual([2, 3]);
    expect(d.sample).toBe(true);
  });
});

describe('statistics (quartile conventions, outliers)', () => {
  const st = (data: string, quartileMethod?: string) => statistics.calculate({ data, type: 'sample', quartileMethod: quartileMethod ?? '' });
  it('fill-weight example: Q1 498, median 500.5, Q3 502, IQR 4, fences [492, 508], no outliers', () => {
    const r = st('498, 501, 503, 497, 502, 500, 499, 504, 496, 502');
    expect([getValue(r, 'q1'), getValue(r, 'q2'), getValue(r, 'q3'), getValue(r, 'iqr')]).toEqual(['498', '500.5', '502', '4']);
    expect(getValue(r, 'fences')).toBe('[492, 508]');
    expect(getValue(r, 'outliers')).toBe('None detected');
  });
  it('real-estate example: Q1 292500, Q3 312500, IQR 20000, upper fence 342500, outlier 1200000', () => {
    const r = st('285000, 310000, 295000, 305000, 1200000, 290000, 300000, 315000');
    expect([getValue(r, 'q1'), getValue(r, 'q3'), getValue(r, 'iqr')]).toEqual(['292500', '312500', '20000']);
    expect(getValue(r, 'fences')).toBe('[262500, 342500]');
    expect(getValue(r, 'outliers')).toBe('1200000');
    expect(getValue(r, 'outlierCount')).toBe('1');
  });
  it('bean-plant example: Q1 12.5, Q3 14.2, IQR 1.7, lower fence 9.95, outlier 3.2', () => {
    const r = st('12.5, 14.2, 11.8, 13.9, 3.2, 15.1, 13.4, 12.9, 14.6, 13.1');
    expect([getValue(r, 'q1'), getValue(r, 'q3'), getValue(r, 'iqr')]).toEqual(['12.5', '14.2', '1.7']);
    expect(getValue(r, 'fences')).toBe('[9.95, 16.75]');
    expect(getValue(r, 'outliers')).toBe('3.2');
  });
  it('Quartile Method menu: inclusive = numpy linear / QUARTILE.INC, exclusive = type 6 / QUARTILE.EXC', () => {
    const D = '498, 501, 503, 497, 502, 500, 499, 504, 496, 502';
    expect([getValue(st(D, 'inclusive'), 'q1'), getValue(st(D, 'inclusive'), 'q3')]).toEqual(['498.25', '502']);
    expect([getValue(st(D, 'exclusive'), 'q1'), getValue(st(D, 'exclusive'), 'q3')]).toEqual(['497.75', '502.25']);
    const A = '85, 92, 78, 95, 88';
    expect(getValue(st(A, 'halves'), 'q1')).toBe('81.5');
    expect(getValue(st(A, 'inclusive'), 'q1')).toBe('85');
    expect(getValue(st(A, 'exclusive'), 'q3')).toBe('93.5');
    expect(getValue(st(A, 'bogus'), 'q1')).toBe('81.5'); // unknown value falls back to the default
  });
  it('sample vs population SD / variance (numpy ddof 1 vs 0)', () => {
    const D = '498, 501, 503, 497, 502, 500, 499, 504, 496, 502';
    expect(getValue(statistics.calculate({ data: D, type: 'sample' }), 'variance')).toBe('7.0666667');
    expect(getValue(statistics.calculate({ data: D, type: 'population' }), 'variance')).toBe('6.36');
    expect(getValue(statistics.calculate({ data: D, type: 'population' }), 'stddev')).toBe('2.521904');
  });
  it('box plot data is numeric with Tukey whiskers at the most extreme non-outliers', () => {
    const r = st('285000, 310000, 295000, 305000, 1200000, 290000, 300000, 315000');
    const b = JSON.parse(getValue(r, '_boxPlotData'));
    expect(b.max).toBe(1200000);
    expect(b.whiskerHi).toBe(315000);
    expect(b.whiskerLo).toBe(285000);
    expect(b.mean).toBe(412500);
    expect(b.outliers).toEqual([1200000]);
  });
  it('fewer than 3 values returns []', () => {
    expect(st('1 2')).toEqual([]);
  });
});

describe('descriptive-stats', () => {
  it('IQR and quartiles use median-of-halves; mode lists ties', () => {
    const r = descriptive.calculate({ data: '2 2 3 3 5' });
    expect(getValue(r, 'mode')).toBe('2, 3');
    expect(getValue(r, 'quartiles')).toBe('2 / 4 / 2');
  });
  it('REGRESSION: 3 / 0x / abc tokens are flagged, not parsed (parseFloat used to read "12abc" as 12)', () => {
    const r = descriptive.calculate({ data: '10 20 12abc' });
    expect(getValue(r, 'count')).toBe('2 / 30');
    expect(getValue(r, 'ignored')).toBe('12abc');
  });
  it('constant data has zero SD and does not break the skew data', () => {
    const r = descriptive.calculate({ data: '5 5 5' });
    expect(getValue(r, 'variance')).toBe('0 / 0');
    expect(JSON.parse(getValue(r, '_data')).sd).toBe(0);
  });
});
