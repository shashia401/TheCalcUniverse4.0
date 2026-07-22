import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/series/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Series Calculator', () => {
  it('calculates sum of 1 to 5', () => {
    const r = config.calculate({ start: '1', end: '5', expression: 'n' });
    near(parseNumber(getValue(r, 'sum')), 15);
  });

  it('calculates sum of squares', () => {
    const r = config.calculate({ start: '1', end: '4', expression: 'n^2' });
    near(parseNumber(getValue(r, 'sum')), 30);
  });

  it('calculates geometric series 1/2^n', () => {
    const r = config.calculate({ start: '1', end: '5', expression: '1/2^n' });
    near(parseNumber(getValue(r, 'sum')), 0.96875);
  });

  it('shows correct term count', () => {
    const r = config.calculate({ start: '1', end: '10', expression: 'n' });
    expect(getValue(r, 'termCount')).toBe('10');
  });

  it('shows last term value', () => {
    const r = config.calculate({ start: '1', end: '5', expression: 'n^2' });
    near(parseNumber(getValue(r, 'lastTerm')), 25);
  });

  it('shows first 20 terms', () => {
    const r = config.calculate({ start: '1', end: '3', expression: 'n' });
    expect(getValue(r, 'terms')).toContain('1, 2, 3');
  });

  it('handles pi in expression', () => {
    const r = config.calculate({ start: '1', end: '2', expression: 'pi' });
    near(parseNumber(getValue(r, 'sum')), Math.PI * 2);
  });

  it('returns empty for invalid start/end', () => {
    const r = config.calculate({ start: 'abc', end: '5', expression: 'n' });
    expect(r).toEqual([]);
  });

  it('returns empty for empty expression', () => {
    const r = config.calculate({ start: '1', end: '5', expression: '' });
    expect(r).toEqual([]);
  });

  it('returns empty when start > end', () => {
    const r = config.calculate({ start: '10', end: '1', expression: 'n' });
    expect(r).toEqual([]);
  });

  it('handles harmonic series', () => {
    const r = config.calculate({ start: '1', end: '5', expression: '1/n' });
    near(parseNumber(getValue(r, 'sum')), 2.28333);
  });

  it('handles expression with parentheses', () => {
    const r = config.calculate({ start: '1', end: '3', expression: '1/(n+1)' });
    near(parseNumber(getValue(r, 'sum')), 0.5 + 1/3 + 0.25);
  });
});
