import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/pension/index';
import { getValue, parseMoney, parseNumber } from '../../helpers';

describe('pension calculator', () => {
  it('projects balance with growth and contributions', () => {
    // Age 35 → 65 (30 years), $50K starting, $500/mo, 6% growth
    const r = config.calculate({
      currentAge: '35',
      retirementAge: '65',
      currentBalance: '50000',
      monthlyContribution: '500',
      growthRate: '6',
      inflationAdjust: 'nominal',
    });
    const balance = parseMoney(getValue(r, 'projectedBalance'));
    // Manual check: year 1 = 50000*1.06 + 6000 = 59000
    // year 30: let's verify approximate magnitude
    expect(balance).toBeGreaterThan(500000); // should be well over $500K
    expect(balance).toBeLessThan(2000000);   // sanity upper bound
    expect(parseMoney(getValue(r, 'totalContributions'))).toBe(50000 + 500 * 12 * 30);
  });

  it('zero growth means contributions only', () => {
    const r = config.calculate({
      currentAge: '40',
      retirementAge: '65',
      currentBalance: '20000',
      monthlyContribution: '300',
      growthRate: '0',
      inflationAdjust: 'nominal',
    });
    const expected = 20000 + 300 * 12 * 25; // 25 years
    expect(parseMoney(getValue(r, 'projectedBalance'))).toBe(expected);
    expect(parseMoney(getValue(r, 'totalGrowth'))).toBe(0);
  });

  it('returns empty when retirement age <= current age', () => {
    const r = config.calculate({
      currentAge: '50',
      retirementAge: '40',
      currentBalance: '100000',
      monthlyContribution: '500',
      growthRate: '6',
      inflationAdjust: 'nominal',
    });
    expect(r).toEqual([]);
  });

  it('returns empty when currentBalance is negative', () => {
    const r = config.calculate({
      currentAge: '30',
      retirementAge: '65',
      currentBalance: '-100',
      monthlyContribution: '500',
      growthRate: '6',
      inflationAdjust: 'nominal',
    });
    expect(r).toEqual([]);
  });

  it('returns empty when required fields are missing', () => {
    const r = config.calculate({
      currentAge: '',
      retirementAge: '',
      currentBalance: '',
      monthlyContribution: '',
      growthRate: '',
      inflationAdjust: 'nominal',
    });
    expect(r).toEqual([]);
  });

  it('shows inflation-adjusted values when toggle is on', () => {
    const r = config.calculate({
      currentAge: '30',
      retirementAge: '60',
      currentBalance: '100000',
      monthlyContribution: '1000',
      growthRate: '7',
      inflationAdjust: 'adjusted',
    });
    expect(getValue(r, 'inflationAdjusted')).toBeDefined();
    expect(getValue(r, 'monthlyPayoutAdj')).toBeDefined();
    const nominal = parseMoney(getValue(r, 'projectedBalance'));
    const adjusted = parseMoney(getValue(r, 'inflationAdjusted'));
    expect(adjusted).toBeLessThan(nominal); // inflation-adjusted is always lower
  });

  it('shows monthly payout using 4% rule', () => {
    const r = config.calculate({
      currentAge: '35',
      retirementAge: '65',
      currentBalance: '500000',
      monthlyContribution: '0',
      growthRate: '0',
      inflationAdjust: 'nominal',
    });
    // 500K * 0.04 / 12 = $1,666.67/mo
    const payoutStr = getValue(r, 'monthlyPayout4pct');
    const payout = parseMoney(payoutStr.replace('/mo', ''));
    expect(payout).toBeCloseTo(1666.67, 0);
  });

  it('shows projection period', () => {
    const r = config.calculate({
      currentAge: '45',
      retirementAge: '67',
      currentBalance: '200000',
      monthlyContribution: '700',
      growthRate: '5.5',
      inflationAdjust: 'nominal',
    });
    expect(getValue(r, 'projectionSpan')).toContain('22 years');
    expect(getValue(r, 'projectionSpan')).toContain('Age 45 → 67');
  });

  it('matches manual year-by-year calculation', () => {
    const r = config.calculate({
      currentAge: '30',
      retirementAge: '32', // 2 years for easy manual check
      currentBalance: '10000',
      monthlyContribution: '500',
      growthRate: '10',
      inflationAdjust: 'nominal',
    });
    // Year 1: 10000 * 1.10 + 6000 = 17000
    // Year 2: 17000 * 1.10 + 6000 = 24700
    expect(parseMoney(getValue(r, 'projectedBalance'))).toBeCloseTo(24700, 0);
    expect(parseMoney(getValue(r, 'totalContributions'))).toBe(10000 + 500 * 12 * 2);
  });
});
