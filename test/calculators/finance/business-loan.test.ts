import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/business-loan';
import { getValue, parseMoney, parseNumber, near, pmtFormula } from '../../helpers';

describe('business-loan', () => {
  it('basic calculation matches PMT formula', () => {
    const r = config.calculate({
      loanAmount: '250000',
      loanTermMonths: '60',
      interestRate: '8.5',
    });
    const expected = pmtFormula(250000, 8.5, 60);
    near(parseMoney(getValue(r, 'monthlyPayment')), expected, 0.5);
    expect(parseMoney(getValue(r, 'totalInterest'))).toBeGreaterThan(0);
  });

  it('includes DSCR result when monthly NOI is provided', () => {
    const r = config.calculate({
      loanAmount: '250000',
      loanTermMonths: '60',
      interestRate: '8.5',
      monthlyNOI: '8500',
    });
    expect(getValue(r, 'dscrResult')).toContain('Strong');
    expect(parseNumber(getValue(r, 'dscrResult'))).toBeGreaterThan(1);
  });

  it('origination fee reduces actual cash received', () => {
    const r = config.calculate({
      loanAmount: '100000',
      loanTermMonths: '36',
      interestRate: '7',
      originationFee: '2',
    });
    expect(getValue(r, 'originationFeeResult')).toContain('Cash received');
    const received = parseMoney(getValue(r, 'actualCashReceived'));
    near(received, 98000);
  });

  it('zero interest rate: payment = principal / months', () => {
    const r = config.calculate({
      loanAmount: '12000',
      loanTermMonths: '24',
      interestRate: '0',
    });
    near(parseMoney(getValue(r, 'monthlyPayment')), 500);
    near(parseMoney(getValue(r, 'totalInterest')), 0);
  });

  it('returns empty when loanAmount is missing or invalid', () => {
    expect(config.calculate({})).toHaveLength(0);
    expect(config.calculate({ loanAmount: '0', interestRate: '5', loanTermMonths: '12' })).toHaveLength(0);
  });

  it('different loan terms produce different payments', () => {
    const r3yr = config.calculate({
      loanAmount: '50000',
      loanTermMonths: '36',
      interestRate: '6',
    });
    const r5yr = config.calculate({
      loanAmount: '50000',
      loanTermMonths: '60',
      interestRate: '6',
    });
    const pmt3 = parseMoney(getValue(r3yr, 'monthlyPayment'));
    const pmt5 = parseMoney(getValue(r5yr, 'monthlyPayment'));
    expect(pmt3).toBeGreaterThan(pmt5);
  });

  it('no origination fee shows $0', () => {
    const r = config.calculate({
      loanAmount: '50000',
      loanTermMonths: '36',
      interestRate: '6',
    });
    expect(getValue(r, 'originationFeeResult')).toContain('$0');
  });
});
