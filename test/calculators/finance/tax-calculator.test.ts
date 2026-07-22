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

    // Taxable: $75,000 - $15,000 (std deduction) = $60,000
    // 10% bracket: min($11,925, $60,000) x 0.10 = $1,192.50
    // 12% bracket: min($48,475-$11,925, $60,000-$11,925) x 0.12 = $36,550 x 0.12 = $4,386.00
    // 22% bracket: ($60,000 - $48,475) x 0.22 = $11,525 x 0.22 = $2,535.50
    // Total: $1,192.50 + $4,386.00 + $2,535.50 = $8,114.00
    const expectedTotal = 1192.50 + 4386.00 + 2535.50;
    near(parseMoney(getValue(r, 'totalTax')), expectedTotal, 0.01);

    near(parseMoney(getValue(r, 'taxableIncome')), 60000, 0.01);

    // Effective rate = $8,114 / $75,000 = 10.8187%
    near(parsePercent(getValue(r, 'effectiveRate')), 10.82, 0.1);

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

    // Taxable: $20,000 - $15,000 = $5,000
    // All in 10% bracket: $5,000 x 0.10 = $500
    near(parseMoney(getValue(r, 'totalTax')), 500, 0.01);
    near(parsePercent(getValue(r, 'effectiveRate')), 2.50, 0.01);
    near(parsePercent(getValue(r, 'marginalRate')), 10, 0.01);
  });

  it('single filer in 22% bracket — spans three brackets', () => {
    const r = config.calculate({
      annualIncome: '80000',
      filingStatus: 'Single',
      preTaxDeductions: '0',
      withholding: '0',
    });

    // Taxable: $80,000 - $15,000 = $65,000
    // 10%: $11,925 x 0.10 = $1,192.50
    // 12%: ($48,475 - $11,925) x 0.12 = $36,550 x 0.12 = $4,386.00
    // 22%: ($65,000 - $48,475) x 0.22 = $16,525 x 0.22 = $3,635.50
    // Total: $9,214.00
    // Effective rate: $9,214 / $80,000 = 11.5175%
    const expectedTax = 1192.50 + 4386.00 + 3635.50;
    near(parseMoney(getValue(r, 'totalTax')), expectedTax, 0.01);
    near(parsePercent(getValue(r, 'effectiveRate')), 11.52, 0.1);
    near(parsePercent(getValue(r, 'marginalRate')), 22, 0.01);
  });

  it('married filing jointly — different bracket thresholds', () => {
    const r = config.calculate({
      annualIncome: '150000',
      filingStatus: 'Married Filing Jointly',
      preTaxDeductions: '0',
      withholding: '0',
    });

    // Taxable: $150,000 - $30,000 = $120,000
    // 10%: $23,850 x 0.10 = $2,385.00
    // 12%: ($96,950 - $23,850) x 0.12 = $73,100 x 0.12 = $8,772.00
    // 22%: ($120,000 - $96,950) x 0.22 = $23,050 x 0.22 = $5,071.00
    // Total: $16,228.00
    // Effective rate: $16,228 / $150,000 = 10.8187%
    const expectedTax = 2385.00 + 8772.00 + 5071.00;
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

    // Total tax: $8,114
    // Withholding: $10,000
    // Refund: $1,886
    const refundValue = getValue(r, 'taxAfterWithholding');
    near(parseMoney(refundValue), 1886, 0.01);

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

    // Total tax: $8,114
    // Withholding: $5,000
    // Balance due: $3,114
    near(parseMoney(getValue(r, 'taxAfterWithholding')), 3114, 0.01);

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

    // Taxable: $75,000 - $15,000 - $5,000 = $55,000
    near(parseMoney(getValue(r, 'taxableIncome')), 55000, 0.01);
  });

  it('head of household uses correct deduction and brackets', () => {
    const r = config.calculate({
      annualIncome: '100000',
      filingStatus: 'Head of Household',
      preTaxDeductions: '0',
      withholding: '0',
    });

    // Taxable: $100,000 - $22,500 = $77,500
    near(parseMoney(getValue(r, 'taxableIncome')), 77500, 0.01);
    expect(parseMoney(getValue(r, 'totalTax'))).toBeGreaterThan(0);
  });

  it('married filing separately uses correct deduction and brackets', () => {
    const r = config.calculate({
      annualIncome: '100000',
      filingStatus: 'Married Filing Separately',
      preTaxDeductions: '0',
      withholding: '0',
    });

    // Taxable: $100,000 - $15,000 = $85,000
    near(parseMoney(getValue(r, 'taxableIncome')), 85000, 0.01);
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
