import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/descriptive-stats/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Descriptive Statistics Calculator', () => {
  it('calculates count', () => {
    const r = config.calculate({ data: '1, 2, 3, 4, 5, 6, 7' });
    expect(getValue(r, 'count')).toBe('7 / 28');
  });

  it('calculates sum via count field', () => {
    const r = config.calculate({ data: '1, 2, 3, 4, 5' });
    expect(getValue(r, 'count')).toBe('5 / 15');
  });

  it('calculates mean', () => {
    const r = config.calculate({ data: '1, 2, 3, 4, 5, 6, 7' });
    near(parseFloat(getValue(r, 'mean')), 4);
  });

  it('calculates median for odd count', () => {
    const r = config.calculate({ data: '1, 3, 5, 7, 9' });
    near(parseFloat(getValue(r, 'median')), 5);
  });

  it('calculates median for even count', () => {
    const r = config.calculate({ data: '1, 2, 3, 4, 5, 6' });
    near(parseFloat(getValue(r, 'median')), 3.5);
  });

  it('calculates mode for a dataset with one mode', () => {
    const r = config.calculate({ data: '1, 2, 2, 3, 4' });
    expect(getValue(r, 'mode')).toBe('2');
  });

  it('calculates mode for a multimodal dataset', () => {
    const r = config.calculate({ data: '1, 1, 2, 2, 3, 4' });
    expect(getValue(r, 'mode')).toBe('1, 2');
  });

  it('shows "no mode" when no value repeats', () => {
    const r = config.calculate({ data: '1, 2, 3, 4, 5' });
    expect(getValue(r, 'mode')).toContain('No mode');
  });

  it('calculates range', () => {
    const r = config.calculate({ data: '2, 4, 6, 8, 10' });
    near(parseFloat(getValue(r, 'range')), 8);
  });

  it('calculates variance (population)', () => {
    const r = config.calculate({ data: '1, 2, 3, 4, 5' });
    near(parseFloat(getValue(r, 'variance')), 2, 0.01);
  });

  it('calculates standard deviation (population)', () => {
    const r = config.calculate({ data: '1, 2, 3, 4, 5' });
    expect(getValue(r, 'variance')).toBe('2 / 1.414214');
  });

  it('finds minimum and maximum via minmax', () => {
    const r = config.calculate({ data: '3, 7, 1, 9, 2' });
    expect(getValue(r, 'minmax')).toBe('1 / 9');
  });

  it('calculates Q1 and Q3 via quartiles', () => {
    const r = config.calculate({ data: '1, 2, 3, 4, 5, 6, 7, 8' });
    expect(getValue(r, 'quartiles')).toBe('2.5 / 6.5 / 4');
  });

  it('parses comma-separated values', () => {
    const r = config.calculate({ data: '10, 20, 30' });
    near(parseFloat(getValue(r, 'mean')), 20);
  });

  it('parses space-separated values', () => {
    const r = config.calculate({ data: '10 20 30' });
    near(parseFloat(getValue(r, 'mean')), 20);
  });

  it('parses semicolon-separated values', () => {
    const r = config.calculate({ data: '10; 20; 30' });
    near(parseFloat(getValue(r, 'mean')), 20);
  });

  it('parses newline-separated values', () => {
    const r = config.calculate({ data: '10\n20\n30' });
    near(parseFloat(getValue(r, 'mean')), 20);
  });

  it('returns empty for empty input', () => {
    const r = config.calculate({ data: '' });
    expect(r).toEqual([]);
  });

  it('returns empty for non-numeric input', () => {
    const r = config.calculate({ data: 'abc, def' });
    expect(r).toEqual([]);
  });

  it('returns empty for single value (needs at least 2)', () => {
    const r = config.calculate({ data: '42' });
    expect(r).toEqual([]);
  });

  it('returns empty for whitespace-only input', () => {
    const r = config.calculate({ data: '   ' });
    expect(r).toEqual([]);
  });
});
