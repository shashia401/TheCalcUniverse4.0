import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/student-loan/index';
import { getValue, parseMoney, parseNumber, near, pmtFormula } from '../../helpers';

describe('student-loan-calculator', () => {
  it('standard 10-year repayment (already graduated, unsubsidized)', () => {
    const r = config.calculate({
      loanBalance: '35000',
      interestRate: '6.53',
      repaymentTerm: '10',
      inSchool: 'no',
    });
    const expectedPmt = pmtFormula(35000, 6.53, 120);
    near(parseNumber(getValue(r, 'monthlyPayment')), expectedPmt, 0.01);
    const totalPmt = expectedPmt * 120;
    near(parseMoney(getValue(r, 'totalInterestRepayment')), totalPmt - 35000, 1);
    expect(getValue(r, 'payoffDate')).toContain('10 years');
  });

  it('unsubsidized loan accrues interest during school 36 months + 6 grace', () => {
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
    // Payment on effective principal
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
    // Subsidy benefit message says $0 extra
    expect(getValue(r, 'subsidyBenefit')).toContain('$0 extra');
    // Monthly payment should be on original principal (no capitalization)
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

  it('25-year IDR term', () => {
    const r = config.calculate({
      loanBalance: '60000',
      interestRate: '6.53',
      repaymentTerm: '25',
      inSchool: 'no',
    });
    const expectedPmt = pmtFormula(60000, 6.53, 300);
    near(parseNumber(getValue(r, 'monthlyPayment')), expectedPmt, 0.01);
    expect(getValue(r, 'payoffDate')).toContain('25 years');
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

  it('returns empty array for empty form values', () => {
    const r = config.calculate({});
    expect(r).toHaveLength(0);
  });

  it('returns empty array for zero loan balance', () => {
    const r = config.calculate({
      loanBalance: '0',
      interestRate: '6.53',
      repaymentTerm: '10',
      inSchool: 'no',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty array for missing loan balance (empty string)', () => {
    const r = config.calculate({
      loanBalance: '',
      interestRate: '6.53',
      repaymentTerm: '10',
      inSchool: 'no',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty array for NaN interest rate', () => {
    const r = config.calculate({
      loanBalance: '35000',
      interestRate: 'abc',
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
    expect(r.some((x) => x.id === 'totalInterestRepayment')).toBe(true);
  });

  it('subsidized loan with school - no capitalized interest section', () => {
    const r = config.calculate({
      loanBalance: '25000',
      interestRate: '5.5',
      repaymentTerm: '10',
      inSchool: 'yes',
      monthsUntilGraduation: '12',
      loanType: 'subsidized',
      gracePeriodMonths: '6',
    });
    // Subsidized loans should NOT have capitalizedInterest result
    expect(r.some((x) => x.id === 'capitalizedInterest')).toBe(false);
    expect(r.some((x) => x.id === 'subsidyBenefit')).toBe(true);
  });

  it('Decimal.js precision: payment should match expected to within 1 cent', () => {
    const r = config.calculate({
      loanBalance: '123456',
      interestRate: '7.25',
      repaymentTerm: '15',
      inSchool: 'no',
    });
    const expectedPmt = pmtFormula(123456, 7.25, 180);
    near(parseNumber(getValue(r, 'monthlyPayment')), expectedPmt, 0.01);
  });

  it('educational content has variables, FAQs, worked examples, pro tips, and limitations', () => {
    const edu = config.educational;
    expect(edu.variables?.length).toBeGreaterThanOrEqual(3);
    expect(edu.faqs?.length).toBeGreaterThanOrEqual(7);
    expect(edu.workedExamples?.length).toBeGreaterThanOrEqual(3);
    expect(edu.proTips?.length).toBeGreaterThanOrEqual(4);
    expect(edu.limitations?.length).toBeGreaterThanOrEqual(3);
    expect(edu.explanation?.length).toBeGreaterThanOrEqual(350);
  });
});
