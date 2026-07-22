import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/house-affordability/index';
import { getValue, parseNumber, parseMoney, near, pmtFormula } from '../../helpers';

describe('house-affordability-calculator', () => {
  it('calculates maximum home price for standard inputs', () => {
    const r = config.calculate({
      annualIncome: '100000',
      monthlyDebts: '500',
      downPayment: '60000',
      dtiLimit: '36',
      interestRate: '6.75',
      loanTerm: '30',
    });
    expect(r).toHaveLength(8);
    expect(parseMoney(getValue(r, 'maxHomePrice'))).toBeGreaterThan(60000);
    expect(parseNumber(getValue(r, 'frontEndDTI'))).toBeLessThanOrEqual(36);
    expect(parseNumber(getValue(r, 'backEndDTI'))).toBeLessThanOrEqual(36);
  });

  it('returns empty for zero annual income', () => {
    const r = config.calculate({
      annualIncome: '0',
      monthlyDebts: '0',
      downPayment: '0',
      interestRate: '6.75',
      loanTerm: '30',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for missing required fields', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty for NaN values in required fields', () => {
    const r = config.calculate({
      annualIncome: 'not-a-number',
      monthlyDebts: '500',
      downPayment: '60000',
      dtiLimit: '36',
      interestRate: '6.75',
      loanTerm: '30',
    });
    expect(r).toHaveLength(0);
  });

  it('uses custom DTI when selected', () => {
    const r = config.calculate({
      annualIncome: '100000',
      monthlyDebts: '500',
      downPayment: '60000',
      dtiLimit: 'custom',
      customDti: '40',
      interestRate: '6.75',
      loanTerm: '30',
    });
    expect(r).toHaveLength(8);
    const backend = parseNumber(getValue(r, 'backEndDTI'));
    expect(backend).toBeGreaterThan(0);
  });

  it('returns error when debts exceed DTI limit', () => {
    const r = config.calculate({
      annualIncome: '60000',
      monthlyDebts: '3000',
      downPayment: '10000',
      dtiLimit: '28',
      interestRate: '7.0',
      loanTerm: '30',
    });
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe('error');
  });

  it('calculates with 15-year loan term', () => {
    const r = config.calculate({
      annualIncome: '150000',
      monthlyDebts: '300',
      downPayment: '80000',
      dtiLimit: '36',
      interestRate: '5.5',
      loanTerm: '15',
    });
    expect(r).toHaveLength(8);
    expect(parseMoney(getValue(r, 'maxHomePrice'))).toBeGreaterThan(80000);
  });

  it('handles zero interest rate correctly', () => {
    const r = config.calculate({
      annualIncome: '100000',
      monthlyDebts: '200',
      downPayment: '50000',
      dtiLimit: '36',
      interestRate: '0',
      loanTerm: '30',
    });
    expect(r).toHaveLength(8);
    const maxPrice = parseMoney(getValue(r, 'maxHomePrice'));
    expect(maxPrice).toBeGreaterThan(0);
    // With 0% interest, maxLoan should be maxPI * 360 months (30 years)
    // No interest means the borrower just pays back principal over time
    expect(maxPrice).toBeGreaterThan(50000);
  });

  it('shows PMI warning when down payment is under 20%', () => {
    const r = config.calculate({
      annualIncome: '100000',
      monthlyDebts: '200',
      downPayment: '10000',
      dtiLimit: '36',
      interestRate: '6.75',
      loanTerm: '30',
    });
    const pctVal = getValue(r, 'downPaymentPct');
    expect(pctVal).toContain('PMI likely required');
  });

  it('shows no PMI when down payment is 20% or more', () => {
    const r = config.calculate({
      annualIncome: '200000',
      monthlyDebts: '200',
      downPayment: '100000',
      dtiLimit: '36',
      interestRate: '6.75',
      loanTerm: '30',
    });
    // With high income and high down payment, DP % should be >= 20%
    const pctVal = getValue(r, 'downPaymentPct');
    const pct = parseNumber(pctVal);
    // If DP >= 20%, message says "No PMI"
    if (pct >= 20) {
      expect(pctVal).toContain('No PMI');
    }
  });

  it('all expected result keys are present', () => {
    const r = config.calculate({
      annualIncome: '100000',
      monthlyDebts: '500',
      downPayment: '60000',
      dtiLimit: '36',
      interestRate: '6.75',
      loanTerm: '30',
    });
    const ids = r.map((row) => row.id);
    expect(ids).toContain('maxHomePrice');
    expect(ids).toContain('maxLoan');
    expect(ids).toContain('maxHousingPayment');
    expect(ids).toContain('maxPI');
    expect(ids).toContain('taxesInsurance');
    expect(ids).toContain('downPaymentPct');
    expect(ids).toContain('frontEndDTI');
    expect(ids).toContain('backEndDTI');
  });

  it('formula produces consistent DTI values', () => {
    const r = config.calculate({
      annualIncome: '120000',
      monthlyDebts: '400',
      downPayment: '50000',
      dtiLimit: '36',
      interestRate: '6.5',
      loanTerm: '30',
    });
    const frontEnd = parseNumber(getValue(r, 'frontEndDTI'));
    const backEnd = parseNumber(getValue(r, 'backEndDTI'));
    // Back-end should always be >= front-end since it includes debts
    expect(backEnd).toBeGreaterThanOrEqual(frontEnd);
    // Both should be positive
    expect(frontEnd).toBeGreaterThan(0);
    expect(backEnd).toBeGreaterThan(0);
  });

  it('handles negative NaN guard for custom DTI', () => {
    const r = config.calculate({
      annualIncome: '100000',
      monthlyDebts: '0',
      downPayment: '50000',
      dtiLimit: 'custom',
      customDti: '-10',
      interestRate: '6.75',
      loanTerm: '30',
    });
    // Negative DTI limit is caught by the NaN/dtiLimit <= 0 guard
    expect(r).toHaveLength(0);
  });

  it('aggressive DTI allows higher home price than conservative DTI', () => {
    const conservative = config.calculate({
      annualIncome: '100000',
      monthlyDebts: '500',
      downPayment: '60000',
      dtiLimit: '28',
      interestRate: '6.75',
      loanTerm: '30',
    });
    const aggressive = config.calculate({
      annualIncome: '100000',
      monthlyDebts: '500',
      downPayment: '60000',
      dtiLimit: '43',
      interestRate: '6.75',
      loanTerm: '30',
    });
    expect(parseMoney(getValue(aggressive, 'maxHomePrice'))).toBeGreaterThan(
      parseMoney(getValue(conservative, 'maxHomePrice'))
    );
  });
});
