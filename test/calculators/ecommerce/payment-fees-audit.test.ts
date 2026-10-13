import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/ecommerce/payment-fees/index';
import { FEE_MAP, forwardFee, reverseInvoice } from '../../../src/calculators/ecommerce/payment-fees/paymentMath';
import { getValue, parseMoney, near } from '../../helpers';

const run = (invoiceAmount: string, platform: string, reverseMode = 'no') =>
  config.calculate({ invoiceAmount, platform, reverseMode });

// Published rates checked Oct 2026: Stripe 2.9% + 0.30 (+1.5% international cards); PayPal Checkout 3.49% + 0.49,
// standard cards 2.99% + 0.49, +1.50% international; Square in-person 2.6% + 0.15.
describe('payment-fees audit', () => {
  it('rate table matches the published schedules', () => {
    expect(FEE_MAP['stripe-domestic']).toMatchObject({ rate: 0.029, fixed: 0.3 });
    expect(FEE_MAP['stripe-international'].rate).toBeCloseTo(0.029 + 0.015, 10);
    expect(FEE_MAP['paypal-domestic']).toMatchObject({ rate: 0.0349, fixed: 0.49 });
    expect(FEE_MAP['paypal-cards']).toMatchObject({ rate: 0.0299, fixed: 0.49 });
    expect(FEE_MAP['paypal-international'].rate).toBeCloseTo(0.0349 + 0.015, 10);
    expect(FEE_MAP.square).toMatchObject({ rate: 0.026, fixed: 0.15 });
  });
  it('Stripe quick-reference rows: $10 -> $0.59 (5.9%), $100 -> $3.20, $1000 -> $29.30 (2.93%)', () => {
    expect(getValue(run('10', 'stripe-domestic'), 'fee')).toBe('$0.59');
    expect(getValue(run('100', 'stripe-domestic'), 'fee')).toBe('$3.20');
    expect(getValue(run('1000', 'stripe-domestic'), 'fee')).toBe('$29.30');
    expect(forwardFee(10, FEE_MAP['stripe-domestic']).effectivePct).toBeCloseTo(5.9, 6);
  });
  it('$5 Stripe: fee 0.445 rounds half-up to $0.45 (9%)', () => {
    expect(getValue(run('5', 'stripe-domestic'), 'fee')).toBe('$0.45');
  });
  it('FAQ: net $100 on Stripe needs an invoice of $103.30', () => {
    const r = run('100', 'stripe-domestic', 'yes');
    expect(getValue(r, 'reverseAmount')).toBe('$103.30');
    expect(getValue(r, 'netAmount')).toBe('$100.00');
  });
  it('reverse invoice is the smallest whole-cent amount that nets at least the target', () => {
    for (const k of Object.keys(FEE_MAP)) {
      for (const target of [1, 9.99, 100, 1234.56, 5000]) {
        const f = FEE_MAP[k];
        const p = reverseInvoice(target, f);
        expect(p.net).toBeGreaterThanOrEqual(target - 1e-9);
        const cheaper = forwardFee(Math.round((p.charged - 0.01) * 100) / 100, f);
        expect(cheaper.net).toBeLessThan(target - 1e-9);
      }
    }
  });
  it('freelancer example: PayPal international net $5,000 -> invoice $5,263.12', () => {
    const r = run('5000', 'paypal-international', 'yes');
    expect(getValue(r, 'reverseAmount')).toBe('$5,263.12');
    expect(getValue(r, 'fee')).toBe('$263.12');
  });
  it('SaaS example: $50 Stripe -> $1.75 (3.5%), 3,000 tx = $5,250/mo, $63,000/yr; interchange-plus illustration $3,750', () => {
    expect(getValue(run('50', 'stripe-domestic'), 'fee')).toBe('$1.75');
    expect(1.75 * 3000).toBe(5250);
    expect(5250 * 12).toBe(63000);
    expect(150000 * 0.023 + 3000 * 0.1).toBeCloseTo(3750, 6);
  });
  it('subscription tip: 12 x $3.20 = $38.40 vs one annual $35.10', () => {
    expect(forwardFee(100, FEE_MAP['stripe-domestic']).fee * 12).toBeCloseTo(38.4, 6);
    expect(forwardFee(1200, FEE_MAP['stripe-domestic']).fee).toBeCloseTo(35.1, 6);
  });
  it('Sarah example: Stripe $2.19 vs PayPal Checkout $2.76 on $65, 200 orders', () => {
    expect(getValue(run('65', 'paypal-domestic'), 'fee')).toBe('$2.76');
    near(parseMoney(getValue(run('65', 'paypal-domestic'), 'fee')) - parseMoney(getValue(run('65', 'stripe-domestic'), 'fee')), 0.57);
  });
  it('forward-mode interpretation shows the effective rate; reverse mode shows the dash-free invoice', () => {
    const f = config.calculate({ invoiceAmount: '10', platform: 'stripe-domestic', reverseMode: 'no' });
    expect(f.find((x) => x.id === 'netAmount')!.interpretation).toMatch(/5\.90%/);
    expect(getValue(run('10', 'stripe-domestic', 'yes'), 'reverseAmount')).not.toBe('—');
  });
});
