import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/standard-deviation/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Standard Deviation calculator', () => {
  // ── Basic computation tests ──
  it('calculates sample standard deviation for 12,15,18,22,14,19,16,21', () => {
    const r = config.calculate({ dataSet: '12, 15, 18, 22, 14, 19, 16, 21', population: 'sample' });
    // n=8, mean=17.125, sumSqDiffs=84.875, var=84.875/7≈12.125, sd≈3.482
    near(parseNumber(getValue(r, 'stdDev')), 3.482, 0.01);
  });

  it('calculates population standard deviation for 12,15,18,22,14,19,16,21', () => {
    const r = config.calculate({ dataSet: '12, 15, 18, 22, 14, 19, 16, 21', population: 'population' });
    // n=8, mean=17.125, sumSqDiffs=84.875, var=84.875/8≈10.609, sd≈3.257
    near(parseNumber(getValue(r, 'stdDev')), 3.257, 0.01);
  });

  it('calculates mean correctly', () => {
    const r = config.calculate({ dataSet: '1, 2, 3, 4, 5', population: 'sample' });
    near(parseNumber(getValue(r, 'mean')), 3);
  });

  it('calculates variance correctly', () => {
    const r = config.calculate({ dataSet: '1, 2, 3, 4, 5', population: 'population' });
    // mean=3, deviations: -2,-1,0,1,2, squared: 4,1,0,1,4 sum=10, var=10/5=2
    near(parseNumber(getValue(r, 'variance')), 2);
  });

  it('calculates sample variance correctly', () => {
    const r = config.calculate({ dataSet: '1, 2, 3, 4, 5', population: 'sample' });
    // mean=3, sumSqDiffs=10, var=10/4=2.5
    near(parseNumber(getValue(r, 'variance')), 2.5);
  });

  it('calculates median for odd count', () => {
    const r = config.calculate({ dataSet: '3, 1, 2, 5, 4', population: 'sample' });
    near(parseNumber(getValue(r, 'median')), 3);
  });

  it('calculates median for even count', () => {
    const r = config.calculate({ dataSet: '1, 2, 3, 4', population: 'sample' });
    near(parseNumber(getValue(r, 'median')), 2.5);
  });

  it('calculates count correctly', () => {
    const r = config.calculate({ dataSet: '10, 20, 30, 40, 50, 60, 70', population: 'sample' });
    expect(getValue(r, 'count')).toBe('7');
  });

  it('calculates coefficient of variation', () => {
    const r = config.calculate({ dataSet: '10, 12, 11, 13, 10, 12', population: 'sample' });
    // mean≈11.333, SD≈1.211, CV≈10.68%
    const cv = parseFloat(getValue(r, 'cv').replace('%', ''));
    near(cv, 10.68, 0.5);
  });

  it('returns CV of 0 when mean is 0', () => {
    const r = config.calculate({ dataSet: '-5, -3, 0, 3, 5', population: 'sample' });
    expect(getValue(r, 'cv')).toBe('0.00%');
  });

  it('calculates correct CV for known ratio', () => {
    const r = config.calculate({ dataSet: '10, 10, 10, 10, 10', population: 'population' });
    expect(getValue(r, 'cv')).toBe('0.00%');
  });

  // ── Population vs sample tests ──
  it('sample SD is larger than population SD for same data', () => {
    const rSample = config.calculate({ dataSet: '1, 2, 3, 4, 5', population: 'sample' });
    const rPop = config.calculate({ dataSet: '1, 2, 3, 4, 5', population: 'population' });
    const sampleSD = parseNumber(getValue(rSample, 'stdDev'));
    const popSD = parseNumber(getValue(rPop, 'stdDev'));
    expect(sampleSD).toBeGreaterThan(popSD);
  });

  it('for large datasets, sample and population SD converge', () => {
    const largeData = Array.from({ length: 100 }, (_, i) => (i + 1).toString()).join(', ');
    const rSample = config.calculate({ dataSet: largeData, population: 'sample' });
    const rPop = config.calculate({ dataSet: largeData, population: 'population' });
    const sampleSD = parseNumber(getValue(rSample, 'stdDev'));
    const popSD = parseNumber(getValue(rPop, 'stdDev'));
    // For n=100, difference should be small
    near(sampleSD, popSD, 0.2);
  });

  // ── SD for known distributions ──
  it('returns zero SD for identical values', () => {
    const r = config.calculate({ dataSet: '5, 5, 5, 5, 5', population: 'sample' });
    near(parseNumber(getValue(r, 'stdDev')), 0);
    near(parseNumber(getValue(r, 'variance')), 0);
  });

  it('SD of two values is correct for sample', () => {
    const r = config.calculate({ dataSet: '10, 20', population: 'sample' });
    // mean=15, diff=±5, sumSqDiffs=50, var=50/1=50, sd≈7.071
    near(parseNumber(getValue(r, 'stdDev')), 7.071, 0.01);
  });

  // ── Range tests ──
  it('shows range with min and max', () => {
    const r = config.calculate({ dataSet: '10, 20, 30, 40, 50', population: 'sample' });
    expect(getValue(r, 'range')).toContain('10');
    expect(getValue(r, 'range')).toContain('50');
    expect(getValue(r, 'range')).toContain('span');
  });

  // ── Edge case tests ──
  it('returns empty for empty input', () => {
    const r = config.calculate({ dataSet: '', population: 'sample' });
    expect(r).toEqual([]);
  });

  it('returns empty for single value', () => {
    const r = config.calculate({ dataSet: '42', population: 'sample' });
    expect(r).toEqual([]);
  });

  it('returns empty for all non-numeric input', () => {
    const r = config.calculate({ dataSet: 'abc, def, ghi', population: 'sample' });
    expect(r).toEqual([]);
  });

  it('filters out non-numeric entries and works with valid ones', () => {
    const r = config.calculate({ dataSet: '10, abc, 20, def, 30', population: 'sample' });
    expect(getValue(r, 'count')).toBe('3');
    near(parseNumber(getValue(r, 'mean')), 20);
  });

  it('handles whitespace-only input', () => {
    const r = config.calculate({ dataSet: '   ', population: 'sample' });
    expect(r).toEqual([]);
  });

  it('handles undefined dataSet', () => {
    const r = config.calculate({ population: 'sample' } as unknown as Record<string, string>);
    expect(r).toEqual([]);
  });

  it('defaults to sample when population is not specified', () => {
    const r = config.calculate({ dataSet: '1, 2, 3, 4, 5' });
    // Sample SD should be sqrt(2.5) ≈ 1.581
    near(parseNumber(getValue(r, 'stdDev')), 1.581, 0.01);
  });

  // ── Input format tests ──
  it('handles space-separated values', () => {
    const r = config.calculate({ dataSet: '10 20 30 40 50', population: 'population' });
    near(parseNumber(getValue(r, 'mean')), 30);
  });

  it('handles newline-separated values', () => {
    const r = config.calculate({ dataSet: '10\n20\n30\n40\n50', population: 'population' });
    near(parseNumber(getValue(r, 'mean')), 30);
  });

  it('handles mixed separators', () => {
    const r = config.calculate({ dataSet: '10, 20 30\n40', population: 'population' });
    expect(getValue(r, 'count')).toBe('4');
  });

  it('handles semicolon-separated values', () => {
    const r = config.calculate({ dataSet: '10;20;30;40;50', population: 'population' });
    expect(getValue(r, 'count')).toBe('5');
  });

  it('handles trailing separators', () => {
    const r = config.calculate({ dataSet: '10, 20, 30,', population: 'population' });
    expect(getValue(r, 'count')).toBe('3');
  });

  // ── Decimal.js precision tests ──
  it('handles decimal values precisely', () => {
    const r = config.calculate({ dataSet: '0.1, 0.2, 0.3, 0.4, 0.5', population: 'population' });
    near(parseNumber(getValue(r, 'mean')), 0.3);
    expect(parseNumber(getValue(r, 'stdDev'))).toBeGreaterThan(0);
  });

  it('handles negative values', () => {
    const r = config.calculate({ dataSet: '-5, -3, -1, 1, 3, 5', population: 'sample' });
    near(parseNumber(getValue(r, 'mean')), 0);
    expect(parseNumber(getValue(r, 'stdDev'))).toBeGreaterThan(0);
  });

  it('handles very small decimal values', () => {
    const r = config.calculate({ dataSet: '0.0001, 0.0002, 0.0003, 0.0004', population: 'sample' });
    near(parseNumber(getValue(r, 'mean')), 0.00025, 0.00001);
    expect(parseNumber(getValue(r, 'stdDev'))).toBeGreaterThan(0);
  });

  // ── Result structure tests ──
  it('returns all expected result fields for sample', () => {
    const r = config.calculate({ dataSet: '1, 2, 3, 4, 5', population: 'sample' });
    const ids = r.map(x => x.id);
    expect(ids).toContain('stdDev');
    expect(ids).toContain('mean');
    expect(ids).toContain('variance');
    expect(ids).toContain('median');
    expect(ids).toContain('count');
    expect(ids).toContain('range');
    expect(ids).toContain('cv');
  });

  it('highlights standard deviation result', () => {
    const r = config.calculate({ dataSet: '1, 2, 3, 4, 5', population: 'sample' });
    const sdResult = r.find(x => x.id === 'stdDev');
    expect(sdResult).toBeTruthy();
    expect(sdResult!.highlight).toBe(true);
  });

  // ── Large dataset test ──
  it('handles dataset of 100 values without overflow', () => {
    const values = Array.from({ length: 100 }, (_, i) => (i + 1).toString()).join(', ');
    const r = config.calculate({ dataSet: values, population: 'population' });
    expect(getValue(r, 'count')).toBe('100');
    near(parseNumber(getValue(r, 'mean')), 50.5);
    expect(parseNumber(getValue(r, 'stdDev'))).toBeGreaterThan(0);
  });
});
