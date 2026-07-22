import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/home-equity-loan/index';
import { getValue, parseMoney } from '../../helpers';

describe('home equity loan calculator', () => {
  it('calculates max available based on credit profile', () => {
    const r = config.calculate({
      homeValue: '400000',
      currentMortgage: '250000',
      creditProfile: 'excellent',
      desiredLoan: '50000',
      interestRate: '8.5',
      loanTerm: '120',
      closingCosts: '2000',
    });
    // Excellent credit = 85% CLTV. Max total = 400K * 0.85 = 340K. Max HELOC = 340K - 250K = 90K
    const maxAvailable = parseMoney(getValue(r, 'maxAvailable'));
    expect(maxAvailable).toBeCloseTo(90000, -2);
    expect(getValue(r, 'ltvRatio')).toContain('%');
  });

  it('caps desired loan at max LTV limit', () => {
    const r = config.calculate({
      homeValue: '300000',
      currentMortgage: '250000',
      creditProfile: 'excellent',
      desiredLoan: '100000',
      interestRate: '8.5',
      loanTerm: '120',
      closingCosts: '0',
    });
    // Max CLTV = 85% * 300K = 255K - 250K = 5K available
    const approvedLoan = parseMoney(getValue(r, 'actualLoan'));
    expect(approvedLoan).toBeLessThan(100000);
    expect(approvedLoan).toBeGreaterThan(0);
  });

  it('calculates positive monthly payment', () => {
    const r = config.calculate({
      homeValue: '350000',
      currentMortgage: '200000',
      creditProfile: 'good',
      desiredLoan: '50000',
      interestRate: '8.5',
      loanTerm: '120',
      closingCosts: '0',
    });
    const payment = parseMoney(getValue(r, 'monthlyPayment'));
    expect(payment).toBeGreaterThan(500);
    expect(payment).toBeLessThan(1000);
  });

  it('returns empty for missing homeValue', () => {
    const r = config.calculate({
      homeValue: '',
      currentMortgage: '200000',
      creditProfile: 'good',
      desiredLoan: '50000',
      interestRate: '8.5',
      loanTerm: '120',
      closingCosts: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for zero homeValue', () => {
    const r = config.calculate({
      homeValue: '0',
      currentMortgage: '200000',
      creditProfile: 'good',
      desiredLoan: '50000',
      interestRate: '8.5',
      loanTerm: '120',
      closingCosts: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for negative desiredLoan', () => {
    const r = config.calculate({
      homeValue: '400000',
      currentMortgage: '200000',
      creditProfile: 'good',
      desiredLoan: '-10000',
      interestRate: '8.5',
      loanTerm: '120',
      closingCosts: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty when interestRate is NaN', () => {
    const r = config.calculate({
      homeValue: '400000',
      currentMortgage: '200000',
      creditProfile: 'good',
      desiredLoan: '50000',
      interestRate: 'abc',
      loanTerm: '120',
      closingCosts: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty when loanTerm is zero or negative', () => {
    const r = config.calculate({
      homeValue: '400000',
      currentMortgage: '200000',
      creditProfile: 'good',
      desiredLoan: '50000',
      interestRate: '8.5',
      loanTerm: '0',
      closingCosts: '0',
    });
    expect(r).toEqual([]);
  });

  it('shows zero max available when underwater on mortgage', () => {
    const r = config.calculate({
      homeValue: '300000',
      currentMortgage: '400000',
      creditProfile: 'excellent',
      desiredLoan: '50000',
      interestRate: '8.5',
      loanTerm: '120',
      closingCosts: '0',
    });
    const maxAvailable = parseMoney(getValue(r, 'maxAvailable'));
    expect(maxAvailable).toBe(0);
  });

  it('computes correct CLTV for fair credit', () => {
    const r = config.calculate({
      homeValue: '500000',
      currentMortgage: '200000',
      creditProfile: 'fair',
      desiredLoan: '100000',
      interestRate: '8.5',
      loanTerm: '120',
      closingCosts: '0',
    });
    // Fair credit = 75% CLTV = 375K max - 200K = 175K max HELOC. 100K desired is under.
    expect(getValue(r, 'ltvRatio')).toBe('60.0%');
    const actualLoan = parseMoney(getValue(r, 'actualLoan'));
    expect(actualLoan).toBeCloseTo(100000, -2);
  });

  it('computes monthly payment with closing costs rolled in', () => {
    const r = config.calculate({
      homeValue: '400000',
      currentMortgage: '200000',
      creditProfile: 'excellent',
      desiredLoan: '50000',
      interestRate: '8.5',
      loanTerm: '120',
      closingCosts: '2000',
    });
    // Value contains "(costs rolled in)" — extract the numeric dollar amount
    const value = getValue(r, 'monthlyPayment');
    expect(value).toContain('costs rolled in');
    const payment = parseMoney(value.split(' (')[0]);
    expect(payment).toBeGreaterThan(500);
    expect(payment).toBeLessThan(800);
  });

  it('computes total interest as a negative-color result', () => {
    const r = config.calculate({
      homeValue: '400000',
      currentMortgage: '200000',
      creditProfile: 'excellent',
      desiredLoan: '50000',
      interestRate: '8.5',
      loanTerm: '120',
      closingCosts: '0',
    });
    const totalInterest = parseMoney(getValue(r, 'totalInterest'));
    expect(totalInterest).toBeGreaterThan(10000);
  });

  it('handles all empty/default values gracefully', () => {
    const r = config.calculate({
      homeValue: '',
      currentMortgage: '',
      creditProfile: '',
      desiredLoan: '',
      interestRate: '',
      loanTerm: '',
      closingCosts: '',
    });
    expect(r).toEqual([]);
  });
});
