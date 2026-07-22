import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/average-return/index';
import { getValue, parseNumber, parsePercent } from '../../helpers';
import { cagr, arithmeticAverage } from '../../../src/utils/financial';

describe('Average Return Calculator — Simple Mode (Start/End Values)', () => {
  it('calculates CAGR from starting and ending values over 5 years', () => {
    const r = config.calculate({
      inputMode: 'simple',
      startingValue: '10000',
      endingValue: '18000',
      years: '5',
    });

    const cagrVal = parsePercent(getValue(r, 'cagr'));
    // (18000/10000)^(1/5) - 1 = 1.8^0.2 - 1 ≈ 12.47%
    expect(cagrVal).toBeGreaterThan(12);
    expect(cagrVal).toBeLessThan(13);
  });

  it('shows CAGR less than simple average for growing investments', () => {
    const r = config.calculate({
      inputMode: 'simple',
      startingValue: '10000',
      endingValue: '20000',
      years: '7',
    });

    const cagrVal = parsePercent(getValue(r, 'cagr'));
    const simpleAvgVal = parsePercent(getValue(r, 'simpleAvg'));

    // CAGR should be lower than simple average (volatility drag is baked into the math difference)
    expect(cagrVal).toBeGreaterThan(0);
    // For a doubled investment, CAGR = 2^(1/7) - 1 ≈ 10.4%, simple avg = 100%/7 ≈ 14.3%
    expect(simpleAvgVal).toBeGreaterThan(cagrVal);
  });

  it('displays negative CAGR for declining investments', () => {
    const r = config.calculate({
      inputMode: 'simple',
      startingValue: '10000',
      endingValue: '7000',
      years: '3',
    });

    const cagrStr = getValue(r, 'cagr');
    expect(cagrStr).toContain('-');

    const cagrVal = parsePercent(cagrStr);
    expect(cagrVal).toBeLessThan(0);
  });

  it('returns empty array when starting value is zero', () => {
    const r = config.calculate({
      inputMode: 'simple',
      startingValue: '0',
      endingValue: '10000',
      years: '5',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array when ending value is zero', () => {
    const r = config.calculate({
      inputMode: 'simple',
      endingValue: '0',
      startingValue: '10000',
      years: '5',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array when years is zero', () => {
    const r = config.calculate({
      inputMode: 'simple',
      startingValue: '10000',
      endingValue: '20000',
      years: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array when years is negative', () => {
    const r = config.calculate({
      inputMode: 'simple',
      startingValue: '10000',
      endingValue: '20000',
      years: '-3',
    });
    expect(r).toEqual([]);
  });

  it('handles NaN inputs gracefully', () => {
    const r = config.calculate({
      inputMode: 'simple',
      startingValue: 'abc',
      endingValue: '10000',
      years: '5',
    });
    expect(r).toEqual([]);
  });

  it('handles empty inputs gracefully', () => {
    const r = config.calculate({
      inputMode: 'simple',
      startingValue: '',
      endingValue: '',
      years: '',
    });
    expect(r).toEqual([]);
  });

  it('shows growth multiple correctly', () => {
    const r = config.calculate({
      inputMode: 'simple',
      startingValue: '10000',
      endingValue: '25000',
      years: '5',
    });

    const growthMultiple = getValue(r, 'growthMultiple');
    expect(growthMultiple).toContain('2.50');
    expect(growthMultiple).toContain('x');
  });

  it('calculates exact CAGR for known values', () => {
    const r = config.calculate({
      inputMode: 'simple',
      startingValue: '1000',
      endingValue: '2000',
      years: '10',
    });

    // Rule of 72: ~7.2% CAGR to double in 10 years
    // Exact: 2^(1/10) - 1 ≈ 7.18%
    const cagrVal = parsePercent(getValue(r, 'cagr'));
    expect(cagrVal).toBeGreaterThan(7);
    expect(cagrVal).toBeLessThan(8);
  });

  it('handles dollar-formatted inputs', () => {
    const r = config.calculate({
      inputMode: 'simple',
      startingValue: '$10,000',
      endingValue: '$18,000',
      years: '5',
    });

    const cagrVal = parsePercent(getValue(r, 'cagr'));
    expect(cagrVal).toBeGreaterThan(12);
    expect(cagrVal).toBeLessThan(13);
  });
});

describe('Average Return Calculator — Annual Returns Mode', () => {
  it('calculates CAGR from a list of annual returns', () => {
    const r = config.calculate({
      inputMode: 'annual',
      returnsInput: '12, 8, 15, -3, 10',
    });

    const cagrVal = parsePercent(getValue(r, 'cagr'));
    // (1.12 * 1.08 * 1.15 * 0.97 * 1.10)^(1/5) - 1 ≈ 8.1%
    expect(cagrVal).toBeGreaterThan(7);
    expect(cagrVal).toBeLessThan(9);
  });

  it('computes arithmetic average from annual returns', () => {
    const r = config.calculate({
      inputMode: 'annual',
      returnsInput: '12, 8, 15, -3, 10',
    });

    const avgVal = parsePercent(getValue(r, 'simpleAvg'));
    // (12 + 8 + 15 + (-3) + 10) / 5 = 42/5 = 8.4%
    expect(avgVal).toBeGreaterThan(8);
    expect(avgVal).toBeLessThan(9);
  });

  it('shows CAGR lower than arithmetic average for volatile returns', () => {
    const r = config.calculate({
      inputMode: 'annual',
      returnsInput: '50, -40, 30, -20, 25',
    });

    const cagrVal = parsePercent(getValue(r, 'cagr'));
    const avgVal = parsePercent(getValue(r, 'simpleAvg'));

    // Arithmetic avg = (50-40+30-20+25)/5 = 45/5 = 9%
    // CAGR should be lower due to volatility
    expect(avgVal).toBeGreaterThan(0);
    expect(cagrVal).toBeLessThan(avgVal);
  });

  it('returns empty for a single return value', () => {
    const r = config.calculate({
      inputMode: 'annual',
      returnsInput: '12',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for empty returns string', () => {
    const r = config.calculate({
      inputMode: 'annual',
      returnsInput: '',
    });
    expect(r).toEqual([]);
  });

  it('handles returns with only NaN values', () => {
    const r = config.calculate({
      inputMode: 'annual',
      returnsInput: 'abc, def, xyz',
    });
    expect(r).toEqual([]);
  });

  it('filters out NaN values and uses remaining returns', () => {
    const r = config.calculate({
      inputMode: 'annual',
      returnsInput: '10, abc, 20, def, 30',
    });

    // Should parse 10, 20, 30 — 3 valid returns
    const cagrVal = parsePercent(getValue(r, 'cagr'));
    expect(cagrVal).toBeGreaterThan(0);
  });

  it('shows best and worst year correctly', () => {
    const r = config.calculate({
      inputMode: 'annual',
      returnsInput: '5, 12, -8, 22, -15, 18',
    });

    const bestYear = parsePercent(getValue(r, 'bestYear'));
    const worstYear = parsePercent(getValue(r, 'worstYear'));

    expect(bestYear).toBeCloseTo(22, 0);
    expect(worstYear).toBeCloseTo(-15, 0);
  });

  it('shows positive and negative year counts', () => {
    const r = config.calculate({
      inputMode: 'annual',
      returnsInput: '5, -3, 10, -2, 8, -1',
    });

    const posYears = getValue(r, 'positiveYears');
    const negYears = getValue(r, 'negativeYears');

    expect(posYears).toContain('3 of 6');
    expect(negYears).toContain('3 of 6');
  });

  it('handles the 50/50 trap scenario correctly', () => {
    const r = config.calculate({
      inputMode: 'annual',
      returnsInput: '50, -50',
    });

    const cagrVal = parsePercent(getValue(r, 'cagr'));
    const avgVal = parsePercent(getValue(r, 'simpleAvg'));

    // Arithmetic average = (50 + (-50)) / 2 = 0%
    expect(Math.abs(avgVal)).toBeLessThan(0.1);

    // CAGR = (1.5 * 0.5)^(1/2) - 1 = 0.75^0.5 - 1 ≈ -13.4%
    expect(cagrVal).toBeLessThan(-13);
    expect(cagrVal).toBeGreaterThan(-14);
  });

  it('shows total cumulative return correctly', () => {
    const r = config.calculate({
      inputMode: 'annual',
      returnsInput: '10, 10',
    });

    const totalReturn = parsePercent(getValue(r, 'totalReturn'));
    // 1.1 * 1.1 - 1 = 0.21 = 21%
    expect(totalReturn).toBeGreaterThan(20);
    expect(totalReturn).toBeLessThan(22);
  });

  it('handles very large positive returns without crashing', () => {
    const r = config.calculate({
      inputMode: 'annual',
      returnsInput: '500, -80, 200, -50, 300',
    });

    const results = r.map((x) => x.id);
    expect(results).toContain('cagr');
    expect(results).toContain('simpleAvg');
  });

  it('handles all negative returns gracefully', () => {
    const r = config.calculate({
      inputMode: 'annual',
      returnsInput: '-5, -10, -3, -8, -12',
    });

    const cagrVal = parsePercent(getValue(r, 'cagr'));
    expect(cagrVal).toBeLessThan(0);
    expect(getValue(r, 'positiveYears')).toContain('0 of 5');
  });
});

describe('Average Return Calculator — Utility Functions', () => {
  it('cagr utility returns correct value', () => {
    const result = cagr(10000, 18000, 5);
    expect(result).toBeGreaterThan(0.12);
    expect(result).toBeLessThan(0.13);
  });

  it('cagr utility returns 0 for invalid inputs', () => {
    expect(cagr(0, 10000, 5)).toBe(0);
    expect(cagr(10000, 20000, 0)).toBe(0);
    expect(cagr(-100, 10000, 5)).toBe(0);
  });

  it('arithmeticAverage utility computes correctly', () => {
    const result = arithmeticAverage([0.12, 0.08, 0.15, -0.03, 0.10]);
    expect(result).toBeCloseTo(0.084, 3);
  });

  it('arithmeticAverage returns 0 for empty array', () => {
    expect(arithmeticAverage([])).toBe(0);
  });
});

describe('Average Return Calculator — Default Values (Demo Mode)', () => {
  it('shows results with default values (simple mode)', () => {
    const r = config.calculate({
      inputMode: 'simple',
      startingValue: '10000',
      endingValue: '18000',
      years: '5',
    });

    expect(r.length).toBeGreaterThan(0);
    expect(getValue(r, 'cagr')).toBeTruthy();
  });

  it('shows results with default values (annual mode)', () => {
    const r = config.calculate({
      inputMode: 'annual',
      returnsInput: '12, -5, 8, 15, 3',
    });

    expect(r.length).toBeGreaterThan(0);
    expect(getValue(r, 'cagr')).toBeTruthy();
  });
});
