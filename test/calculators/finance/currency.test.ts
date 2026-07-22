import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/currency';
import { getValue, near, parseNumber } from '../../helpers';

describe('currency', () => {
  it('same currency conversion shows 1:1 rate', () => {
    const r = config.calculate({
      amount: '1000',
      fromCurrency: 'USD',
      toCurrency: 'USD',
    });
    near(parseNumber(getValue(r, 'result')), 1000);
    expect(getValue(r, 'rate')).toContain('1 USD = 1.0000');
  });

  it('different currencies shows loading state with from/to labels', () => {
    const r = config.calculate({
      amount: '500',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
    });
    expect(getValue(r, 'loading')).toBe('Fetching live exchange rate...');
    expect(getValue(r, 'from')).toBe('500 USD');
    expect(getValue(r, 'to')).toBe('EUR');
  });

  it('accepts different currencies without issue', () => {
    const r = config.calculate({
      amount: '2500',
      fromCurrency: 'GBP',
      toCurrency: 'JPY',
    });
    expect(getValue(r, 'loading')).toBe('Fetching live exchange rate...');
    expect(getValue(r, 'from')).toBe('2,500 GBP');
    expect(getValue(r, 'to')).toBe('JPY');
  });

  it('zero amount returns empty', () => {
    const r = config.calculate({
      amount: '0',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
    });
    expect(r).toEqual([]);
  });

  it('negative amount returns empty', () => {
    const r = config.calculate({
      amount: '-100',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
    });
    expect(r).toEqual([]);
  });

  it('empty amount returns empty', () => {
    const r = config.calculate({
      amount: '',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
    });
    expect(r).toEqual([]);
  });
});
