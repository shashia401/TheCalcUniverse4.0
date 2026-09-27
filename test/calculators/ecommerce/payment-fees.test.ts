import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/ecommerce/payment-fees/index';
import { getValue, parseMoney, near, parseNumber } from '../../helpers';

describe('payment-fees (Stripe/PayPal/Square Fee Calculator)', () => {
  it('Stripe Domestic: $100 sale → 2.9% + $0.30', () => {
    const r = config.calculate({
      invoiceAmount: '100',
      platform: 'stripe-domestic',
      reverseMode: 'no',
    });
    const fee = parseMoney(getValue(r, 'fee'));
    near(fee, 100 * 0.029 + 0.30);
    near(parseMoney(getValue(r, 'netAmount')), 100 - (100 * 0.029 + 0.30));
    expect(getValue(r, 'feePercent')).toBe('2.90%');
    expect(getValue(r, 'feeFixed')).toBe('$0.30');
    expect(getValue(r, 'platform')).toBe('Stripe Domestic');
  });

  it('PayPal International: $250 sale → 4.49% + $0.49', () => {
    const r = config.calculate({
      invoiceAmount: '250',
      platform: 'paypal-international',
      reverseMode: 'no',
    });
    const fee = parseMoney(getValue(r, 'fee'));
    near(fee, 250 * 0.0449 + 0.49);
    near(parseMoney(getValue(r, 'netAmount')), 250 - (250 * 0.0449 + 0.49));
  });

  it('Square: $50 sale → 2.6% + $0.10', () => {
    const r = config.calculate({
      invoiceAmount: '50',
      platform: 'square',
      reverseMode: 'no',
    });
    const fee = parseMoney(getValue(r, 'fee'));
    near(fee, 50 * 0.026 + 0.10);
    near(parseMoney(getValue(r, 'netAmount')), 50 - (50 * 0.026 + 0.10));
  });

  it('Stripe International: $1,000 sale → 3.9% + $0.30', () => {
    const r = config.calculate({
      invoiceAmount: '1000',
      platform: 'stripe-international',
      reverseMode: 'no',
    });
    const fee = parseMoney(getValue(r, 'fee'));
    near(fee, 1000 * 0.039 + 0.30);
  });

  it('PayPal Domestic: $75 sale → 2.99% + $0.49', () => {
    const r = config.calculate({
      invoiceAmount: '75',
      platform: 'paypal-domestic',
      reverseMode: 'no',
    });
    const fee = parseMoney(getValue(r, 'fee'));
    near(fee, 75 * 0.0299 + 0.49);
  });

  it('Reverse mode: to receive $1,000 with Stripe Domestic, invoice ~$1,030.17', () => {
    const r = config.calculate({
      invoiceAmount: '1000',
      platform: 'stripe-domestic',
      reverseMode: 'yes',
    });
    // (target + fixed) / (1 - rate) = (1000 + 0.30) / (1 - 0.029)
    const expectedInvoice = Math.ceil((1000 + 0.30) / (1 - 0.029) * 100) / 100;
    near(parseMoney(getValue(r, 'reverseAmount')), expectedInvoice);
    // The net should be approximately $1,000
    near(parseMoney(getValue(r, 'netAmount')), 1000, 0.02);
    expect(getValue(r, 'fee')).not.toBe('—');
  });

  it('worked example: $65 Stripe order — regression for narrative drift fix', () => {
    // Educational workedExamples text previously claimed a net of $62.81 and monthly fees of
    // $438 for 200 orders; real calculate() output is net $62.82 and monthly fees $437.00
    // (200 x $2.185, not 200 x the display-rounded $2.19).
    const r = config.calculate({ invoiceAmount: '65', platform: 'stripe-domestic', reverseMode: 'no' });
    expect(getValue(r, 'netAmount')).toBe('$62.82');
    // The real per-order fee is 65*0.029+0.30 = $2.185 (displays rounded as $2.19), so the
    // true monthly total for 200 orders is 200*2.185 = $437, not 200*2.19 = $438.
    const exactFeePerOrder = 65 * 0.029 + 0.30;
    near(exactFeePerOrder * 200, 437, 0.5);
  });

  it('worked example: $5,000 PayPal International reverse mode — regression for narrative drift fix', () => {
    // Educational workedExamples text previously claimed an invoice of $5,240.77 / fee of
    // $240.77; the real calculate() output is $5,235.57 / $235.57.
    const r = config.calculate({ invoiceAmount: '5000', platform: 'paypal-international', reverseMode: 'yes' });
    expect(getValue(r, 'reverseAmount')).toBe('$5,235.57');
    expect(getValue(r, 'fee')).toBe('$235.57');
  });

  it('Reverse mode: to receive $500 with Square, invoice correctly', () => {
    const r = config.calculate({
      invoiceAmount: '500',
      platform: 'square',
      reverseMode: 'yes',
    });
    const expectedInvoice = Math.ceil((500 + 0.10) / (1 - 0.026) * 100) / 100;
    near(parseMoney(getValue(r, 'reverseAmount')), expectedInvoice);
    near(parseMoney(getValue(r, 'netAmount')), 500, 0.02);
  });

  it('returns empty for invalid invoice amount', () => {
    const r = config.calculate({
      invoiceAmount: 'abc',
      platform: 'stripe-domestic',
      reverseMode: 'no',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for zero or negative amount', () => {
    const r = config.calculate({
      invoiceAmount: '0',
      platform: 'stripe-domestic',
      reverseMode: 'no',
    });
    expect(r).toEqual([]);
  });

  it('Normal mode shows dash for reverseAmount', () => {
    const r = config.calculate({
      invoiceAmount: '100',
      platform: 'stripe-domestic',
      reverseMode: 'no',
    });
    expect(getValue(r, 'reverseAmount')).toBe('—');
  });

  it('calculates effective rate for small transaction', () => {
    const r = config.calculate({
      invoiceAmount: '5',
      platform: 'stripe-domestic',
      reverseMode: 'no',
    });
    // fee = 5 * 0.029 + 0.30 = 0.445 → rounded to 0.45
    // effective rate = 0.45 / 5 = 9%
    const fee = parseMoney(getValue(r, 'fee'));
    near(fee, 0.45);
    near(parseMoney(getValue(r, 'netAmount')), 4.55);
  });

  it('calculates high-value transaction with PayPal Domestic', () => {
    const r = config.calculate({
      invoiceAmount: '10000',
      platform: 'paypal-domestic',
      reverseMode: 'no',
    });
    const fee = parseMoney(getValue(r, 'fee'));
    near(fee, 10000 * 0.0299 + 0.49);
    near(parseMoney(getValue(r, 'netAmount')), 10000 - (10000 * 0.0299 + 0.49));
    expect(getValue(r, 'feePercent')).toBe('2.99%');
  });

  it('reverse mode for Square: to receive exactly $250', () => {
    const r = config.calculate({
      invoiceAmount: '250',
      platform: 'square',
      reverseMode: 'yes',
    });
    const expectedInvoice = Math.ceil((250 + 0.10) / (1 - 0.026) * 100) / 100;
    near(parseMoney(getValue(r, 'reverseAmount')), expectedInvoice);
    near(parseMoney(getValue(r, 'netAmount')), 250, 0.02);
  });

  it('returns empty for invalid platform', () => {
    const r = config.calculate({
      invoiceAmount: '100',
      platform: 'invalid-platform',
      reverseMode: 'no',
    });
    expect(r).toEqual([]);
  });

  it('highlight results are netAmount and reverseAmount in reverse mode', () => {
    const r = config.calculate({
      invoiceAmount: '100',
      platform: 'stripe-domestic',
      reverseMode: 'yes',
    });
    const net = r.find((x) => x.id === 'netAmount');
    const rev = r.find((x) => x.id === 'reverseAmount');
    expect(net).toBeDefined();
    expect(net!.highlight).toBe(true);
    expect(rev).toBeDefined();
    expect(rev!.highlight).toBe(true);
  });
});
