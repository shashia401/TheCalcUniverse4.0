import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/vat-calculator/index';
import { getValue, parseMoney, parseNumber } from '../../helpers';

describe('vat calculator', () => {
  it('adds VAT to net price', () => {
    const r = config.calculate({
      calcMode: 'add',
      amount: '100',
      country: 'UK',
      vatRate: '20',
    });
    const gross = parseMoney(getValue(r, 'grossAmount'));
    expect(gross).toBeCloseTo(120, 0);
  });

  it('removes VAT from gross total', () => {
    const r = config.calculate({
      calcMode: 'remove',
      amount: '120',
      country: 'DE',
      vatRate: '19',
    });
    const net = parseMoney(getValue(r, 'netAmount'));
    expect(net).toBeCloseTo(100.84, 0);
  });

  it('returns empty for zero amount', () => {
    const r = config.calculate({
      calcMode: 'add',
      amount: '0',
      country: '',
      vatRate: '20',
    });
    expect(r).toEqual([]);
  });

  it('shows vat amount and share', () => {
    const r = config.calculate({
      calcMode: 'add',
      amount: '200',
      country: 'HU',
      vatRate: '27',
    });
    const vatAmount = parseMoney(getValue(r, 'vatAmount'));
    expect(vatAmount).toBeCloseTo(54, 0);
    const vatShare = parseNumber(getValue(r, 'vatShare'));
    expect(vatShare).toBeGreaterThan(20);
    expect(vatShare).toBeLessThan(22);
  });
});
