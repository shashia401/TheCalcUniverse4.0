import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/standard-deviation/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('standard-deviation calculator', () => {
  it('calculates sample statistics for a simple dataset', () => {
    const r = config.calculate({ dataSet: '2, 4, 4, 4, 5, 5, 7, 9', population: 'sample' });
    near(parseNumber(getValue(r, 'mean')), 5);
    near(parseNumber(getValue(r, 'variance')), 4.57143, 0.01);
    near(parseNumber(getValue(r, 'stdDev')), 2.13809, 0.01);
    near(parseNumber(getValue(r, 'median')), 4.5);
    expect(getValue(r, 'count')).toBe('8');
  });

  it('calculates population statistics correctly', () => {
    const r = config.calculate({ dataSet: '2, 4, 4, 4, 5, 5, 7, 9', population: 'population' });
    near(parseNumber(getValue(r, 'variance')), 4);
    near(parseNumber(getValue(r, 'stdDev')), 2);
    expect(getValue(r, 'count')).toBe('8');
  });

  it('returns zero std deviation for identical values', () => {
    const r = config.calculate({ dataSet: '5, 5, 5, 5', population: 'sample' });
    near(parseNumber(getValue(r, 'stdDev')), 0);
    near(parseNumber(getValue(r, 'mean')), 5);
    near(parseNumber(getValue(r, 'variance')), 0);
  });

  it('returns empty for single value', () => {
    expect(config.calculate({ dataSet: '5', population: 'sample' })).toHaveLength(0);
  });

  it('returns empty for empty input', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty for empty string', () => {
    expect(config.calculate({ dataSet: '', population: 'sample' })).toHaveLength(0);
  });

  it('computes range correctly', () => {
    const r = config.calculate({ dataSet: '1, 3, 5, 7, 9', population: 'sample' });
    const rangeVal = getValue(r, 'range');
    expect(rangeVal).toContain('1');
    expect(rangeVal).toContain('9');
  });

  it('computes coefficient of variation', () => {
    const r = config.calculate({ dataSet: '10, 12, 14, 16, 18', population: 'sample' });
    const cv = getValue(r, 'cv');
    expect(cv).toContain('%');
  });
});
