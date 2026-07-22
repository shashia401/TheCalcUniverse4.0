import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/inflation/index';
import { getValue, parseNumber, parseMoney, near } from '../../helpers';

describe('inflation', () => {
  it('adjusts amount forward in time', () => {
    const r = config.calculate({
      amount: '100',
      startYear: '1990',
      endYear: '2020',
    });
    expect(r).toHaveLength(6);
    // CPI in 1990 = 130.7, CPI in 2020 = 258.8
    // adjustedAmount = 100 / 130.7 * 258.8 ≈ 198.01
    expect(parseMoney(getValue(r, 'adjustedAmount'))).toBeGreaterThan(100);
    expect(parseNumber(getValue(r, 'cumulativeRate'))).toBeGreaterThan(0);
    expect(parseNumber(getValue(r, 'avgAnnualRate'))).toBeGreaterThan(0);
  });

  it('returns empty for zero amount', () => {
    const r = config.calculate({
      amount: '0',
      startYear: '1990',
      endYear: '2020',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for missing required fields', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('adjusts amount backward in time (past purchasing power)', () => {
    const r = config.calculate({
      amount: '100',
      startYear: '2020',
      endYear: '1990',
    });
    expect(r).toHaveLength(6);
    // $100 in 2020 was worth less in 1990 (inverted)
    expect(getValue(r, 'adjustedAmount')).toBeTruthy();
    // Cumulative inflation should be negative for reverse
    expect(parseNumber(getValue(r, 'cumulativeRate'))).toBeLessThan(0);
  });

  it('shows zero inflation for same year', () => {
    const r = config.calculate({
      amount: '100',
      startYear: '2000',
      endYear: '2000',
    });
    expect(r).toHaveLength(6);
    near(parseMoney(getValue(r, 'adjustedAmount')), 100);
    near(parseNumber(getValue(r, 'cumulativeRate')), 0);
    near(parseNumber(getValue(r, 'avgAnnualRate')), 0);
  });

  it('handles large amounts', () => {
    const r = config.calculate({
      amount: '1000000',
      startYear: '1980',
      endYear: '2000',
    });
    expect(r).toHaveLength(6);
    expect(parseMoney(getValue(r, 'adjustedAmount'))).toBeGreaterThan(1000000);
  });

  it('shows purchasing power indicator', () => {
    const r = config.calculate({
      amount: '100',
      startYear: '2000',
      endYear: '2020',
    });
    expect(getValue(r, 'purchasingPower')).toContain('%');
  });
});
