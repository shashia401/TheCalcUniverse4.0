import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/tax-calculator/index';
import { getValue, parseMoney, parsePercent } from '../../helpers';

describe('tax-calculator', () => {
  it('calculates tax for $75K annual income single filer', () => {
    const r = config.calculate({
      annualIncome: '75000',
      filingStatus: 'Single',
      preTaxDeductions: '0',
      withholding: '0',
    });

    expect(r.length).toBeGreaterThan(0);

    // Taxable: $75,000 - $16,100 (2026 std deduction) = $58,900
    // 10% bracket: $12,400 x 0.10 = $1,240.00
    // 12% bracket: ($50,400-$12,400) x 0.12 = $38,000 x 0.12 = $4,560.00
    // 22% bracket: ($58,900 - $50,400) x 0.22 = $8,500 x 0.22 = $1,870.00
    // Total: $1,240.00 + $4,560.00 + $1,870.00 = $7,670.00
    const expectedTotal = 1240.00 + 4560.00 + 1870.00;
    near(parseMoney(getValue(r, 'totalTax')), expectedTotal, 0.01);

    near(parseMoney(getValue(r, 'taxableIncome')), 58900, 0.01);

    // Effective rate = $7,670 / $75,000 = 10.2267%
    near(parsePercent(getValue(r, 'effectiveRate')), 10.23, 0.1);

    // Marginal rate should be 22%
    near(parsePercent(getValue(r, 'marginalRate')), 22, 0.1);
  });

  it('single filer in 10% bracket — only first bracket applies', () => {
    const r = config.calculate({
      annualIncome: '20000',
      filingStatus: 'Single',
      preTaxDeductions: '0',
      withholding: '0',
    });

    // Taxable: $20,000 - $16,100 = $3,900
    // All in 10% bracket: $3,900 x 0.10 = $390
    near(parseMoney(getValue(r, 'totalTax')), 390, 0.01);
    near(parsePercent(getValue(r, 'effectiveRate')), 1.95, 0.01);
    near(parsePercent(getValue(r, 'marginalRate')), 10, 0.01);
  });

  it('single filer in 22% bracket — spans three brackets', () => {
    const r = config.calculate({
      annualIncome: '80000',
      filingStatus: 'Single',
      preTaxDeductions: '0',
      withholding: '0',
    });

    // Taxable: $80,000 - $16,100 = $63,900
    // 10%: $12,400 x 0.10 = $1,240.00
    // 12%: ($50,400 - $12,400) x 0.12 = $38,000 x 0.12 = $4,560.00
    // 22%: ($63,900 - $50,400) x 0.22 = $13,500 x 0.22 = $2,970.00
    // Total: $8,770.00
    // Effective rate: $8,770 / $80,000 = 10.9625%
    const expectedTax = 1240.00 + 4560.00 + 2970.00;
    near(parseMoney(getValue(r, 'totalTax')), expectedTax, 0.01);
    near(parsePercent(getValue(r, 'effectiveRate')), 10.96, 0.1);
    near(parsePercent(getValue(r, 'marginalRate')), 22, 0.01);
  });

  it('married filing jointly — different bracket thresholds', () => {
    const r = config.calculate({
      annualIncome: '150000',
      filingStatus: 'Married Filing Jointly',
      preTaxDeductions: '0',
      withholding: '0',
    });

    // Taxable: $150,000 - $32,200 = $117,800
    // 10%: $24,800 x 0.10 = $2,480.00
    // 12%: ($100,800 - $24,800) x 0.12 = $76,000 x 0.12 = $9,120.00
    // 22%: ($117,800 - $100,800) x 0.22 = $17,000 x 0.22 = $3,740.00
    // Total: $15,340.00
    // Effective rate: $15,340 / $150,000 = 10.2267%
    const expectedTax = 2480.00 + 9120.00 + 3740.00;
    near(parseMoney(getValue(r, 'totalTax')), expectedTax, 0.01);
    near(parsePercent(getValue(r, 'marginalRate')), 22, 0.01);
  });

  it('withholding shows refund when tax paid exceeds liability', () => {
    const r = config.calculate({
      annualIncome: '75000',
      filingStatus: 'Single',
      preTaxDeductions: '0',
      withholding: '10000',
    });

    // Total tax: $7,670
    // Withholding: $10,000
    // Refund: $2,330
    const refundValue = getValue(r, 'taxAfterWithholding');
    near(parseMoney(refundValue), 2330, 0.01);

    const refundLabel = r.find((x) => x.id === 'taxAfterWithholding')?.label ?? '';
    expect(refundLabel).toContain('Refund');
  });

  it('withholding shows balance due when tax paid is less than liability', () => {
    const r = config.calculate({
      annualIncome: '75000',
      filingStatus: 'Single',
      preTaxDeductions: '0',
      withholding: '5000',
    });

    // Total tax: $7,670
    // Withholding: $5,000
    // Balance due: $2,670
    near(parseMoney(getValue(r, 'taxAfterWithholding')), 2670, 0.01);

    const label = r.find((x) => x.id === 'taxAfterWithholding')?.label ?? '';
    expect(label).toContain('Balance Due');
  });

  it('returns empty for invalid income', () => {
    const r = config.calculate({
      annualIncome: '',
      filingStatus: 'Single',
      preTaxDeductions: '0',
      withholding: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for negative income', () => {
    const r = config.calculate({
      annualIncome: '-100',
      filingStatus: 'Single',
      preTaxDeductions: '0',
      withholding: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for non-numeric income', () => {
    const r = config.calculate({
      annualIncome: 'abc',
      filingStatus: 'Single',
      preTaxDeductions: '0',
      withholding: '0',
    });
    expect(r).toEqual([]);
  });

  it('handles zero income', () => {
    const r = config.calculate({
      annualIncome: '0',
      filingStatus: 'Single',
      preTaxDeductions: '0',
      withholding: '0',
    });

    expect(r.length).toBeGreaterThan(0);
    near(parseMoney(getValue(r, 'totalTax')), 0, 0.01);
    near(parseMoney(getValue(r, 'taxableIncome')), 0, 0.01);
    near(parsePercent(getValue(r, 'effectiveRate')), 0, 0.01);
    near(parsePercent(getValue(r, 'marginalRate')), 0, 0.01);
  });

  it('handles very high income over $1M', () => {
    const r = config.calculate({
      annualIncome: '1000000',
      filingStatus: 'Single',
      preTaxDeductions: '0',
      withholding: '0',
    });

    // Taxable: $1,000,000 - $15,000 = $985,000
    // Should fall into the 37% bracket
    const totalTax = parseMoney(getValue(r, 'totalTax'));
    expect(totalTax).toBeGreaterThan(300000);

    const marginalRate = parsePercent(getValue(r, 'marginalRate'));
    expect(marginalRate).toBe(37);
  });

  it('pre-tax deductions reduce taxable income', () => {
    const r = config.calculate({
      annualIncome: '75000',
      filingStatus: 'Single',
      preTaxDeductions: '5000',
      withholding: '0',
    });

    // Taxable: $75,000 - $16,100 - $5,000 = $53,900
    near(parseMoney(getValue(r, 'taxableIncome')), 53900, 0.01);
  });

  it('head of household uses correct deduction and brackets', () => {
    const r = config.calculate({
      annualIncome: '100000',
      filingStatus: 'Head of Household',
      preTaxDeductions: '0',
      withholding: '0',
    });

    // Taxable: $100,000 - $24,150 = $75,850
    near(parseMoney(getValue(r, 'taxableIncome')), 75850, 0.01);
    expect(parseMoney(getValue(r, 'totalTax'))).toBeGreaterThan(0);
  });

  it('married filing separately uses correct deduction and brackets', () => {
    const r = config.calculate({
      annualIncome: '100000',
      filingStatus: 'Married Filing Separately',
      preTaxDeductions: '0',
      withholding: '0',
    });

    // Taxable: $100,000 - $16,100 = $83,900
    near(parseMoney(getValue(r, 'taxableIncome')), 83900, 0.01);
    expect(parseMoney(getValue(r, 'totalTax'))).toBeGreaterThan(0);
  });

  it('educational content meets minimum requirements', () => {
    const edu = config.educational;

    // formula
    expect(edu.formula).toBeTruthy();
    expect(edu.formula!.length).toBeGreaterThan(0);

    // formulaDescription >= 100 chars
    expect(edu.formulaDescription).toBeTruthy();
    expect(edu.formulaDescription!.length).toBeGreaterThanOrEqual(100);

    // 5 variables
    expect(edu.variables).toHaveLength(5);

    // 3 howToUse steps
    expect(edu.howToUse).toHaveLength(3);

    // explanation >= 400 chars
    expect(edu.explanation).toBeTruthy();
    expect(edu.explanation!.length).toBeGreaterThanOrEqual(400);

    // 5 FAQs
    expect(edu.faqs).toHaveLength(5);

    // 2 citations
    expect(edu.citations).toHaveLength(2);

    // SVG diagram
    expect(edu.diagram).toBeTruthy();
    expect(edu.diagram!.svg).toContain('viewBox="0 0 440 340"');

    // quickReference with 7 brackets
    expect(edu.quickReference).toHaveLength(7);

    // commonUses with 3 items
    expect(edu.commonUses).toHaveLength(3);
  });
});

/** Floating-point assertion helper */
function near(actual: number, expected: number, tol = 0.01): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tol);
}
