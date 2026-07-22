import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/correlation-calculator/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Correlation Calculator', () => {
  it('calculates Pearson r for a positive correlation dataset', () => {
    const r = config.calculate({ xValues: '1, 2, 3, 4, 5', yValues: '2, 4, 5, 4, 5' });
    const rVal = parseFloat(getValue(r, 'r'));
    expect(rVal).toBeGreaterThan(0.7);
    expect(rVal).toBeLessThan(1);
    near(rVal, 0.8, 0.05);
  });

  it('calculates r = 1 for perfectly correlated data', () => {
    const r = config.calculate({ xValues: '1, 2, 3, 4, 5', yValues: '2, 4, 6, 8, 10' });
    near(parseFloat(getValue(r, 'r')), 1);
  });

  it('calculates r = -1 for perfectly negatively correlated data', () => {
    const r = config.calculate({ xValues: '1, 2, 3, 4, 5', yValues: '10, 8, 6, 4, 2' });
    near(parseFloat(getValue(r, 'r')), -1);
  });

  it('shows r-squared value', () => {
    const r = config.calculate({ xValues: '1, 2, 3, 4, 5', yValues: '2, 4, 6, 8, 10' });
    const rsq = parseFloat(getValue(r, 'rSquared'));
    near(rsq, 1);
  });

  it('shows strength as "Very strong" for r close to 1', () => {
    const r = config.calculate({ xValues: '1, 2, 3, 4, 5', yValues: '2, 4, 6, 8, 10' });
    expect(getValue(r, 'strength')).toBe('Very strong');
  });

  it('shows strength as "Very weak" for near-zero correlation', () => {
    const r = config.calculate({ xValues: '-2, -1, 0, 1, 2', yValues: '2, -1, -2, -1, 2' });
    expect(getValue(r, 'strength')).toBe('Very weak');
  });

  it('shows direction as "Positive" for positive r', () => {
    const r = config.calculate({ xValues: '1, 2, 3, 4, 5', yValues: '2, 4, 6, 8, 10' });
    expect(getValue(r, 'direction')).toBe('Positive');
  });

  it('shows direction as "Negative" for negative r', () => {
    const r = config.calculate({ xValues: '1, 2, 3, 4, 5', yValues: '10, 8, 6, 4, 2' });
    expect(getValue(r, 'direction')).toBe('Negative');
  });

  it('calculates means of X and Y', () => {
    const r = config.calculate({ xValues: '1, 2, 3, 4, 5', yValues: '2, 4, 5, 4, 5' });
    near(parseFloat(getValue(r, 'meanX')), 3);
    near(parseFloat(getValue(r, 'meanY')), 4, 0.01);
  });

  it('shows sample size n', () => {
    const r = config.calculate({ xValues: '1, 2, 3, 4, 5', yValues: '2, 4, 5, 4, 5' });
    expect(getValue(r, 'n')).toBe('5');
  });

  it('calculates covariance', () => {
    const r = config.calculate({ xValues: '1, 2, 3, 4, 5', yValues: '2, 4, 6, 8, 10' });
    const cov = parseFloat(getValue(r, 'covariance'));
    expect(cov).toBeGreaterThan(0);
  });

  it('shows formula applied', () => {
    const r = config.calculate({ xValues: '1, 2, 3, 4, 5', yValues: '2, 4, 6, 8, 10' });
    expect(getValue(r, 'formula')).toContain('r =');
  });

  it('parses semicolon-separated values', () => {
    const r = config.calculate({ xValues: '1; 2; 3', yValues: '2; 4; 6' });
    near(parseFloat(getValue(r, 'r')), 1);
  });

  it('parses whitespace-separated values', () => {
    const r = config.calculate({ xValues: '1 2 3', yValues: '2 4 6' });
    near(parseFloat(getValue(r, 'r')), 1);
  });

  it('parses newline-separated values', () => {
    const r = config.calculate({ xValues: '1\n2\n3', yValues: '2\n4\n6' });
    near(parseFloat(getValue(r, 'r')), 1);
  });

  it('returns empty for mismatched array lengths', () => {
    const r = config.calculate({ xValues: '1, 2, 3', yValues: '1, 2' });
    expect(r).toEqual([]);
  });

  it('returns empty for fewer than 3 points', () => {
    const r = config.calculate({ xValues: '1, 2', yValues: '3, 4' });
    expect(r).toEqual([]);
  });

  it('returns empty for empty input', () => {
    const r = config.calculate({ xValues: '', yValues: '' });
    expect(r).toEqual([]);
  });

  it('returns empty for non-numeric input', () => {
    const r = config.calculate({ xValues: 'abc', yValues: '1, 2, 3' });
    expect(r).toEqual([]);
  });

  it('returns empty for empty object values', () => {
    const r = config.calculate({ xValues: '   ', yValues: '   ' });
    expect(r).toEqual([]);
  });
});
