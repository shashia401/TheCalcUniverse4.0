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
    expect(getValue(r, 'platform')).toBe('Stripe (domestic card)');
  });

  it('PayPal Checkout international: $250 sale → 4.99% + $0.49', () => {
    const r = config.calculate({
      invoiceAmount: '250',
      platform: 'paypal-international',
      reverseMode: 'no',
    });
    const fee = parseMoney(getValue(r, 'fee'));
    // 250 x 0.0499 + 0.49 = 12.965 -> 12.97 (fee rounded to the cent)
    near(fee, 12.97);
    near(parseMoney(getValue(r, 'netAmount')), 237.03);
  });

  it('Square in-person: $50 sale → 2.6% + $0.15', () => {
    const r = config.calculate({
      invoiceAmount: '50',
      platform: 'square',
      reverseMode: 'no',
    });
    const fee = parseMoney(getValue(r, 'fee'));
    near(fee, 1.45); // 1.30 + 0.15
    near(parseMoney(getValue(r, 'netAmount')), 48.55);
  });

  it('Stripe international card: $1,000 sale → 4.4% (2.9% + 1.5%) + $0.30', () => {
    const r = config.calculate({
      invoiceAmount: '1000',
      platform: 'stripe-international',
      reverseMode: 'no',
    });
    const fee = parseMoney(getValue(r, 'fee'));
    near(fee, 44.3);
  });

  it('PayPal Checkout domestic: $75 sale → 3.49% + $0.49', () => {
    const r = config.calculate({
      invoiceAmount: '75',
      platform: 'paypal-domestic',
      reverseMode: 'no',
    });
    const fee = parseMoney(getValue(r, 'fee'));
    // 75 x 0.0349 + 0.49 = 3.1075 -> 3.11
    near(fee, 3.11);
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
    // Processors round each fee to the cent: 65 x 0.029 + 0.30 = 2.185 -> $2.19, net $62.81,
    // so 200 orders cost 200 x 2.19 = $438 a month.
    const r = config.calculate({ invoiceAmount: '65', platform: 'stripe-domestic', reverseMode: 'no' });
    expect(getValue(r, 'netAmount')).toBe('$62.81');
    near(parseMoney(getValue(r, 'fee')) * 200, 438);
  });

  it('worked example: $5,000 PayPal International reverse mode — regression for narrative drift fix', () => {
    // PayPal Checkout international = 3.49% + 1.50% = 4.99% + $0.49.
    // (5000 + 0.49) / (1 - 0.0499) = 5263.12 -> fee 5263.12 x 0.0499 + 0.49 = 263.12, net exactly 5000.00.
    const r = config.calculate({ invoiceAmount: '5000', platform: 'paypal-international', reverseMode: 'yes' });
    expect(getValue(r, 'reverseAmount')).toBe('$5,263.12');
    expect(getValue(r, 'fee')).toBe('$263.12');
    expect(getValue(r, 'netAmount')).toBe('$5,000.00');
  });

  it('Reverse mode: to receive $500 with Square, invoice correctly', () => {
    const r = config.calculate({
      invoiceAmount: '500',
      platform: 'square',
      reverseMode: 'yes',
    });
    const expectedInvoice = Math.ceil((500 + 0.15) / (1 - 0.026) * 100) / 100;
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

  it('calculates high-value transaction with PayPal standard card rate', () => {
    const r = config.calculate({
      invoiceAmount: '10000',
      platform: 'paypal-cards',
      reverseMode: 'no',
    });
    const fee = parseMoney(getValue(r, 'fee'));
    near(fee, 299.49); // 10000 x 0.0299 + 0.49
    near(parseMoney(getValue(r, 'netAmount')), 9700.51);
    expect(getValue(r, 'feePercent')).toBe('2.99%');
  });

  it('reverse mode for Square: to receive exactly $250', () => {
    const r = config.calculate({
      invoiceAmount: '250',
      platform: 'square',
      reverseMode: 'yes',
    });
    const expectedInvoice = Math.ceil((250 + 0.15) / (1 - 0.026) * 100) / 100;
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
