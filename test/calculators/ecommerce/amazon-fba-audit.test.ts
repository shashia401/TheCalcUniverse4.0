import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/ecommerce/amazon-fba/index';
import { referralFee, fbaFulfillmentFee, computeFba } from '../../../src/calculators/ecommerce/amazon-fba/fbaMath';
import { getValue, parseMoney, near } from '../../helpers';

// Referral schedule: sell.amazon.com/pricing (checked Oct 2026). Expected values derived by hand.
describe('amazon-fba referral fees (tiered, hand-derived)', () => {
  it('electronics 8%, general/sports 15%', () => {
    near(referralFee('electronics', 200), 16, 1e-9);
    near(referralFee('general', 20), 3, 1e-9);
    near(referralFee('sports', 100), 15, 1e-9);
  });
  it('electronics accessories: 15% of first $100 then 8%', () => {
    near(referralFee('electronics-accessories', 80), 12, 1e-9);
    near(referralFee('electronics-accessories', 150), 15 + 4, 1e-9);
  });
  it('apparel: 5% to $15, 10% $15-20, 17% above', () => {
    near(referralFee('apparel', 15), 0.75, 1e-9);
    near(referralFee('apparel', 18), 1.8, 1e-9);
    near(referralFee('apparel', 40), 6.8, 1e-9);
  });
  it('jewelry: 20% of first $250 + 5% above', () => {
    near(referralFee('jewelry', 100), 20, 1e-9);
    near(referralFee('jewelry', 400), 50 + 7.5, 1e-9);
  });
  it('beauty: 8% to $10, 15% above', () => {
    near(referralFee('beauty', 10), 0.8, 1e-9);
    near(referralFee('beauty', 30), 4.5, 1e-9);
  });
  it('$0.30 minimum applies (not to books)', () => {
    near(referralFee('electronics', 1), 0.3, 1e-9);
    near(referralFee('books', 1), 0.15, 1e-9);
  });
  it('books add the $1.80 closing fee', () => {
    const f = computeFba(20, 5, 1, 'books');
    near(f.referral, 3, 1e-9);
    near(f.closing, 1.8, 1e-9);
    const r = config.calculate({ sellingPrice: '20', productCost: '5', weight: '1', category: 'books', volume: '' });
    near(parseMoney(getValue(r, 'closingFee')), 1.8);
    // 20 - 5 - 3 - 1.8 - 3.22
    near(parseMoney(getValue(r, 'netProfit')), 6.98);
  });
});

describe('amazon-fba fulfillment (illustrative weight tiers)', () => {
  it('tier boundaries and continuity', () => {
    expect(fbaFulfillmentFee(0.5)).toBe(3.22);
    expect(fbaFulfillmentFee(2)).toBe(4.18);
    expect(fbaFulfillmentFee(3)).toBe(5.29);
    near(fbaFulfillmentFee(12), 5.29 + 9 * 0.38, 1e-9);
    near(fbaFulfillmentFee(21.0001), fbaFulfillmentFee(21), 0.01);
    near(fbaFulfillmentFee(90), 89.98, 1e-9);
    near(fbaFulfillmentFee(100), 89.98 + 8.3, 1e-9);
  });
});

describe('amazon-fba worked examples (independent arithmetic)', () => {
  it('garlic press', () => {
    const r = config.calculate({ sellingPrice: '24.99', productCost: '6.50', weight: '0.8', category: 'general', volume: '0.1' });
    // 24.99 - 6.50 - (3.7485 + 3.22 + 0.078)
    near(parseMoney(getValue(r, 'netProfit')), 11.4435);
    expect(getValue(r, 'margin')).toBe('45.8%');
    expect(getValue(r, 'roi')).toBe('176.1%');
  });
  it('dumbbells', () => {
    const r = config.calculate({ sellingPrice: '89.99', productCost: '35', weight: '12', category: 'sports', volume: '1.56' });
    near(parseMoney(getValue(r, 'netProfit')), 31.5647);
    expect(getValue(r, 'margin')).toBe('35.1%');
  });
  it('charging cable is electronics ACCESSORIES (15%), not 8%', () => {
    const r = config.calculate({ sellingPrice: '15.99', productCost: '2.80', weight: '0.2', category: 'electronics-accessories', volume: '0.02' });
    near(parseMoney(getValue(r, 'netProfit')), 7.5559);
    expect(getValue(r, 'roi')).toBe('269.9%');
  });
  it('blank volume excludes storage; invalid inputs return []', () => {
    const r = config.calculate({ sellingPrice: '10', productCost: '2', weight: '0.5', category: 'general', volume: '' });
    expect(getValue(r, 'storageFee')).toBe('$0.00/mo');
    expect(config.calculate({ sellingPrice: '', productCost: '2', weight: '1', category: 'general' })).toEqual([]);
  });
  it('negative profit is negative', () => {
    const r = config.calculate({ sellingPrice: '10', productCost: '9', weight: '1', category: 'general', volume: '' });
    // 10 - 9 - 1.5 - 3.22 = -3.72
    near(parseMoney(getValue(r, 'netProfit')), -3.72);
  });
});
