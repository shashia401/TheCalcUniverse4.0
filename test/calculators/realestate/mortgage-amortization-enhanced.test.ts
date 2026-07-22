import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/realestate/mortgage-amortization/index';
import { getValue, parseMoney } from '../../helpers';

describe('mortgage amortization calculator', () => {
  it('calculates PITI for standard inputs', () => {
    const r = config.calculate({
      homePrice: '400000',
      downPayment: '80000',
      downPaymentPct: '',
      loanTerm: '30',
      interestRate: '6.8',
      propertyTax: '1.2',
      homeInsurance: '1500',
      hoaFee: '0',
      startMonth: '',
      startYear: '',
    });
    const total = parseMoney(getValue(r, 'totalMonthly'));
    const pi = parseMoney(getValue(r, 'monthlyPI'));
    expect(total).toBeGreaterThan(pi);
  });

  it('adds PMI when down payment is under 20%', () => {
    const r = config.calculate({
      homePrice: '300000',
      downPayment: '15000',
      downPaymentPct: '',
      loanTerm: '30',
      interestRate: '6.5',
      propertyTax: '0',
      homeInsurance: '0',
      hoaFee: '0',
      startMonth: '',
      startYear: '',
    });
    const pmiResult = r.find(x => x.id === 'monthlyPMI');
    expect(pmiResult).toBeDefined();
    expect(pmiResult!.value).toContain('$');
  });

  it('uses down payment % override over dollar amount', () => {
    const r = config.calculate({
      homePrice: '400000',
      downPayment: '0',
      downPaymentPct: '20',
      loanTerm: '30',
      interestRate: '6.8',
      propertyTax: '0',
      homeInsurance: '0',
      hoaFee: '0',
      startMonth: '',
      startYear: '',
    });
    const dpResult = getValue(r, 'downPaymentLine');
    expect(dpResult).toContain('20.0%');
  });

  it('returns empty for zero home price', () => {
    const r = config.calculate({
      homePrice: '0',
      downPayment: '0',
      downPaymentPct: '',
      loanTerm: '30',
      interestRate: '6.8',
      propertyTax: '0',
      homeInsurance: '0',
      hoaFee: '0',
      startMonth: '',
      startYear: '',
    });
    expect(r).toEqual([]);
  });
});
