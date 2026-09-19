import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/statistics/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Statistics Calculator', () => {
  const standardData = '12, 15, 22, 24, 25, 30, 33, 38, 45, 52';

  // ── Basic computation tests ──
  it('computes count correctly', () => {
    const r = config.calculate({ data: standardData, type: 'sample' });
    expect(getValue(r, 'count')).toBe('10');
  });

  it('computes mean correctly', () => {
    const r = config.calculate({ data: standardData, type: 'sample' });
    near(parseNumber(getValue(r, 'mean')), 29.6);
  });

  it('computes quartiles for odd-count dataset', () => {
    const r = config.calculate({ data: '1, 2, 3, 4, 5, 6, 7', type: 'sample' });
    near(parseNumber(getValue(r, 'q1')), 2);
    near(parseNumber(getValue(r, 'q2')), 4);
    near(parseNumber(getValue(r, 'q3')), 6);
    near(parseNumber(getValue(r, 'iqr')), 4);
  });

  it('computes quartiles for even-count dataset', () => {
    const r = config.calculate({ data: standardData, type: 'sample' });
    near(parseNumber(getValue(r, 'q1')), 22);
    near(parseNumber(getValue(r, 'q2')), 27.5);
    near(parseNumber(getValue(r, 'q3')), 38);
  });

  it('computes IQR correctly', () => {
    const r = config.calculate({ data: standardData, type: 'sample' });
    near(parseNumber(getValue(r, 'iqr')), 16);
  });

  it('returns standard deviation', () => {
    const r = config.calculate({ data: standardData, type: 'population' });
    expect(parseNumber(getValue(r, 'stddev'))).toBeGreaterThan(0);
  });

  it('returns variance', () => {
    const r = config.calculate({ data: standardData, type: 'population' });
    expect(parseNumber(getValue(r, 'variance'))).toBeGreaterThan(0);
  });

  it('detects no outliers for normal data', () => {
    const r = config.calculate({ data: standardData, type: 'sample' });
    expect(getValue(r, 'outliers')).toBe('None detected');
  });

  it('detects outliers when present using 1.5xIQR rule', () => {
    const r = config.calculate({ data: '1, 2, 3, 4, 5, 100', type: 'sample' });
    expect(getValue(r, 'outliers')).not.toBe('None detected');
    expect(parseNumber(getValue(r, 'outlierCount'))).toBeGreaterThanOrEqual(1);
  });

  it('returns min and max', () => {
    const r = config.calculate({ data: standardData, type: 'sample' });
    expect(getValue(r, 'min')).toBe('12');
    expect(getValue(r, 'max')).toBe('52');
  });

  it('computes range correctly', () => {
    const r = config.calculate({ data: standardData, type: 'sample' });
    near(parseNumber(getValue(r, 'range')), 40);
  });

  it('returns box plot data', () => {
    const r = config.calculate({ data: standardData, type: 'sample' });
    const box = r.find(x => x.id === '_boxPlotData');
    expect(box).toBeTruthy();
    expect(box!.value).toContain('q1');
  });

  it('correctly computes known population SD', () => {
    const r = config.calculate({ data: '2, 4, 4, 4, 5, 5, 7, 9', type: 'population' });
    // Population SD = 2
    near(parseNumber(getValue(r, 'stddev')), 2, 0.01);
  });

  it('correctly computes known sample SD', () => {
    const r = config.calculate({ data: '2, 4, 4, 4, 5, 5, 7, 9', type: 'sample' });
    // Sample SD ≈ 2.138
    near(parseNumber(getValue(r, 'stddev')), 2.138, 0.01);
  });

  it('sample SD is larger than population SD for same data', () => {
    const rSample = config.calculate({ data: '2, 4, 4, 4, 5, 5, 7, 9', type: 'sample' });
    const rPop = config.calculate({ data: '2, 4, 4, 4, 5, 5, 7, 9', type: 'population' });
    const sdSample = parseNumber(getValue(rSample, 'stddev'));
    const sdPop = parseNumber(getValue(rPop, 'stddev'));
    expect(sdSample).toBeGreaterThan(sdPop);
  });

  // ── Outlier fence tests ──
  it('detects outlier above upper fence', () => {
    const r = config.calculate({ data: '10, 12, 14, 15, 16, 18, 20, 100', type: 'sample' });
    expect(parseNumber(getValue(r, 'outlierCount'))).toBeGreaterThanOrEqual(1);
    expect(getValue(r, 'outliers')).toContain('100');
  });

  it('detects outlier below lower fence', () => {
    const r = config.calculate({ data: '-50, 10, 12, 14, 15, 16, 18, 20', type: 'sample' });
    expect(parseNumber(getValue(r, 'outlierCount'))).toBeGreaterThanOrEqual(1);
  });

  it('detects multiple outliers', () => {
    const r = config.calculate({ data: '-50, 1, 2, 3, 4, 5, 6, 7, 99, 100', type: 'sample' });
    expect(parseNumber(getValue(r, 'outlierCount'))).toBeGreaterThanOrEqual(2);
  });

  it('shows fence values', () => {
    const r = config.calculate({ data: standardData, type: 'sample' });
    expect(getValue(r, 'fences')).toContain('[');
    expect(getValue(r, 'fences')).toContain(']');
    expect(getValue(r, 'fences')).toContain(',');
  });

  // ── Decimal.js precision tests ──
  it('handles decimal values precisely', () => {
    const r = config.calculate({ data: '0.1, 0.2, 0.3, 0.4, 0.5', type: 'population' });
    near(parseNumber(getValue(r, 'mean')), 0.3);
  });

  it('handles negative values', () => {
    const r = config.calculate({ data: '-5, -3, -1, 0, 1, 3, 5', type: 'sample' });
    near(parseNumber(getValue(r, 'mean')), 0);
  });

  it('handles decimals with many digits', () => {
    const r = config.calculate({ data: '1.234567, 2.345678, 3.456789', type: 'population' });
    near(parseNumber(getValue(r, 'mean')), 2.345678, 0.001);
  });

  // ── Edge case tests ──
  it('returns empty for fewer than 3 values', () => {
    const r = config.calculate({ data: '42, 56', type: 'sample' });
    expect(r).toEqual([]);
  });

  it('returns empty for empty input', () => {
    const r = config.calculate({ data: '', type: 'sample' });
    expect(r).toEqual([]);
  });

  it('filters out NaN/invalid entries and works with valid ones', () => {
    const r = config.calculate({ data: '10, abc, 20, xyz, 30', type: 'sample' });
    near(parseNumber(getValue(r, 'mean')), 20);
    expect(getValue(r, 'count')).toBe('3');
  });

  it('handles whitespace-only input', () => {
    const r = config.calculate({ data: '   ', type: 'sample' });
    expect(r).toEqual([]);
  });

  it('handles undefined data', () => {
    const r = config.calculate({ type: 'sample' } as unknown as Record<string, string>);
    expect(r).toEqual([]);
  });

  // ── Input format tests ──
  it('handles space-separated values', () => {
    const r = config.calculate({ data: '10 20 30 40 50', type: 'population' });
    near(parseNumber(getValue(r, 'mean')), 30);
  });

  it('handles semicolon-separated values', () => {
    const r = config.calculate({ data: '10;20;30;40;50', type: 'population' });
    near(parseNumber(getValue(r, 'mean')), 30);
  });

  it('handles mixed separators', () => {
    const r = config.calculate({ data: '10, 20 30;40', type: 'population' });
    expect(getValue(r, 'count')).toBe('4');
  });

  it('handles newline-separated values', () => {
    const r = config.calculate({ data: '10\n20\n30\n40\n50', type: 'population' });
    near(parseNumber(getValue(r, 'mean')), 30);
  });

  it('handles trailing separators', () => {
    const r = config.calculate({ data: '10, 20, 30,', type: 'population' });
    expect(getValue(r, 'count')).toBe('3');
  });

  it('handles leading/trailing whitespace', () => {
    const r = config.calculate({ data: '  10, 20, 30  ', type: 'population' });
    expect(getValue(r, 'count')).toBe('3');
  });

  // ── Default type test ──
  it('defaults to sample when type is not population', () => {
    const rSample = config.calculate({ data: '1, 2, 3, 4, 5' });
    const rPop = config.calculate({ data: '1, 2, 3, 4, 5', type: 'population' });
    const sdSample = parseNumber(getValue(rSample, 'stddev'));
    const sdPop = parseNumber(getValue(rPop, 'stddev'));
    expect(sdSample).toBeGreaterThan(sdPop);
  });

  // ── All identical values ──
  it('returns zero SD for identical values', () => {
    const r = config.calculate({ data: '5, 5, 5, 5, 5', type: 'sample' });
    near(parseNumber(getValue(r, 'stddev')), 0);
    near(parseNumber(getValue(r, 'variance')), 0);
  });
});
