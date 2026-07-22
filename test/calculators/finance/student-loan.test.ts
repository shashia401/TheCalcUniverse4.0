import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/student-loan/index';
import { getValue, parseMoney, parseNumber, near, pmtFormula } from '../../helpers';

describe('student-loan', () => {
  it('standard 10-year repayment (already graduated)', () => {
    const r = config.calculate({
      loanBalance: '35000',
      interestRate: '6.53',
      repaymentTerm: '10',
      inSchool: 'no',
    });
    const expectedPmt = pmtFormula(35000, 6.53, 120);
    // Value has "/mo" suffix, use parseNumber
    near(parseNumber(getValue(r, 'monthlyPayment')), expectedPmt, 0.01);
    const totalPmt = expectedPmt * 120;
    near(parseMoney(getValue(r, 'totalInterestRepayment')), totalPmt - 35000, 1);
    expect(getValue(r, 'payoffDate')).toContain('10 years');
  });

  it('unsubsidized loan accrues interest during school', () => {
    const r = config.calculate({
      loanBalance: '35000',
      interestRate: '6.53',
      repaymentTerm: '10',
      inSchool: 'yes',
      monthsUntilGraduation: '36',
      loanType: 'unsubsidized',
      gracePeriodMonths: '6',
    });
    // In-school months = 36, defer = 36 + 6 = 42
    // Capitalized interest = 35000 * (0.0653/12) * 42
    const capInterest = 35000 * (0.0653 / 12) * 42;
    near(parseMoney(getValue(r, 'capitalizedInterest')), capInterest, 10);
    const effPrincipal = 35000 + capInterest;
    near(parseMoney(getValue(r, 'effectivePrincipal')), effPrincipal, 10);
    // Payment on effective principal, has "/mo" suffix
    const expectedPmt = pmtFormula(effPrincipal, 6.53, 120);
    near(parseNumber(getValue(r, 'monthlyPayment')), expectedPmt, 0.01);
    expect(getValue(r, 'deferPeriod')).toContain('42 months');
  });

  it('subsidized loan shows subsidy benefit during school', () => {
    const r = config.calculate({
      loanBalance: '35000',
      interestRate: '6.53',
      repaymentTerm: '10',
      inSchool: 'yes',
      monthsUntilGraduation: '36',
      loanType: 'subsidized',
      gracePeriodMonths: '6',
    });
    // Subsidy benefit = principal * monthlyRate * deferMonths
    expect(getValue(r, 'subsidyBenefit')).toContain('$0 extra');
    // Monthly payment should be on original principal
    const expectedPmt = pmtFormula(35000, 6.53, 120);
    near(parseNumber(getValue(r, 'monthlyPayment')), expectedPmt, 0.01);
  });

  it('extended 20-year term for income-driven repayment', () => {
    const r = config.calculate({
      loanBalance: '50000',
      interestRate: '7',
      repaymentTerm: '20',
      inSchool: 'no',
    });
    const expectedPmt = pmtFormula(50000, 7, 240);
    near(parseNumber(getValue(r, 'monthlyPayment')), expectedPmt, 0.01);
    expect(getValue(r, 'payoffDate')).toContain('20 years');
  });

  it('handles zero interest rate', () => {
    const r = config.calculate({
      loanBalance: '36000',
      interestRate: '0',
      repaymentTerm: '10',
      inSchool: 'no',
    });
    // Payment = 36000 / 120 = 300
    near(parseNumber(getValue(r, 'monthlyPayment')), 300);
    near(parseMoney(getValue(r, 'totalInterestRepayment')), 0);
  });

  it('grace period with 0 months when explicitly passed as "0"', () => {
    const r = config.calculate({
      loanBalance: '10000',
      interestRate: '5',
      repaymentTerm: '10',
      inSchool: 'yes',
      monthsUntilGraduation: '12',
      loanType: 'unsubsidized',
      gracePeriodMonths: '0',
    });
    // Defer = 12 + 0 = 12 months
    const capInterest = 10000 * (0.05 / 12) * 12;
    near(parseMoney(getValue(r, 'capitalizedInterest')), capInterest, 1);
  });

  it('returns empty for empty inputs', () => {
    const r = config.calculate({});
    expect(r).toHaveLength(0);
  });

  it('returns empty for zero loan balance', () => {
    const r = config.calculate({
      loanBalance: '0',
      interestRate: '6.53',
      repaymentTerm: '10',
      inSchool: 'no',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for missing loan balance', () => {
    const r = config.calculate({
      loanBalance: '',
      interestRate: '6.53',
      repaymentTerm: '10',
      inSchool: 'no',
    });
    expect(r).toHaveLength(0);
  });

  it('original principal and lifetime cost are shown', () => {
    const r = config.calculate({
      loanBalance: '35000',
      interestRate: '6.53',
      repaymentTerm: '10',
      inSchool: 'no',
    });
    expect(getValue(r, 'originalPrincipal')).toContain('$35,000');
    expect(r.some((x) => x.id === 'totalLifetimeCost')).toBe(true);
  });
});
