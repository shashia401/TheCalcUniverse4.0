import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/fha-loan/index';
import { getValue, parseMoney } from '../../helpers';

describe('FHA loan calculator', () => {
  it('calculates total monthly payment with MIP (3.5% down)', () => {
    const r = config.calculate({
      homePrice: '300000',
      downPaymentPct: '3.5',
      interestRate: '6.8',
      loanTerm: '30',
    });
    const total = parseMoney(getValue(r, 'totalMonthly'));
    const pi = parseMoney(getValue(r, 'monthlyPI'));
    const mip = parseMoney(getValue(r, 'monthlyMIP'));
    expect(total).toBeGreaterThan(pi);
    expect(mip).toBeGreaterThan(0);
    expect(total).toBeCloseTo(pi + mip, 0);
  });

  it('upfront MIP is 1.75% of base loan', () => {
    const r = config.calculate({
      homePrice: '200000',
      downPaymentPct: '5',
      interestRate: '6.5',
      loanTerm: '30',
    });
    // Down = 10K, base loan = 190K, upfront MIP = 190K * 0.0175 = 3,325
    const upfront = parseMoney(getValue(r, 'upfrontMIP'));
    expect(upfront).toBeCloseTo(3325, -1);
  });

  it('MIP is life of loan when down payment under 10%', () => {
    const r = config.calculate({
      homePrice: '300000',
      downPaymentPct: '3.5',
      interestRate: '6.8',
      loanTerm: '30',
    });
    expect(getValue(r, 'mipDuration')).toBe('Life of loan');
  });

  it('MIP drops after 11 years with 10%+ down', () => {
    const r = config.calculate({
      homePrice: '300000',
      downPaymentPct: '10',
      interestRate: '6.8',
      loanTerm: '30',
    });
    expect(getValue(r, 'mipDuration')).toContain('11 years');
  });

  it('returns empty for invalid homePrice input', () => {
    const r = config.calculate({
      homePrice: '',
      downPaymentPct: '3.5',
      interestRate: '6.8',
      loanTerm: '30',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid interestRate input', () => {
    const r = config.calculate({
      homePrice: '300000',
      downPaymentPct: '3.5',
      interestRate: '',
      loanTerm: '30',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN homePrice', () => {
    const r = config.calculate({
      homePrice: 'abc',
      downPaymentPct: '3.5',
      interestRate: '6.8',
      loanTerm: '30',
    });
    expect(r).toEqual([]);
  });

  it('handles zero interest rate edge case', () => {
    const r = config.calculate({
      homePrice: '200000',
      downPaymentPct: '5',
      interestRate: '0',
      loanTerm: '30',
    });
    const monthlyPI = parseMoney(getValue(r, 'monthlyPI'));
    // With 0% rate: base loan = 190K, upfront MIP = 3325, total = 193325
    // Monthly P&I = 193325 / 360 ≈ 537.01
    expect(monthlyPI).toBeCloseTo(537.01, 0);
    expect(getValue(r, 'monthlyMIP')).toBeTruthy();
  });

  it('handles 15-year term correctly', () => {
    const r = config.calculate({
      homePrice: '300000',
      downPaymentPct: '10',
      interestRate: '6.0',
      loanTerm: '15',
    });
    const total = parseMoney(getValue(r, 'totalMonthly'));
    const pi = parseMoney(getValue(r, 'monthlyPI'));
    // 15-year term should have higher monthly P&I than 30-year
    expect(total).toBeGreaterThan(pi);
    expect(pi).toBeGreaterThan(0);
  });

  it('lower annual MIP rate for 10%+ down (0.50% vs 0.55%)', () => {
    const r3 = config.calculate({
      homePrice: '300000',
      downPaymentPct: '3.5',
      interestRate: '6.5',
      loanTerm: '30',
    });
    const r10 = config.calculate({
      homePrice: '300000',
      downPaymentPct: '10',
      interestRate: '6.5',
      loanTerm: '30',
    });
    const mip3 = parseMoney(getValue(r3, 'monthlyMIP'));
    const mip10 = parseMoney(getValue(r10, 'monthlyMIP'));
    // 10% down MIP should be lower (0.50% vs 0.55%) — but base loan is bigger for 3.5%
    // 3.5%: baseLoan = 289500, MIP = 289500 * 0.0055 / 12 = 132.69
    // 10%: baseLoan = 270000, MIP = 270000 * 0.005 / 12 = 112.50
    expect(mip10).toBeLessThan(mip3);
  });

  it('down payment amount is correct', () => {
    const r = config.calculate({
      homePrice: '350000',
      downPaymentPct: '5',
      interestRate: '6.5',
      loanTerm: '30',
    });
    const down = parseMoney(getValue(r, 'downPayment'));
    expect(down).toBeCloseTo(17500, -1); // 350000 * 0.05 = 17500
  });
});
