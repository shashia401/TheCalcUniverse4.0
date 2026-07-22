import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/mean-median-mode/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Mean Median Mode Range calculator', () => {
  // ── Basic computation tests ──
  it('computes mean correctly', () => {
    const r = config.calculate({ data: '12, 15, 18, 20, 22, 25, 30' });
    near(parseNumber(getValue(r, 'mean')), 20.2857, 0.001);
  });

  it('computes mean for simple data', () => {
    const r = config.calculate({ data: '1, 2, 3, 4, 5' });
    near(parseNumber(getValue(r, 'mean')), 3);
  });

  it('computes median for odd count', () => {
    const r = config.calculate({ data: '12, 15, 18, 20, 22, 25, 30' });
    near(parseNumber(getValue(r, 'median')), 20);
  });

  it('computes median for even count with step-by-step detail', () => {
    const r = config.calculate({ data: '2, 4, 6, 8' });
    near(parseNumber(getValue(r, 'median')), 5);
    const detail = r.find(x => x.id === 'medianDetail');
    expect(detail).toBeTruthy();
    expect(detail!.value).toContain('4');
    expect(detail!.value).toContain('6');
  });

  it('computes median for unsorted even count', () => {
    const r = config.calculate({ data: '8, 2, 6, 4' });
    near(parseNumber(getValue(r, 'median')), 5);
  });

  it('computes mode when there is one', () => {
    const r = config.calculate({ data: '1, 2, 2, 3, 4, 4, 4, 5' });
    expect(getValue(r, 'mode')).toBe('4');
  });

  it('handles bimodal data', () => {
    const r = config.calculate({ data: '1, 1, 2, 3, 4, 4, 5' });
    const mode = getValue(r, 'mode');
    expect(mode).toContain('1');
    expect(mode).toContain('4');
  });

  it('handles multimodal data (more than 2 modes)', () => {
    const r = config.calculate({ data: '1, 1, 2, 2, 3, 3, 4' });
    const mode = getValue(r, 'mode');
    expect(mode).toContain('1');
    expect(mode).toContain('2');
    expect(mode).toContain('3');
  });

  it('returns no mode when all unique', () => {
    const r = config.calculate({ data: '1, 2, 3, 4, 5' });
    expect(getValue(r, 'mode')).toContain('No mode');
  });

  it('computes range correctly', () => {
    const r = config.calculate({ data: '10, 20, 30, 40, 50' });
    near(parseNumber(getValue(r, 'range')), 40);
  });

  it('computes range with negative values', () => {
    const r = config.calculate({ data: '-10, 0, 10' });
    near(parseNumber(getValue(r, 'range')), 20);
  });

  it('shows sorted data', () => {
    const r = config.calculate({ data: '5, 3, 1, 4, 2' });
    expect(getValue(r, 'sortedData')).toBe('1, 2, 3, 4, 5');
  });

  it('shows sorted data preserving input values', () => {
    const r = config.calculate({ data: '5, 3, 1, 4, 2' });
    expect(getValue(r, 'sortedData')).toContain('1');
    expect(getValue(r, 'sortedData')).toContain('5');
  });

  it('shows count', () => {
    const r = config.calculate({ data: '1, 2, 3' });
    expect(getValue(r, 'dataCount')).toBe('3');
  });

  it('shows sum correctly', () => {
    const r = config.calculate({ data: '1, 2, 3' });
    near(parseNumber(getValue(r, 'sum')), 6);
  });

  it('shows sum for larger data', () => {
    const r = config.calculate({ data: '10, 20, 30, 40, 50' });
    near(parseNumber(getValue(r, 'sum')), 150);
  });

  // ── Median detail for even datasets ──
  it('shows medianDetail only for even-sized datasets', () => {
    const rEven = config.calculate({ data: '2, 4, 6, 8' });
    expect(rEven.find(x => x.id === 'medianDetail')).toBeTruthy();

    const rOdd = config.calculate({ data: '1, 2, 3, 4, 5' });
    expect(rOdd.find(x => x.id === 'medianDetail')).toBeUndefined();
  });

  it('medianDetail shows the calculation steps', () => {
    const r = config.calculate({ data: '10, 20' });
    const detail = r.find(x => x.id === 'medianDetail');
    expect(detail).toBeTruthy();
    expect(detail!.value).toContain('10');
    expect(detail!.value).toContain('20');
    expect(detail!.value).toContain('15');
  });

  // ── Edge case tests ──
  it('returns empty for fewer than 2 values', () => {
    const r = config.calculate({ data: '42' });
    expect(r).toEqual([]);
  });

  it('returns empty for empty input', () => {
    const r = config.calculate({ data: '' });
    expect(r).toEqual([]);
  });

  it('returns empty for whitespace-only input', () => {
    const r = config.calculate({ data: '   ' });
    expect(r).toEqual([]);
  });

  it('filters out non-numeric entries', () => {
    const r = config.calculate({ data: '10, abc, 20, xyz, 30' });
    expect(getValue(r, 'dataCount')).toBe('3');
    near(parseNumber(getValue(r, 'mean')), 20);
  });

  // ── Decimal.js precision tests ──
  it('handles decimal numbers without floating-point errors', () => {
    const r = config.calculate({ data: '0.1, 0.2, 0.3, 0.4' });
    near(parseNumber(getValue(r, 'mean')), 0.25);
  });

  it('handles negative decimal values', () => {
    const r = config.calculate({ data: '-1.5, -0.5, 0, 0.5, 1.5' });
    near(parseNumber(getValue(r, 'mean')), 0);
    near(parseNumber(getValue(r, 'median')), 0);
  });

  it('handles very small values', () => {
    const r = config.calculate({ data: '0.0001, 0.0002, 0.0003' });
    near(parseNumber(getValue(r, 'mean')), 0.0002);
  });

  it('handles very large values', () => {
    const r = config.calculate({ data: '1000000, 2000000, 3000000, 4000000, 5000000' });
    near(parseNumber(getValue(r, 'mean')), 3000000);
  });

  // ── Input format tests ──
  it('handles space-separated input', () => {
    const r = config.calculate({ data: '10 20 30 40 50' });
    expect(getValue(r, 'dataCount')).toBe('5');
    near(parseNumber(getValue(r, 'mean')), 30);
  });

  it('handles semicolon-separated input', () => {
    const r = config.calculate({ data: '10;20;30;40;50' });
    expect(getValue(r, 'dataCount')).toBe('5');
    near(parseNumber(getValue(r, 'mean')), 30);
  });

  it('handles mixed separators', () => {
    const r = config.calculate({ data: '10, 20 30;40' });
    expect(getValue(r, 'dataCount')).toBe('4');
  });

  it('handles trailing commas', () => {
    const r = config.calculate({ data: '10, 20, 30,' });
    expect(getValue(r, 'dataCount')).toBe('3');
  });

  it('handles leading/trailing whitespace', () => {
    const r = config.calculate({ data: '  10, 20, 30  ' });
    expect(getValue(r, 'dataCount')).toBe('3');
  });

  // ── Special case tests ──
  it('handles two identical values', () => {
    const r = config.calculate({ data: '5, 5' });
    expect(getValue(r, 'mode')).toBe('5');
    near(parseNumber(getValue(r, 'mean')), 5);
    near(parseNumber(getValue(r, 'range')), 0);
  });

  it('handles only negative values', () => {
    const r = config.calculate({ data: '-10, -20, -30, -40, -50' });
    near(parseNumber(getValue(r, 'mean')), -30);
    near(parseNumber(getValue(r, 'median')), -30);
  });

  it('no medianDetail for odd datasets', () => {
    const r = config.calculate({ data: '1, 2, 3, 4, 5, 6, 7' });
    expect(r.find(x => x.id === 'medianDetail')).toBeUndefined();
  });

  it('mean is correctly formatted as an integer when result is integer', () => {
    const r = config.calculate({ data: '2, 4, 6' });
    expect(getValue(r, 'mean')).toBe('4');
  });
});
