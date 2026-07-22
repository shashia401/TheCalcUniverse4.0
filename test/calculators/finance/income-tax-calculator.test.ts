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
    // Taxable income: 75000 - 15000 (std deduction, single) = 60000
    // 10% on first 11925 = 1192.50
    // 12% on 11925-48475 = 4386.00
    // 22% on 48475-60000 = 2535.50
    // Total federal: 1192.50 + 4386.00 + 2535.50 = 8114.00
    near(parseMoney(getValue(r, 'netPay')), 75000 - 8114 - (75000 * 0.062) - (75000 * 0.0145), 10);
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
    // MFJ std deduction: 30000
    // Taxable: 150000 - 30000 = 120000
    // Should be in the 12% marginal rate bracket
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
    // HoH std deduction: 22500
    // Taxable: 80000 - 22500 = 57500
    expect(parseMoney(getValue(r, 'netPay'))).toBeGreaterThan(0);
  });
});
