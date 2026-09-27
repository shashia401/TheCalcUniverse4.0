import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/statistics/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Statistics calculator', () => {
  const data = '12, 15, 22, 24, 25, 30, 33, 38, 45, 52';

  it('computes count correctly', () => {
    const r = config.calculate({ data, type: 'sample' });
    expect(getValue(r, 'count')).toBe('10');
  });

  it('computes mean', () => {
    const r = config.calculate({ data, type: 'sample' });
    near(parseNumber(getValue(r, 'mean')), 29.6);
  });

  it('computes quartiles', () => {
    const r = config.calculate({ data, type: 'sample' });
    near(parseNumber(getValue(r, 'q1')), 22);
    near(parseNumber(getValue(r, 'q2')), 27.5);
    near(parseNumber(getValue(r, 'q3')), 38);
  });

  it('computes IQR', () => {
    const r = config.calculate({ data, type: 'sample' });
    near(parseNumber(getValue(r, 'iqr')), 16);
  });

  it('returns standard deviation', () => {
    const r = config.calculate({ data, type: 'population' });
    expect(parseNumber(getValue(r, 'stddev'))).toBeGreaterThan(0);
  });

  it('detects no outliers for normal data', () => {
    const r = config.calculate({ data, type: 'sample' });
    expect(getValue(r, 'outliers')).toBe('None detected');
  });

  it('detects outliers when present', () => {
    const r = config.calculate({ data: '1, 2, 3, 4, 5, 100', type: 'sample' });
    expect(getValue(r, 'outliers')).not.toBe('None detected');
  });

  it('returns min and max', () => {
    const r = config.calculate({ data, type: 'sample' });
    expect(getValue(r, 'min')).toBe('12');
    expect(getValue(r, 'max')).toBe('52');
  });

  it('returns box plot data', () => {
    const r = config.calculate({ data, type: 'sample' });
    const box = r.find(x => x.id === '_boxPlotData');
    expect(box).toBeTruthy();
    expect(box!.value).toContain('q1');
  });

  it('returns empty for fewer than 3 values', () => {
    const r = config.calculate({ data: '1, 2', type: 'sample' });
    expect(r).toEqual([]);
  });

  it('regression: real-estate outlier example matches worked example (was Q1=293750/Q3=310000/IQR=16250)', () => {
    const r = config.calculate({ data: '285000, 310000, 295000, 305000, 1200000, 290000, 300000, 315000', type: 'sample' });
    expect(getValue(r, 'q1')).toBe('292500');
    expect(getValue(r, 'q3')).toBe('312500');
    expect(getValue(r, 'iqr')).toBe('20000');
  });

  it('regression: bean growth outlier example matches worked example (was Q1=12.275/Q3=14.275/IQR=2.0)', () => {
    const r = config.calculate({ data: '12.5, 14.2, 11.8, 13.9, 3.2, 15.1, 13.4, 12.9, 14.6, 13.1', type: 'sample' });
    expect(getValue(r, 'q1')).toBe('12.5');
    expect(getValue(r, 'q3')).toBe('14.2');
    expect(getValue(r, 'iqr')).toBe('1.7');
  });
});
