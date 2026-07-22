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
    const box = r.find(x => x.id === 'boxPlotData');
    expect(box).toBeTruthy();
    expect(box!.value).toContain('q1');
  });

  it('returns empty for fewer than 3 values', () => {
    const r = config.calculate({ data: '1, 2', type: 'sample' });
    expect(r).toEqual([]);
  });
});
