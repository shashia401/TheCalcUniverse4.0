import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/heloc/index';
import { getValue, getResult, parseNumber, parseMoney, near } from '../../helpers';

describe('heloc', () => {
  it('calculates basic HELOC scenario', () => {
    const r = config.calculate({
      homeValue: '550000',
      mortgageBalance: '320000',
      maxLTV: '80',
      helocRate: '8.75',
    });
    expect(r).toHaveLength(7);
    // maxBorrowable = 550000 * 0.8 - 320000 = 120000
    near(parseMoney(getValue(r, 'maxCreditLine')), 120000, 1);
    near(parseNumber(getValue(r, 'currentLTVResult')), 58.2, 0.1);
    near(parseMoney(getValue(r, 'monthlyInterestPayment')), 875, 1);
  });

  it('returns empty for zero home value', () => {
    const r = config.calculate({ homeValue: '0' });
    expect(r).toHaveLength(0);
  });

  it('returns empty for missing required fields', () => {
    const r = config.calculate({
      homeValue: '500000',
      mortgageBalance: '300000',
    });
    expect(r).toHaveLength(0); // missing helocRate
  });

  it('uses specific draw amount for interest calculation', () => {
    const r = config.calculate({
      homeValue: '550000',
      mortgageBalance: '320000',
      maxLTV: '80',
      helocRate: '8.75',
      drawAmount: '50000',
    });
    // Monthly interest on $50,000 @ 8.75% = 50000 * 0.0875 / 12 = ~364.58
    near(parseMoney(getValue(r, 'monthlyInterestPayment')), 364.58, 0.5);
    expect(getResult(r, 'monthlyInterestPayment').label).toContain('your draw');
  });

  it('caps draw amount at max available credit line', () => {
    const r = config.calculate({
      homeValue: '300000',
      mortgageBalance: '250000',
      maxLTV: '80',
      helocRate: '8.0',
      drawAmount: '100000',
    });
    // maxBorrowable = 300000 * 0.8 - 250000 = -10000 -> 0
    near(parseMoney(getValue(r, 'maxCreditLine')), 0, 1);
    near(parseMoney(getValue(r, 'monthlyInterestPayment')), 0, 1);
  });

  it('handles 90% CLTV', () => {
    const r = config.calculate({
      homeValue: '550000',
      mortgageBalance: '320000',
      maxLTV: '90',
      helocRate: '8.75',
    });
    // maxBorrowable = 550000 * 0.9 - 320000 = 175000
    near(parseMoney(getValue(r, 'maxCreditLine')), 175000, 100);
  });

  it('reports total equity correctly', () => {
    const r = config.calculate({
      homeValue: '550000',
      mortgageBalance: '320000',
      maxLTV: '80',
      helocRate: '8.75',
    });
    near(parseMoney(getValue(r, 'totalEquityResult')), 230000, 100);
  });

  it('handles zero mortgage balance', () => {
    const r = config.calculate({
      homeValue: '500000',
      mortgageBalance: '0',
      maxLTV: '80',
      helocRate: '7.5',
    });
    near(parseMoney(getValue(r, 'maxCreditLine')), 400000, 100);
    near(parseNumber(getValue(r, 'currentLTVResult')), 0, 0.1);
  });

  it('returns empty for invalid maxLTV', () => {
    const r = config.calculate({
      homeValue: '500000',
      mortgageBalance: '300000',
      maxLTV: 'invalid',
      helocRate: '8.0',
    });
    // NaN maxLTV should trigger the guard and return empty
    expect(r).toHaveLength(0);
  });

  it('returns empty for maxLTV above 100', () => {
    const r = config.calculate({
      homeValue: '500000',
      mortgageBalance: '300000',
      maxLTV: '120',
      helocRate: '8.0',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for negative mortgage balance', () => {
    const r = config.calculate({
      homeValue: '500000',
      mortgageBalance: '-50000',
      maxLTV: '80',
      helocRate: '8.0',
    });
    expect(r).toHaveLength(0);
  });
});
