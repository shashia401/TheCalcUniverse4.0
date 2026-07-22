import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/average-return/index';
import { getValue, parseNumber } from '../../helpers';

describe('average return calculator', () => {
  it('calculates CAGR from start/end values', () => {
    const r = config.calculate({
      inputMode: 'simple',
      startingValue: '10000',
      endingValue: '20000',
      years: '5',
      returnsInput: '',
    });
    const cagr = parseNumber(getValue(r, 'cagr'));
    expect(cagr).toBeGreaterThan(14);
    expect(cagr).toBeLessThan(15);
  });

  it('calculates from annual returns list', () => {
    const r = config.calculate({
      inputMode: 'annual',
      startingValue: '',
      endingValue: '',
      years: '',
      returnsInput: '10, 20, -5, 15, 8',
    });
    const cagr = parseNumber(getValue(r, 'cagr'));
    expect(cagr).toBeGreaterThan(8);
    expect(cagr).toBeLessThan(10);
    const simpleAvg = parseNumber(getValue(r, 'simpleAvg'));
    expect(simpleAvg).toBeGreaterThan(cagr);
  });

  it('shows best/worst year in annual mode', () => {
    const r = config.calculate({
      inputMode: 'annual',
      startingValue: '',
      endingValue: '',
      years: '',
      returnsInput: '25, -10, 15, 30, 5',
    });
    const bestYear = parseNumber(getValue(r, 'bestYear'));
    expect(bestYear).toBe(30);
    const positiveYears = parseNumber(getValue(r, 'positiveYears'));
    expect(positiveYears).toBe(4);
  });

  it('returns empty for missing or too few inputs', () => {
    const r = config.calculate({
      inputMode: 'simple',
      startingValue: '',
      endingValue: '',
      years: '',
      returnsInput: '',
    });
    expect(r).toEqual([]);
  });
});
