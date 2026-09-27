import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/realestate/fha-loan/index';
import { getValue, parseMoney } from '../../helpers';

describe('FHA loan calculator', () => {
  it('calculates total monthly payment with MIP', () => {
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
  });

  it('upfront MIP is 1.75% of base loan', () => {
    const r = config.calculate({
      homePrice: '200000',
      downPaymentPct: '5',
      interestRate: '6.5',
      loanTerm: '30',
    });
    // Down = 10K, base loan = 190K, upfront MIP = 190K * 0.0175 = 3325
    const upfront = parseMoney(getValue(r, 'upfrontMIP'));
    expect(upfront).toBeCloseTo(3325, -1);
  });

  it('annual MIP rate is 0.50% (not 0.55%) for 5%-9.99% down — regression for HUD ML 2023-05 fix', () => {
    // Bug: annualMIPRate used a 10% down-payment threshold for the RATE tier, but per HUD
    // Mortgagee Letter 2023-05, the 55bps rate only applies when LTV > 95% (down payment < 5%).
    // A 5% down payment (LTV 95%) should get the lower 50bps rate, not 55bps.
    const homePrice = 300000, downPaymentPct = 5, interestRate = 6.8;
    const r = config.calculate({ homePrice: String(homePrice), downPaymentPct: String(downPaymentPct), interestRate: String(interestRate), loanTerm: '30' });
    const baseLoan = homePrice * (1 - downPaymentPct / 100);
    const expectedMonthlyMIP = (baseLoan * 0.005) / 12; // 50 bps, not 55 bps
    const mip = parseMoney(getValue(r, 'monthlyMIP'));
    expect(mip).toBeCloseTo(expectedMonthlyMIP, 0);
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

  it('returns empty for invalid inputs', () => {
    const r = config.calculate({
      homePrice: '',
      downPaymentPct: '3.5',
      interestRate: '6.8',
      loanTerm: '30',
    });
    expect(r).toEqual([]);
  });
});
