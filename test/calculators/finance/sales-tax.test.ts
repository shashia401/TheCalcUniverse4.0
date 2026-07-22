import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/sales-tax';
import { getValue, parseMoney, near } from '../../helpers';

describe('sales-tax', () => {
  it('add mode: $100 + 8% tax = $108 total, $8 tax', () => {
    const r = config.calculate({
      mode: 'add',
      amount: '100',
      taxRate: '8',
    });
    near(parseMoney(getValue(r, 'grossPrice')), 108);
    near(parseMoney(getValue(r, 'taxAmount')), 8);
    near(parseMoney(getValue(r, 'netPrice')), 100);
  });

  it('add mode: $50 + 8.875% NYC tax = $54.4375', () => {
    const r = config.calculate({
      mode: 'add',
      amount: '50',
      taxRate: '8.875',
    });
    near(parseMoney(getValue(r, 'grossPrice')), 54.4375, 0.005);
  });

  it('remove mode: $108 inclusive of 8% tax → net $100, tax $8', () => {
    const r = config.calculate({
      mode: 'remove',
      amount: '108',
      taxRate: '8',
    });
    near(parseMoney(getValue(r, 'netPrice')), 100);
    near(parseMoney(getValue(r, 'taxAmount')), 8);
    near(parseMoney(getValue(r, 'grossPrice')), 108);
  });

  it('add then remove round-trips: $123.45 + 7% then remove 7% = $123.45', () => {
    const added = config.calculate({
      mode: 'add',
      amount: '123.45',
      taxRate: '7',
    });
    const gross = parseMoney(getValue(added, 'grossPrice'));
    const removed = config.calculate({
      mode: 'remove',
      amount: gross.toString(),
      taxRate: '7',
    });
    near(parseMoney(getValue(removed, 'netPrice')), 123.45);
  });

  it('zero rate: tax is zero, gross = net', () => {
    const r = config.calculate({
      mode: 'add',
      amount: '100',
      taxRate: '0',
    });
    near(parseMoney(getValue(r, 'taxAmount')), 0);
    near(parseMoney(getValue(r, 'grossPrice')), 100);
  });

  it('returns empty for invalid amount', () => {
    const r = config.calculate({
      mode: 'add',
      amount: 'abc',
      taxRate: '8',
    });
    expect(r).toEqual([]);
  });
});
