import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/payment-calculator';
import { getValue, parseMoney, near, pmtFormula } from '../../helpers';

describe('payment-calculator', () => {
  it('payment mode: $25,000 @ 7% for 5 years matches PMT formula', () => {
    const r = config.calculate({
      solveFor: 'payment',
      loanAmount: '25000',
      interestRate: '7',
      termUnit: 'years',
      loanTerm: '5',
    });
    const expected = pmtFormula(25000, 7, 60);
    near(parseMoney(getValue(r, 'payment')), expected, 0.01);
  });

  it('payment mode: zero interest rate', () => {
    const r = config.calculate({
      solveFor: 'payment',
      loanAmount: '12000',
      interestRate: '0',
      termUnit: 'months',
      loanTerm: '24',
    });
    near(parseMoney(getValue(r, 'payment')), 500);
    near(parseMoney(getValue(r, 'totalInterest')), 0);
  });

  it('loan amount mode: $500/mo @ 7% for 5 years', () => {
    const r = config.calculate({
      solveFor: 'loanAmount',
      monthlyPayment: '500',
      interestRate: '7',
      termUnit: 'years',
      loanTerm: '5',
    });
    // P = (500 * ((1 + 0.07/12)^60 - 1)) / ((0.07/12) * (1 + 0.07/12)^60)
    const monthlyRate = 0.07 / 12;
    const expectedP = (500 * (Math.pow(1 + monthlyRate, 60) - 1)) / (monthlyRate * Math.pow(1 + monthlyRate, 60));
    near(parseMoney(getValue(r, 'loanAmount')), expectedP, 0.5);
    // Should show the +$50 option
    expect(getValue(r, 'increaseBy50')).toContain('more');
  });

  it('loan amount mode: zero interest', () => {
    const r = config.calculate({
      solveFor: 'loanAmount',
      monthlyPayment: '500',
      interestRate: '0',
      termUnit: 'years',
      loanTerm: '5',
    });
    // P = 500 * 60 = 30000
    near(parseMoney(getValue(r, 'loanAmount')), 30000);
  });

  it('term mode: $25,000 @ 7% with $500/mo', () => {
    const r = config.calculate({
      solveFor: 'term',
      loanAmount: '25000',
      monthlyPayment: '500',
      interestRate: '7',
    });
    // Payment should be enough to cover interest and principal
    expect(getValue(r, 'term')).toContain('year');
    expect(getValue(r, 'totalPayments')).toMatch(/payments/);
  });

  it('term mode: payment too low to cover interest', () => {
    const r = config.calculate({
      solveFor: 'term',
      loanAmount: '25000',
      monthlyPayment: '50',
      interestRate: '7',
    });
    // 7% APR = 0.583% monthly -> min interest = 25000 * 0.07/12 ≈ 145.83
    // 50 < 145.83, so should show an error
    expect(getValue(r, 'error')).toContain('Monthly payment must exceed');
  });

  it('returns empty when interest rate is missing', () => {
    const r = config.calculate({
      solveFor: 'payment',
      loanAmount: '25000',
      interestRate: '',
      termUnit: 'years',
      loanTerm: '5',
    });
    expect(r).toEqual([]);
  });

  it('returns empty when loan amount is missing in payment mode', () => {
    const r = config.calculate({
      solveFor: 'payment',
      loanAmount: '',
      interestRate: '7',
      termUnit: 'years',
      loanTerm: '5',
    });
    expect(r).toEqual([]);
  });

  it('term mode: zero interest rate', () => {
    const r = config.calculate({
      solveFor: 'term',
      loanAmount: '12000',
      monthlyPayment: '500',
      interestRate: '0',
    });
    // 12000 / 500 = 24 months = 2 years
    expect(getValue(r, 'term')).toContain('2 yr');
  });

  it('payment mode shows interest as percentage of total', () => {
    const r = config.calculate({
      solveFor: 'payment',
      loanAmount: '10000',
      interestRate: '12',
      termUnit: 'months',
      loanTerm: '12',
    });
    const pct = getValue(r, 'interestPct');
    expect(pct).toMatch(/%$/);
  });
});
