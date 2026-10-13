import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/ecommerce/etsy-fees/index';
import { getValue, parseMoney, parseNumber, near } from '../../helpers';

const run = (v: Record<string, string>) =>
  config.calculate({ itemPrice: '', shippingCharged: '', materialCost: '', shippingCost: '', offsiteAds: 'no', ...v });

// Fee schedule (US, 2026 reports): listing 0.20; transaction 6.5% of item + shipping; processing 3% + 0.25 of order total;
// Offsite Ads 12% / 15% of order total. All expected values below are hand-derived.
describe('etsy-fees audit', () => {
  it('educational example: $50 + $5 shipping => $5.675 fees (10.3%), no ads', () => {
    const r = run({ itemPrice: '50', shippingCharged: '5', materialCost: '20' });
    near(parseMoney(getValue(r, 'transactionFee')), 3.25);
    near(parseMoney(getValue(r, 'shippingFee')), 0.325, 0.006);
    near(parseMoney(getValue(r, 'paymentFee')), 1.9);
    expect(getValue(r, 'totalFees')).toBe('$5.68');
    expect(getValue(r, 'shippingFee')).toBe('$0.33');
    // 55 - 20 - 5.675
    near(parseMoney(getValue(r, 'netProfit')), 29.325, 0.006);
    expect(5.675 / 55).toBeCloseTo(0.1032, 3);
  });
  it('educational example: Offsite Ads 12% => 12.275 (22.3%), 15% => 13.925 (25.3%)', () => {
    const r12 = run({ itemPrice: '50', shippingCharged: '5', materialCost: '20', offsiteAds: 'standard' });
    near(parseMoney(getValue(r12, 'totalFees')), 12.275, 0.006);
    expect(12.275 / 55).toBeCloseTo(0.2232, 3);
    near(parseMoney(getValue(r12, 'offsiteAdsFee')), 6.6);
    const r15 = run({ itemPrice: '50', shippingCharged: '5', materialCost: '20', offsiteAds: 'qualified' });
    near(parseMoney(getValue(r15, 'totalFees')), 13.925, 0.006);
    expect(getValue(r15, 'totalFees')).toBe('$13.93');
    expect(13.925 / 55).toBeCloseTo(0.2532, 3);
  });
  it('your own postage reduces profit (shipping charged is no longer pure profit)', () => {
    const base = { itemPrice: '50', shippingCharged: '5', materialCost: '20' };
    const a = parseMoney(getValue(run(base), 'netProfit'));
    const b = parseMoney(getValue(run({ ...base, shippingCost: '4.5' }), 'netProfit'));
    near(a - b, 4.5);
  });
  it('digital item with no shipping: fees = 0.20 + 6.5% + 3% + 0.25', () => {
    const r = run({ itemPrice: '10' });
    near(parseMoney(getValue(r, 'totalFees')), 0.2 + 0.65 + 0.3 + 0.25);
    expect(parseNumber(getValue(r, 'profitMargin'))).toBeCloseTo(((10 - 1.4) / 10) * 100, 1);
  });
  it('invalid inputs return []', () => {
    expect(run({ itemPrice: '0' })).toEqual([]);
    expect(run({ itemPrice: '10', shippingCost: '-1' })).toEqual([]);
    expect(run({ itemPrice: '10', offsiteAds: 'bogus' })).toEqual([]);
  });
});
