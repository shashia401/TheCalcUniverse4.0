import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/mortgage-payoff';
import { getResult, getValue, parseMoney, near, pmtFormula } from '../../helpers';

describe('mortgage-payoff', () => {
  it('no extra payments: outputs the standard payoff date and total interest only', () => {
    const r = config.calculate({
      originalAmount: '300000',
      currentBalance: '300000',
      interestRate: '6.5',
      monthlyPayment: String(pmtFormula(300000, 6.5, 360).toFixed(2)),
      extraMonthly: '0',
      yearlyLumpSum: '0',
      singleLumpSum: '0',
    });
    expect(getResult(r, 'standardPayoffDate')).toBeDefined();
    expect(r.find((x) => x.id === 'newPayoffDate')).toBeUndefined();
    // Total interest on a $300k @ 6.5% 30yr is ~$382,633
    near(parseMoney(getValue(r, 'standardInterest')), 382633, 100);
  });

  it('with $200/month extra: produces interest savings and time saved', () => {
    const basePmt = pmtFormula(300000, 6.5, 360);
    const r = config.calculate({
      originalAmount: '300000',
      currentBalance: '300000',
      interestRate: '6.5',
      monthlyPayment: basePmt.toFixed(2),
      extraMonthly: '200',
      yearlyLumpSum: '0',
      singleLumpSum: '0',
    });
    const interestSaved = parseMoney(getValue(r, 'interestSaved'));
    expect(interestSaved).toBeGreaterThan(50000);
    expect(interestSaved).toBeLessThan(150000);
    expect(getResult(r, 'newPayoffDate')).toBeDefined();
    expect(getResult(r, 'timeSaved')).toBeDefined();
  });

  it('massive extra payment fully pays off the loan quickly', () => {
    const r = config.calculate({
      originalAmount: '100000',
      currentBalance: '100000',
      interestRate: '5',
      monthlyPayment: pmtFormula(100000, 5, 360).toFixed(2),
      extraMonthly: '50000',
      yearlyLumpSum: '0',
      singleLumpSum: '0',
    });
    expect(getResult(r, 'newPayoffDate')).toBeDefined();
    expect(parseMoney(getValue(r, 'newTotalInterest'))).toBeLessThan(2000);
  });

  it('returns empty array when balance is NaN (empty string input)', () => {
    const r = config.calculate({
      originalAmount: '',
      currentBalance: '',
      interestRate: '6',
      monthlyPayment: '1000',
      extraMonthly: '0',
      yearlyLumpSum: '0',
      singleLumpSum: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array when monthly payment is NaN', () => {
    const r = config.calculate({
      originalAmount: '300000',
      currentBalance: '280000',
      interestRate: '6.5',
      monthlyPayment: '',
      extraMonthly: '0',
      yearlyLumpSum: '0',
      singleLumpSum: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array when interest rate is NaN', () => {
    const r = config.calculate({
      originalAmount: '300000',
      currentBalance: '280000',
      interestRate: 'abc',
      monthlyPayment: '2000',
      extraMonthly: '0',
      yearlyLumpSum: '0',
      singleLumpSum: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns "already paid off" when balance is zero or negative', () => {
    const r = config.calculate({
      originalAmount: '300000',
      currentBalance: '0',
      interestRate: '6.5',
      monthlyPayment: '2000',
      extraMonthly: '0',
      yearlyLumpSum: '0',
      singleLumpSum: '0',
    });
    expect(getResult(r, 'alreadyPaid')).toBeDefined();
    expect(getValue(r, 'alreadyPaid')).toContain('paid off');
  });

  it('warns when payment is too low to cover interest (negative amortization)', () => {
    const r = config.calculate({
      originalAmount: '400000',
      currentBalance: '400000',
      interestRate: '6.5',
      monthlyPayment: '100', // way too low — interest alone is ~$2,167/month
      extraMonthly: '0',
      yearlyLumpSum: '0',
      singleLumpSum: '0',
    });
    expect(getResult(r, 'negativeAmortization')).toBeDefined();
    expect(getValue(r, 'negativeAmortization')).toContain('too low');
  });

  it('known answer: $400k @ 7% for 30yr has standard interest of ~$558,036', () => {
    const pmt = pmtFormula(400000, 7, 360);
    near(pmt, 2661.21, 0.5);
    const r = config.calculate({
      originalAmount: '400000',
      currentBalance: '400000',
      interestRate: '7',
      monthlyPayment: pmt.toFixed(2),
      extraMonthly: '0',
      yearlyLumpSum: '0',
      singleLumpSum: '0',
    });
    near(parseMoney(getValue(r, 'standardInterest')), 558036, 100);
  });

  it('known answer: $200/mo extra on $400k @ 7% saves significant interest', () => {
    const pmt = pmtFormula(400000, 7, 360);
    const r = config.calculate({
      originalAmount: '400000',
      currentBalance: '400000',
      interestRate: '7',
      monthlyPayment: pmt.toFixed(2),
      extraMonthly: '200',
      yearlyLumpSum: '0',
      singleLumpSum: '0',
    });
    const saved = parseMoney(getValue(r, 'interestSaved'));
    expect(saved).toBeGreaterThan(80000);
    expect(saved).toBeLessThan(200000);
    expect(getResult(r, 'newPayoffDate')).toBeDefined();
    expect(getResult(r, 'timeSaved')).toBeDefined();
  });

  it('known answer: $100k @ 5% with $1000/mo extra reduces interest dramatically', () => {
    const pmt = pmtFormula(100000, 5, 360);
    const r = config.calculate({
      originalAmount: '100000',
      currentBalance: '100000',
      interestRate: '5',
      monthlyPayment: pmt.toFixed(2),
      extraMonthly: '1000',
      yearlyLumpSum: '0',
      singleLumpSum: '0',
    });
    const newInt = parseMoney(getValue(r, 'newTotalInterest'));
    expect(newInt).toBeLessThan(50000);
    expect(getValue(r, 'newPayoffDate')).toBeDefined();
  });

  it('single lump sum of $10k on $280k @ 6.75% accelerates payoff', () => {
    const pmt = pmtFormula(280000, 6.75, 360);
    const r = config.calculate({
      originalAmount: '350000',
      currentBalance: '280000',
      interestRate: '6.75',
      monthlyPayment: pmt.toFixed(2),
      extraMonthly: '0',
      yearlyLumpSum: '0',
      singleLumpSum: '10000',
    });
    expect(getResult(r, 'newPayoffDate')).toBeDefined();
    const saved = parseMoney(getValue(r, 'interestSaved'));
    expect(saved).toBeGreaterThan(10000);
    expect(saved).toBeLessThan(80000);
  });

  it('yearly lump sum of $2000/year accelerates payoff', () => {
    const pmt = pmtFormula(280000, 6.75, 360);
    const r = config.calculate({
      originalAmount: '350000',
      currentBalance: '280000',
      interestRate: '6.75',
      monthlyPayment: pmt.toFixed(2),
      extraMonthly: '0',
      yearlyLumpSum: '2000',
      singleLumpSum: '0',
    });
    expect(getResult(r, 'newPayoffDate')).toBeDefined();
    const saved = parseMoney(getValue(r, 'interestSaved'));
    expect(saved).toBeGreaterThan(20000);
    expect(saved).toBeLessThan(100000);
  });

  it('combined extra monthly + yearly lump + single lump all work together', () => {
    const pmt = pmtFormula(350000, 6.75, 360);
    const r = config.calculate({
      originalAmount: '350000',
      currentBalance: '328000',
      interestRate: '6.75',
      monthlyPayment: pmt.toFixed(2),
      extraMonthly: '300',
      yearlyLumpSum: '2500',
      singleLumpSum: '5000',
    });
    expect(getResult(r, 'newPayoffDate')).toBeDefined();
    expect(getResult(r, 'timeSaved')).toBeDefined();
    const saved = parseMoney(getValue(r, 'interestSaved'));
    expect(saved).toBeGreaterThan(100000);
    expect(saved).toBeLessThan(300000);
  });
});
