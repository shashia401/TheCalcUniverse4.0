import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/personal-loan/index';
import { getValue, parseMoney, near, pmtFormula } from '../../helpers';

describe('personal-loan-calculator', () => {
  it('basic amortization matches PMT formula (no origination fee)', () => {
    const r = config.calculate({
      loanAmount: '20000',
      loanTerm: '36',
      interestRate: '11.5',
      originationFeeType: 'none',
    });
    const expectedPmt = pmtFormula(20000, 11.5, 36);
    near(parseMoney(getValue(r, 'monthlyPayment')), expectedPmt, 0.01);
    near(parseMoney(getValue(r, 'totalInterest')), expectedPmt * 36 - 20000, 0.5);
    expect(parseMoney(getValue(r, 'actualCashReceived'))).toBeCloseTo(20000);
  });

  it('handles zero interest rate', () => {
    const r = config.calculate({
      loanAmount: '12000',
      loanTerm: '12',
      interestRate: '0',
      originationFeeType: 'none',
    });
    near(parseMoney(getValue(r, 'monthlyPayment')), 1000);
    near(parseMoney(getValue(r, 'totalInterest')), 0);
  });

  it('percentage origination fee deducted from proceeds', () => {
    const r = config.calculate({
      loanAmount: '20000',
      loanTerm: '36',
      interestRate: '11.5',
      originationFeeType: 'percent',
      originationFeeValue: '3',
      feeHandling: 'deducted',
    });
    // 3% of 20000 = 600 fee, deducted
    near(parseMoney(getValue(r, 'actualCashReceived')), 19400);
    near(parseMoney(getValue(r, 'originationFeeResult')), 600);
    // Monthly payment on $20,000 (fee is deducted, not added to balance)
    const expectedPmt = pmtFormula(20000, 11.5, 36);
    near(parseMoney(getValue(r, 'monthlyPayment')), expectedPmt, 0.01);
  });

  it('origination fee added to loan balance', () => {
    const r = config.calculate({
      loanAmount: '20000',
      loanTerm: '36',
      interestRate: '11.5',
      originationFeeType: 'percent',
      originationFeeValue: '3',
      feeHandling: 'added',
    });
    // 3% of 20000 = 600 fee. Loan balance = 20600 for payment calc
    // Cash received = 20000 (not deducted)
    const expectedPmt = pmtFormula(20600, 11.5, 36);
    near(parseMoney(getValue(r, 'monthlyPayment')), expectedPmt, 0.01);
    near(parseMoney(getValue(r, 'actualCashReceived')), 20000);
    near(parseMoney(getValue(r, 'totalCostIncFee')), expectedPmt * 36 + 0, 0.5);
  });

  it('flat origination fee deducted', () => {
    const r = config.calculate({
      loanAmount: '10000',
      loanTerm: '24',
      interestRate: '8',
      originationFeeType: 'flat',
      originationFeeValue: '200',
      feeHandling: 'deducted',
    });
    near(parseMoney(getValue(r, 'actualCashReceived')), 9800);
    near(parseMoney(getValue(r, 'originationFeeResult')), 200);
    const expectedPmt = pmtFormula(10000, 8, 24);
    near(parseMoney(getValue(r, 'monthlyPayment')), expectedPmt, 0.01);
  });

  it('returns empty array for missing loan amount', () => {
    const r = config.calculate({
      loanAmount: '',
      loanTerm: '36',
      interestRate: '11.5',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty array for zero loan amount', () => {
    const r = config.calculate({
      loanAmount: '0',
      loanTerm: '36',
      interestRate: '11.5',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty array for negative interest rate', () => {
    const r = config.calculate({
      loanAmount: '10000',
      loanTerm: '36',
      interestRate: '-1',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty array for empty inputs object', () => {
    const r = config.calculate({});
    expect(r).toHaveLength(0);
  });

  it('returns empty array for NaN inputs', () => {
    const r = config.calculate({
      loanAmount: 'not-a-number',
      loanTerm: '36',
      interestRate: '11.5',
    });
    expect(r).toHaveLength(0);
  });

  it('generates amortization schedule with correct length', () => {
    const r = config.calculate({
      loanAmount: '10000',
      loanTerm: '12',
      interestRate: '6',
      originationFeeType: 'none',
    });
    const amortRaw = getValue(r, '_amortization');
    const schedule = JSON.parse(amortRaw);
    expect(schedule).toHaveLength(12);
    expect(schedule[0].beginningBalance).toBeCloseTo(10000, 0);
    expect(schedule[schedule.length - 1].endingBalance).toBeCloseTo(0, 0);
  });

  it('deducted fee does not change monthly payment from fee-free loan', () => {
    const rNoFee = config.calculate({
      loanAmount: '20000',
      loanTerm: '36',
      interestRate: '10',
      originationFeeType: 'none',
    });
    const rDeducted = config.calculate({
      loanAmount: '20000',
      loanTerm: '36',
      interestRate: '10',
      originationFeeType: 'percent',
      originationFeeValue: '3',
      feeHandling: 'deducted',
    });
    // Monthly payment should be same (fee deducted, balance unchanged)
    expect(parseMoney(getValue(rNoFee, 'monthlyPayment'))).toBeCloseTo(
      parseMoney(getValue(rDeducted, 'monthlyPayment')),
      1,
    );
  });
});
