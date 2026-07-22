import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/home-affordability/index';
import { getValue, parseNumber, parseMoney, near } from '../../helpers';

describe('home-affordability', () => {
  it('calculates maximum affordable home for standard inputs', () => {
    const r = config.calculate({
      annualIncome: '100000',
      monthlyDebts: '500',
      downPayment: '60000',
      interestRate: '6.75',
      loanTerm: '30',
    });
    expect(r).toHaveLength(7);
    expect(getValue(r, 'maxHomePrice')).toBeTruthy();
    expect(getValue(r, 'maxLoanAmount')).toBeTruthy();
    expect(getValue(r, 'estimatedMonthlyPayment')).toBeTruthy();
    expect(getValue(r, 'totalMonthlyHousing')).toBeTruthy();
    // Max home price should be > down payment
    expect(parseMoney(getValue(r, 'maxHomePrice'))).toBeGreaterThan(60000);
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

  it('applies aggressive DTI limit (43/50)', () => {
    const r = config.calculate({
      annualIncome: '100000',
      monthlyDebts: '500',
      downPayment: '60000',
      interestRate: '6.75',
      loanTerm: '30',
      dtiLimit: '43/50',
    });
    expect(r).toHaveLength(7);
    // Aggressive DTI should allow higher home price than conservative
    const conservativeR = config.calculate({
      annualIncome: '100000',
      monthlyDebts: '500',
      downPayment: '60000',
      interestRate: '6.75',
      loanTerm: '30',
      dtiLimit: '28/36',
    });
    expect(parseMoney(getValue(r, 'maxHomePrice'))).toBeGreaterThan(
      parseMoney(getValue(conservativeR, 'maxHomePrice'))
    );
  });

  it('calculates with 15-year loan term', () => {
    const r = config.calculate({
      annualIncome: '120000',
      monthlyDebts: '400',
      downPayment: '50000',
      interestRate: '6.0',
      loanTerm: '15',
    });
    expect(r).toHaveLength(7);
    expect(parseMoney(getValue(r, 'maxHomePrice'))).toBeGreaterThan(50000);
  });

  it('handles zero-interest rate edge case', () => {
    const r = config.calculate({
      annualIncome: '100000',
      monthlyDebts: '0',
      downPayment: '20000',
      interestRate: '0',
      loanTerm: '30',
    });
    expect(r).toHaveLength(7);
    expect(parseMoney(getValue(r, 'maxHomePrice'))).toBeGreaterThan(0);
  });

  it('shows down payment percentage', () => {
    const r = config.calculate({
      annualIncome: '100000',
      monthlyDebts: '500',
      downPayment: '60000',
      interestRate: '6.75',
      loanTerm: '30',
    });
    expect(getValue(r, 'downPaymentPct')).toContain('%');
  });
});
