import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/down-payment/index';
import { getValue, parseMoney, parseNumber } from '../../helpers';

describe('down payment calculator', () => {
  it('calculates target down payment correctly', () => {
    const r = config.calculate({
      homePrice: '350000',
      targetDownPct: '20',
      currentSavings: '20000',
      monthlySavings: '1500',
      expectedReturn: '4',
    });
    const target = parseMoney(getValue(r, 'targetDownPayment'));
    expect(target).toBeCloseTo(70000, -2);
  });

  it('shows PMI warning when under 20% down', () => {
    const r = config.calculate({
      homePrice: '300000',
      targetDownPct: '5',
      currentSavings: '10000',
      monthlySavings: '500',
      expectedReturn: '3',
    });
    expect(getValue(r, 'pmiWarning')).toContain('Yes');
  });

  it('calculates months to reach savings goal', () => {
    const r = config.calculate({
      homePrice: '200000',
      targetDownPct: '20',
      currentSavings: '10000',
      monthlySavings: '2000',
      expectedReturn: '0',
    });
    // Target = 40K. Gap = 30K. At $2000/mo, 15 months
    const months = parseNumber(getValue(r, 'monthsToGoal'));
    expect(months).toBeGreaterThan(0);
  });

  it('returns empty for invalid inputs', () => {
    const r = config.calculate({
      homePrice: '',
      targetDownPct: '20',
      currentSavings: '20000',
      monthlySavings: '1500',
      expectedReturn: '4',
    });
    expect(r).toEqual([]);
  });
});
