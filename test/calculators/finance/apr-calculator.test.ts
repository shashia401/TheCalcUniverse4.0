import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/apr-calculator';
import { getValue, parseMoney, parseNumber, near } from '../../helpers';

describe('apr-calculator', () => {
  it('basic calculation: APR equals nominal rate when no fees', () => {
    const r = config.calculate({
      loanAmount: '200000',
      nominalRate: '6.5',
      loanTermValue: '30',
      loanTermUnit: 'years',
      upfrontFees: '0',
    });
    expect(parseNumber(getValue(r, 'aprResult'))).toBeCloseTo(6.5, 1);
    expect(parseMoney(getValue(r, 'monthlyPaymentResult'))).toBeGreaterThan(0);
  });

  it('APR exceeds nominal rate when fees are present', () => {
    const r = config.calculate({
      loanAmount: '200000',
      nominalRate: '6.5',
      loanTermValue: '30',
      loanTermUnit: 'years',
      upfrontFees: '4000',
    });
    const apr = parseNumber(getValue(r, 'aprResult'));
    const nominal = parseNumber(getValue(r, 'nominalRateResult'));
    expect(apr).toBeGreaterThan(nominal);
  });

  it('zero-rate loan: payment = principal / months', () => {
    const r = config.calculate({
      loanAmount: '60000',
      nominalRate: '0',
      loanTermValue: '5',
      loanTermUnit: 'years',
      upfrontFees: '0',
    });
    near(parseMoney(getValue(r, 'monthlyPaymentResult')), 1000);
    near(parseMoney(getValue(r, 'totalNominalInterest')), 0);
  });

  it('term in months works correctly', () => {
    const r = config.calculate({
      loanAmount: '12000',
      nominalRate: '8',
      loanTermValue: '24',
      loanTermUnit: 'months',
      upfrontFees: '0',
    });
    expect(parseMoney(getValue(r, 'monthlyPaymentResult'))).toBeGreaterThan(0);
  });

  it('returns upfrontFeesResult as "None" when no fees', () => {
    const r = config.calculate({
      loanAmount: '100000',
      nominalRate: '5',
      loanTermValue: '10',
      loanTermUnit: 'years',
    });
    expect(getValue(r, 'upfrontFeesResult')).toBe('None');
  });

  it('returns empty when loanAmount is missing or zero', () => {
    expect(config.calculate({})).toHaveLength(0);
    expect(config.calculate({ loanAmount: '0', nominalRate: '5', loanTermValue: '10' })).toHaveLength(0);
  });

  it('netCashReceived is loan minus fees', () => {
    const r = config.calculate({
      loanAmount: '100000',
      nominalRate: '5',
      loanTermValue: '10',
      loanTermUnit: 'years',
      upfrontFees: '3000',
    });
    near(parseMoney(getValue(r, 'netCashReceivedResult')), 97000);
  });
});
