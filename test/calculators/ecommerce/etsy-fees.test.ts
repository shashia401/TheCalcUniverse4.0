import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/ecommerce/etsy-fees/index';
import { getValue, parseMoney, parseNumber, near } from '../../helpers';

describe('etsy-fees (Etsy Fee Calculator)', () => {
  it('$50 item, $5 shipping, $20 cost, no Offsite Ads', () => {
    const r = config.calculate({
      itemPrice: '50',
      shippingCharged: '5',
      materialCost: '20',
      offsiteAds: 'no',
    });

    const totalSale = 55;
    const listingFee = 0.20;
    const transactionFee = 50 * 0.065;
    const paymentFee = totalSale * 0.03 + 0.25;
    const offsiteAdsFee = 0;
    const shippingFee = 5 * 0.065;
    const totalFees = listingFee + transactionFee + paymentFee + offsiteAdsFee + shippingFee;
    const netProfit = totalSale - 20 - totalFees;
    const profitMargin = (netProfit / totalSale) * 100;

    near(parseMoney(getValue(r, 'listingFee')), listingFee);
    near(parseMoney(getValue(r, 'transactionFee')), transactionFee);
    near(parseMoney(getValue(r, 'paymentFee')), paymentFee);
    expect(getValue(r, 'offsiteAdsFee')).toBe('$0.00');
    near(parseMoney(getValue(r, 'shippingFee')), shippingFee);
    near(parseMoney(getValue(r, 'totalFees')), totalFees);
    near(parseMoney(getValue(r, 'netProfit')), netProfit);
    near(parseNumber(getValue(r, 'profitMargin')), profitMargin, 0.5);
    near(parseMoney(getValue(r, 'totalSale')), totalSale);
  });

  it('$30 item, $0 shipping, $10 cost, no Offsite Ads', () => {
    const r = config.calculate({
      itemPrice: '30',
      shippingCharged: '0',
      materialCost: '10',
      offsiteAds: 'no',
    });

    const totalSale = 30;
    const listingFee = 0.20;
    const transactionFee = 30 * 0.065;
    const paymentFee = 30 * 0.03 + 0.25;
    const shippingFee = 0;
    const totalFees = listingFee + transactionFee + paymentFee + shippingFee;
    const netProfit = 30 - 10 - totalFees;
    const profitMargin = (netProfit / totalSale) * 100;

    near(parseMoney(getValue(r, 'netProfit')), netProfit);
    near(parseNumber(getValue(r, 'profitMargin')), profitMargin, 0.5);
  });

  it('Offsite Ads Standard (12%): $100 item, $10 shipping, $30 cost', () => {
    const r = config.calculate({
      itemPrice: '100',
      shippingCharged: '10',
      materialCost: '30',
      offsiteAds: 'standard',
    });

    const totalSale = 110;
    const offsiteAdsFee = totalSale * 0.12;
    near(parseMoney(getValue(r, 'offsiteAdsFee')), offsiteAdsFee);
    // Total fees should include offsite ads
    const listingFee = 0.20;
    const transactionFee = 100 * 0.065;
    const paymentFee = totalSale * 0.03 + 0.25;
    const shippingFee = 10 * 0.065;
    const totalFees = listingFee + transactionFee + paymentFee + offsiteAdsFee + shippingFee;
    near(parseMoney(getValue(r, 'totalFees')), totalFees);
  });

  it('Offsite Ads Qualified (15%): $200 item, $0 shipping, $50 cost', () => {
    const r = config.calculate({
      itemPrice: '200',
      shippingCharged: '0',
      materialCost: '50',
      offsiteAds: 'qualified',
    });

    const totalSale = 200;
    const offsiteAdsFee = totalSale * 0.15;
    near(parseMoney(getValue(r, 'offsiteAdsFee')), offsiteAdsFee);
    expect(getValue(r, 'offsiteAdsFee')).toBe('$30.00');
  });

  it('Profit margin is negative when costs and fees exceed revenue', () => {
    const r = config.calculate({
      itemPrice: '5',
      shippingCharged: '0',
      materialCost: '10',
      offsiteAds: 'no',
    });

    const netProfit = parseMoney(getValue(r, 'netProfit'));
    expect(netProfit).toBeLessThan(0);
    const profitMargin = parseNumber(getValue(r, 'profitMargin'));
    expect(profitMargin).toBeLessThan(0);
  });

  it('returns empty for invalid item price', () => {
    const r = config.calculate({
      itemPrice: 'abc',
      shippingCharged: '0',
      materialCost: '0',
      offsiteAds: 'no',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for zero item price', () => {
    const r = config.calculate({
      itemPrice: '0',
      shippingCharged: '0',
      materialCost: '0',
      offsiteAds: 'no',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid offsite ads selection', () => {
    const r = config.calculate({
      itemPrice: '50',
      shippingCharged: '0',
      materialCost: '10',
      offsiteAds: '',
    });
    expect(r).toEqual([]);
  });

  it('Zero shipping and material cost still calculates correctly', () => {
    const r = config.calculate({
      itemPrice: '25',
      shippingCharged: '0',
      materialCost: '0',
      offsiteAds: 'no',
    });
    const totalSale = 25;
    const totalFees = 0.20 + 25 * 0.065 + 25 * 0.03 + 0.25 + 0;
    const netProfit = 25 - totalFees;

    near(parseMoney(getValue(r, 'totalFees')), totalFees);
    near(parseMoney(getValue(r, 'netProfit')), netProfit);
    near(parseNumber(getValue(r, 'profitMargin')), (netProfit / totalSale) * 100, 0.5);
  });

  it('High shipping also incurs transaction fee', () => {
    const r = config.calculate({
      itemPrice: '40',
      shippingCharged: '20',
      materialCost: '15',
      offsiteAds: 'no',
    });
    // Shipping transaction fee should be 6.5% of $20 = $1.30
    near(parseMoney(getValue(r, 'shippingFee')), 20 * 0.065);
    // Shipping transaction fee is separate from item transaction fee
    near(parseMoney(getValue(r, 'transactionFee')), 40 * 0.065);
  });
});
