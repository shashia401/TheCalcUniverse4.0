import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/loan-calculator';
import { getValue, parseMoney, near, pmtFormula } from '../../helpers';

describe('loan-calculator', () => {
  it('classic case: $250,000 @ 6% for 30 years matches Excel PMT() to the cent', () => {
    const r = config.calculate({
      loanAmount: '250000',
      interestRate: '6',
      termUnit: 'years',
      loanTerm: '30',
    });
    // Excel: PMT(0.06/12, 360, -250000) = $1,499.21
    const expected = pmtFormula(250000, 6, 360);
    near(parseMoney(getValue(r, 'monthlyPayment')), expected, 0.01);
    near(parseMoney(getValue(r, 'totalInterest')), expected * 360 - 250000, 0.5);
    near(parseMoney(getValue(r, 'totalCost')), expected * 360, 0.5);
  });

  it('matches the canonical PMT formula for several loans', () => {
    const cases = [
      { p: 100000, rate: 5, years: 15 },
      { p: 30000, rate: 7.25, years: 5 },
      { p: 500000, rate: 6.875, years: 30 },
      { p: 12000, rate: 12, years: 3 },
    ];
    for (const c of cases) {
      const r = config.calculate({
        loanAmount: String(c.p),
        interestRate: String(c.rate),
        termUnit: 'years',
        loanTerm: String(c.years),
      });
      const expected = pmtFormula(c.p, c.rate, c.years * 12);
      near(parseMoney(getValue(r, 'monthlyPayment')), expected, 0.01);
    }
  });

  it('zero-rate loan: payment = principal / months', () => {
    const r = config.calculate({
      loanAmount: '12000',
      interestRate: '0',
      termUnit: 'months',
      loanTerm: '24',
    });
    near(parseMoney(getValue(r, 'monthlyPayment')), 500);
    near(parseMoney(getValue(r, 'totalInterest')), 0);
  });

  it('term in months works the same as term in years', () => {
    const r1 = config.calculate({
      loanAmount: '10000',
      interestRate: '8',
      termUnit: 'years',
      loanTerm: '5',
    });
    const r2 = config.calculate({
      loanAmount: '10000',
      interestRate: '8',
      termUnit: 'months',
      loanTerm: '60',
    });
    near(parseMoney(getValue(r1, 'monthlyPayment')), parseMoney(getValue(r2, 'monthlyPayment')));
  });

  it('returns empty when loan amount is invalid', () => {
    const r = config.calculate({
      loanAmount: '',
      interestRate: '5',
      termUnit: 'years',
      loanTerm: '10',
    });
    expect(r).toEqual([]);
  });

  it('known answer: $10k @ 5% for 3yr has monthly payment of $299.71', () => {
    const r = config.calculate({
      loanAmount: '10000',
      interestRate: '5',
      termUnit: 'years',
      loanTerm: '3',
    });
    near(parseMoney(getValue(r, 'monthlyPayment')), 299.71, 0.5);
  });

  it('known answer: $10k @ 5% for 3yr has total interest of $789.52', () => {
    const r = config.calculate({
      loanAmount: '10000',
      interestRate: '5',
      termUnit: 'years',
      loanTerm: '3',
    });
    near(parseMoney(getValue(r, 'totalInterest')), 789.52, 1);
  });

  it('known answer: shorter term has higher monthly but lower total interest', () => {
    const r3yr = config.calculate({
      loanAmount: '10000',
      interestRate: '5',
      termUnit: 'years',
      loanTerm: '3',
    });
    const r1yr = config.calculate({
      loanAmount: '10000',
      interestRate: '5',
      termUnit: 'years',
      loanTerm: '1',
    });
    const pmt3yr = parseMoney(getValue(r3yr, 'monthlyPayment'));
    const pmt1yr = parseMoney(getValue(r1yr, 'monthlyPayment'));
    const int3yr = parseMoney(getValue(r3yr, 'totalInterest'));
    const int1yr = parseMoney(getValue(r1yr, 'totalInterest'));
    expect(pmt1yr).toBeGreaterThan(pmt3yr);
    expect(int1yr).toBeLessThan(int3yr);
  });

  it('known answer: $10k @ 5% for 3yr has total cost of $10,789.52', () => {
    const r = config.calculate({
      loanAmount: '10000',
      interestRate: '5',
      termUnit: 'years',
      loanTerm: '3',
    });
    near(parseMoney(getValue(r, 'totalCost')), 10789.52, 1);
  });
});
