import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/tax-calculator/index';
import { computeFederalTax } from '../../../src/calculators/finance/tax-calculator/taxCalcMath';
import { getValue, parseMoney, near } from '../../helpers';

// 2026 (Rev. Proc. 2025-32): single 10% to 12,400, 12% to 50,400, 22% to 105,700; MFJ 10% to 24,800, 12% to 100,800.
const base = { annualIncome: '75000', filingStatus: 'Single', preTaxDeductions: '0', withholding: '0' };

describe('tax-calculator audit', () => {
  it('explanation example: 100,000 taxable (single) = 1,240 + 4,560 + 10,912 = 16,712 (16.7% effective)', () => {
    // income 116,100 - 16,100 standard deduction = 100,000 taxable
    const r = config.calculate({ ...base, annualIncome: '116100' });
    expect(getValue(r, 'totalTax')).toBe('$16,712.00');
    expect(getValue(r, 'effectiveRate')).toBe('14.39%'); // 16,712 / 116,100 (of gross)
    expect(getValue(r, 'marginalRate')).toBe('22.00%');
  });

  it('worked example David: 75,000 single -> taxable 58,900, tax 7,670, 10.23%', () => {
    const r = config.calculate(base);
    expect(getValue(r, 'taxableIncome')).toBe('$58,900.00');
    expect(getValue(r, 'totalTax')).toBe('$7,670.00');
    expect(getValue(r, 'effectiveRate')).toBe('10.23%');
  });

  it('worked example Priya and Raj: MFJ 180,000, 10,000 pre-tax, 28,000 withheld -> tax 19,740, refund 8,260', () => {
    // taxable 137,800 = 24,800 x 10% + 76,000 x 12% + 37,000 x 22%
    const r = config.calculate({ annualIncome: '180000', filingStatus: 'Married Filing Jointly', preTaxDeductions: '10000', withholding: '28000' });
    expect(getValue(r, 'taxableIncome')).toBe('$137,800.00');
    expect(getValue(r, 'totalTax')).toBe('$19,740.00');
    expect(getValue(r, 'effectiveRate')).toBe('10.97%');
    expect(r.find((x) => x.id === 'taxAfterWithholding')!.label).toMatch(/Refund/);
    near(parseMoney(getValue(r, 'taxAfterWithholding')), 8260, 0.01);
  });

  it('bracket breakdown follows the filing status (regression: the panel used 2025 single brackets for everyone)', () => {
    const mfj = computeFederalTax({ annualIncome: '180000', filingStatus: 'Married Filing Jointly', preTaxDeductions: '10000' })!;
    expect(mfj.brackets.map((b) => [b.rate, Math.round(b.incomeInBracket)])).toEqual([[0.1, 24800], [0.12, 76000], [0.22, 37000]]);
    const hoh = computeFederalTax({ annualIncome: '80000', filingStatus: 'Head of Household' })!;
    expect(hoh.standardDeduction).toBe(24150);
    expect(hoh.brackets[0].incomeInBracket).toBe(17700); // HOH 10% bracket ends at 17,700
  });

  it('standard deductions by status (FAQ): 16,100 / 32,200 / 24,150 / 16,100 MFS', () => {
    const d = (s: string) => computeFederalTax({ annualIncome: '100000', filingStatus: s })!.standardDeduction;
    expect([d('Single'), d('Married Filing Jointly'), d('Head of Household'), d('Married Filing Separately')]).toEqual([16100, 32200, 24150, 16100]);
  });

  it('income below the deduction and zero income owe nothing without NaN', () => {
    const r = config.calculate({ ...base, annualIncome: '10000' });
    expect(getValue(r, 'totalTax')).toBe('$0.00');
    expect(getValue(r, 'marginalRate')).toBe('0.00%');
    expect(getValue(config.calculate({ ...base, annualIncome: '0' }), 'effectiveRate')).toBe('0.00%');
  });

  it('a raise never lowers take-home: tax at 105,701 taxable is exactly 24 cents higher than at 105,700', () => {
    const at = (taxable: number) => computeFederalTax({ annualIncome: String(taxable + 16100), filingStatus: 'Single' })!.totalTax;
    near(at(105701) - at(105700), 0.24, 1e-6);
  });
});
