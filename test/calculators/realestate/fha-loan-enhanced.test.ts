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
