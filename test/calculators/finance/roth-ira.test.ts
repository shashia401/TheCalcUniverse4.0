import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/roth-ira/index';
import { getValue, parseMoney, parseNumber, near } from '../../helpers';

describe('roth-ira', () => {
  it('calculates tax-free balance with annual contributions', () => {
    const r = config.calculate({
      currentAge: '30',
      retirementAge: '65',
      currentBalance: '15000',
      annualContribution: '7500',
      annualReturn: '7',
      marginalTaxRate: '22',
    });
    // Years = 35
    // FV = 15000*(1.07)^35 + 7500*((1.07)^35 - 1)/0.07
    const years = 35;
    const expectedFV =
      15000 * Math.pow(1.07, years) +
      7500 * ((Math.pow(1.07, years) - 1) / 0.07);
    // Fmt uses "M" format for values >= $1M, tolerance accounts for rounding
    near(parseMoney(getValue(r, 'taxFreeTotal')), expectedFV, 10000);
    expect(getValue(r, 'annualContribResult')).toContain('$7,500/yr');
    expect(getValue(r, 'years')).toContain('35');
  });

  it('flags over-limit contributions', () => {
    const r = config.calculate({
      currentAge: '30',
      retirementAge: '65',
      currentBalance: '0',
      annualContribution: '10000', // exceeds $7,500 limit for under 50
      annualReturn: '7',
      marginalTaxRate: '22',
    });
    // Should have a limitWarning
    const hasWarning = r.some((x) => x.id === 'limitWarning');
    expect(hasWarning).toBe(true);
    expect(getValue(r, 'limitWarning')).toContain('exceeds');
    // Calculation should use max $7,500, not $10,000
    expect(getValue(r, 'annualContribResult')).toContain('$7,500/yr');
  });

  it('applies catch-up contribution at age 50+', () => {
    const r = config.calculate({
      currentAge: '55',
      retirementAge: '65',
      currentBalance: '100000',
      annualContribution: '8600',
      annualReturn: '7',
      marginalTaxRate: '22',
    });
    // Max catch-up: 7500 + 1100 = 8600. So 8600 is at limit.
    expect(getValue(r, 'annualContribResult')).toContain('$8,600/yr');
    // No warning since 8600 <= 8600
    const hasWarning = r.some((x) => x.id === 'limitWarning');
    expect(hasWarning).toBe(false);
  });

  it('catch-up contribution flags over limit', () => {
    const r = config.calculate({
      currentAge: '55',
      retirementAge: '65',
      currentBalance: '100000',
      annualContribution: '9000', // exceeds 8600
      annualReturn: '7',
      marginalTaxRate: '22',
    });
    expect(getValue(r, 'limitWarning')).toContain('exceeds');
    // Should cap at 8600
    expect(getValue(r, 'annualContribResult')).toContain('$8,600/yr');
  });

  it('shows tax savings vs traditional IRA', () => {
    const r = config.calculate({
      currentAge: '30',
      retirementAge: '65',
      currentBalance: '15000',
      annualContribution: '7500',
      annualReturn: '7',
      marginalTaxRate: '22',
      expectedRetirementTaxRate: '12',
    });
    // taxSavingsVsTraditional = totalEarnings * retirementTaxRate
    const totalEarnings = parseMoney(getValue(r, 'totalEarnings'));
    const taxSavings = parseMoney(getValue(r, 'taxSavingsVsTraditional'));
    near(taxSavings, totalEarnings * 0.12, 10000);
  });

  it('growth ratio increases with longer investment horizon', () => {
    const r = config.calculate({
      currentAge: '25',
      retirementAge: '65',
      currentBalance: '10000',
      annualContribution: '7500',
      annualReturn: '7',
      marginalTaxRate: '22',
    });
    const growthRatio = parseNumber(getValue(r, 'growthRatio'));
    // With 40 years of compounding, growth should dominate
    expect(growthRatio).toBeGreaterThan(50);
  });

  it('returns empty for empty inputs', () => {
    const r = config.calculate({});
    expect(r).toHaveLength(0);
  });

  it('returns empty when retirement age <= current age', () => {
    const r = config.calculate({
      currentAge: '65',
      retirementAge: '60',
      currentBalance: '15000',
      annualContribution: '7500',
      annualReturn: '7',
      marginalTaxRate: '22',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for missing age', () => {
    const r = config.calculate({
      currentAge: '',
      retirementAge: '65',
      currentBalance: '15000',
      annualContribution: '7500',
      annualReturn: '7',
      marginalTaxRate: '22',
    });
    expect(r).toHaveLength(0);
  });
});
