import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/income-tax/index';
import { getValue, parseNumber, parseMoney, near } from '../../helpers';

describe('income-tax', () => {
  it('calculates tax for single filer with standard deduction', () => {
    const r = config.calculate({
      grossIncome: '75000',
      filingStatus: 'single',
      state: 'TX',
    });
    expect(r).toHaveLength(10);
    // Taxable income: 75000 - 16100 (2026 std deduction, single) = 58900
    // 10% on first 12400 = 1240.00
    // 12% on 12400-50400 = 4560.00
    // 22% on 50400-58900 = 1870.00
    // Total federal: 1240.00 + 4560.00 + 1870.00 = 7670.00
    near(parseMoney(getValue(r, 'netPay')), 75000 - 7670 - (75000 * 0.062) - (75000 * 0.0145), 10);
    expect(parseNumber(getValue(r, 'marginalRate'))).toBe(22);
  });

  it('returns empty for zero gross income', () => {
    const r = config.calculate({
      grossIncome: '0',
      filingStatus: 'single',
      state: 'TX',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for missing required fields', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('calculates for married filing jointly with higher standard deduction', () => {
    const r = config.calculate({
      grossIncome: '150000',
      filingStatus: 'mfj',
      state: 'TX',
    });
    expect(r).toHaveLength(10);
    // MFJ std deduction (2026): 32200
    // Taxable: 150000 - 32200 = 117800 (in the 22% marginal rate bracket)
    expect(parseMoney(getValue(r, 'netPay'))).toBeGreaterThan(0);
  });

  it('includes 401k contribution reducing taxable income', () => {
    const no401k = config.calculate({
      grossIncome: '75000',
      filingStatus: 'single',
      state: 'TX',
    });
    const with401k = config.calculate({
      grossIncome: '75000',
      filingStatus: 'single',
      state: 'TX',
      retirement401k: '10000',
    });
    // Net pay should include the 401k contribution (pre-tax, so it reduces federal tax)
    // The with401k netPay = gross - totalTax - retirement - health - otherPreTax
    // The no401k netPay = gross - totalTax (no deductions)
    // Both values differ because taxable income differs
    const netNo401k = parseMoney(getValue(no401k, 'netPay'));
    const netWith401k = parseMoney(getValue(with401k, 'netPay'));
    // Tax savings partially offset the 401k contribution
    expect(netWith401k).toBeLessThan(netNo401k);
    expect(netWith401k).toBeGreaterThan(netNo401k - 10000); // tax savings prevent full 10k reduction
  });

  it('shows no state income tax for Texas', () => {
    const r = config.calculate({
      grossIncome: '75000',
      filingStatus: 'single',
      state: 'TX',
    });
    expect(getValue(r, 'stateTax')).toContain('No state income tax');
  });

  it('calculates state tax for California', () => {
    const r = config.calculate({
      grossIncome: '100000',
      filingStatus: 'single',
      state: 'CA',
    });
    expect(r).toHaveLength(10);
    const stateTaxResult = r.find(x => x.id === 'stateTax');
    expect(stateTaxResult).toBeDefined();
    expect(stateTaxResult!.value).not.toContain('No state income tax');
    expect(parseMoney(getValue(r, 'netPay'))).toBeGreaterThan(0);
  });

  it('calculates for head of household', () => {
    const r = config.calculate({
      grossIncome: '80000',
      filingStatus: 'hoh',
      state: 'FL',
    });
    expect(r).toHaveLength(10);
    // HoH std deduction (2026): 24150
    // Taxable: 80000 - 24150 = 55850
    expect(parseMoney(getValue(r, 'netPay'))).toBeGreaterThan(0);
  });

  it('matches the "Jake" worked example figures (regression: educational text previously used stale 2025 tax brackets/deduction; the shared 2026 data now puts him in the 12% bracket, not 22%)', () => {
    const r = config.calculate({
      grossIncome: '75000',
      filingStatus: 'single',
      state: 'TX',
      retirement401k: '6000',
      healthInsurance: '3000',
      otherPreTax: '0',
    });
    expect(getValue(r, 'taxableIncome')).toContain('49,900');
    expect(parseNumber(getValue(r, 'marginalRate'))).toBe(12);
    near(parseNumber(getValue(r, 'federalTax')), 5740, 5);
  });

  it('matches the "Thompsons" worked example figures (regression: educational text previously used the stale 2025 MFJ standard deduction of $30,000 instead of the 2026 figure of $32,200)', () => {
    const r = config.calculate({
      grossIncome: '185000',
      filingStatus: 'mfj',
      state: 'OR',
      retirement401k: '20000',
      healthInsurance: '6000',
      otherPreTax: '4000',
    });
    expect(getValue(r, 'taxableIncome')).toContain('122,800');
    near(parseNumber(getValue(r, 'federalTax')), 16440, 5);
  });
});
