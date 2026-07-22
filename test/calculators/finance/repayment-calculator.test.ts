import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/repayment/index';
import { getValue, parseMoney, parseNumber } from '../../helpers';

describe('repayment calculator', () => {
  it('calculates basic monthly payment', () => {
    const r = config.calculate({
      loanAmount: '25000',
      interestRate: '7.5',
      termUnit: 'years',
      loanTerm: '5',
      extraPayment: '0',
    });
    const pmt = parseMoney(getValue(r, 'monthlyPayment'));
    // $25K, 7.5%, 5yr → ~$500.76/mo
    expect(pmt).toBeGreaterThan(490);
    expect(pmt).toBeLessThan(510);
  });

  it('shows total interest and total cost', () => {
    const r = config.calculate({
      loanAmount: '10000',
      interestRate: '10',
      termUnit: 'years',
      loanTerm: '3',
      extraPayment: '0',
    });
    const monthly = parseMoney(getValue(r, 'monthlyPayment'));
    const totalInterest = parseMoney(getValue(r, 'totalInterest'));
    const totalCost = parseMoney(getValue(r, 'totalCost'));
    const months = 36;
    expect(totalCost).toBeCloseTo(monthly * months, -1);
    expect(totalInterest).toBeCloseTo(totalCost - 10000, -1);
  });

  it('returns empty for missing loan amount', () => {
    const r = config.calculate({
      loanAmount: '',
      interestRate: '7.5',
      termUnit: 'years',
      loanTerm: '5',
      extraPayment: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for zero loan amount', () => {
    const r = config.calculate({
      loanAmount: '0',
      interestRate: '5',
      termUnit: 'years',
      loanTerm: '3',
      extraPayment: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for zero term', () => {
    const r = config.calculate({
      loanAmount: '10000',
      interestRate: '5',
      termUnit: 'years',
      loanTerm: '0',
      extraPayment: '0',
    });
    expect(r).toEqual([]);
  });

  it('shows extra payment savings', () => {
    const r = config.calculate({
      loanAmount: '25000',
      interestRate: '7.5',
      termUnit: 'years',
      loanTerm: '5',
      extraPayment: '100',
    });
    expect(parseMoney(getValue(r, 'interestSaved'))).toBeGreaterThan(500);
    const timeSavedStr = getValue(r, 'timeSaved');
    expect(timeSavedStr).not.toBe('—');
    // timeSaved format is "Xyr Ymo" — check it's not "0yr 0mo"
    expect(timeSavedStr).not.toBe('0yr 0mo');
    expect(getValue(r, 'monthlyWithExtra')).toBeDefined();
    expect(getValue(r, 'totalInterestWithExtra')).toBeDefined();
  });

  it('handles zero interest rate', () => {
    const r = config.calculate({
      loanAmount: '12000',
      interestRate: '0',
      termUnit: 'months',
      loanTerm: '12',
      extraPayment: '0',
    });
    expect(parseMoney(getValue(r, 'monthlyPayment'))).toBe(1000);
    expect(parseMoney(getValue(r, 'totalInterest'))).toBe(0);
  });

  it('handles term in months', () => {
    const r = config.calculate({
      loanAmount: '5000',
      interestRate: '6',
      termUnit: 'months',
      loanTerm: '24',
      extraPayment: '0',
    });
    const pmt = parseMoney(getValue(r, 'monthlyPayment'));
    // $5K, 6%, 24mo → ~$221.60/mo
    expect(pmt).toBeGreaterThan(210);
    expect(pmt).toBeLessThan(230);
  });

  it('shows interest ratio', () => {
    const r = config.calculate({
      loanAmount: '30000',
      interestRate: '8',
      termUnit: 'years',
      loanTerm: '6',
      extraPayment: '0',
    });
    expect(getValue(r, 'interestRatio')).toContain('%');
    expect(parseNumber(getValue(r, 'interestRatio'))).toBeGreaterThan(0);
  });
});
