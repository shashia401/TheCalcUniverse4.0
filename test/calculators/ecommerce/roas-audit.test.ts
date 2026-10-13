import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/ecommerce/roas/index';
import { getResult, getValue, parseMoney, near } from '../../helpers';

const run = (v: Record<string, string>) => config.calculate({ adSpend: '', revenue: '', orders: '', grossMargin: '', ...v });

// ROAS = revenue / spend; break-even ROAS = 1 / gross margin. Hand-derived expected values.
describe('roas audit', () => {
  it('Priya: 20000/5000 = 4.00x; BE at 50% = 2.00x; GP after ads = 10000 - 5000 = 5000', () => {
    const r = run({ adSpend: '5000', revenue: '20000', grossMargin: '50' });
    expect(getValue(r, 'roas')).toBe('4.00x');
    expect(getValue(r, 'minROAS')).toBe('2.00x — Profitable');
    near(parseMoney(getValue(r, 'profitAfterAds')), 5000);
    near(parseMoney(getValue(r, 'profitFromAds')), 15000);
    // scaled scenario: 15000 spend at 3.5x
    near(15000 * 3.5 * 0.5 - 15000, 11250, 1e-9);
  });
  it('Carlos: 3.5x at 20% margin is below the 5.00x break-even; GP after ads = 7000 - 10000 = -3000', () => {
    const r = run({ adSpend: '10000', revenue: '35000', grossMargin: '20' });
    expect(getValue(r, 'minROAS')).toBe('5.00x — Unprofitable');
    near(parseMoney(getValue(r, 'profitAfterAds')), -3000);
    expect(getResult(r, 'roas').color).toBe('negative');
  });
  it('Fatima Google channel: 5x, BE 1.54x at 65%; per-channel profits', () => {
    const r = run({ adSpend: '3000', revenue: '15000', grossMargin: '65' });
    expect(getValue(r, 'minROAS')).toBe('1.54x — Profitable');
    near(parseMoney(getValue(r, 'profitAfterAds')), 6750);
    near(10500 * 0.65 - 3000, 3825, 1e-9); // Facebook 3.5x on $3000
    near(5000 * 0.65 - 2000, 1250, 1e-9); // TikTok 2.5x on $2000
  });
  it('exactly at break-even is not "Profitable"; colour neutral', () => {
    const r = run({ adSpend: '1000', revenue: '2000', grossMargin: '50' });
    expect(getValue(r, 'minROAS')).toBe('2.00x — Break-even');
    expect(getResult(r, 'roas').color).toBe('neutral');
    near(parseMoney(getValue(r, 'profitAfterAds')), 0);
  });
  it('without a margin there is no good/bad colour (no invented 4x / 2x thresholds)', () => {
    expect(getResult(run({ adSpend: '100', revenue: '500' }), 'roas').color).toBe('neutral');
    expect(getResult(run({ adSpend: '100', revenue: '50' }), 'roas').color).toBe('neutral');
  });
  it('CPA uses real order count (no hard-coded order value)', () => {
    expect(getValue(run({ adSpend: '5000', revenue: '20000', orders: '400' }), 'cpa')).toBe('$12.50');
    expect(run({ adSpend: '5000', revenue: '20000' }).some((x) => x.id === 'cpa')).toBe(false);
  });
  it('discount FAQ: 50% margin BE 2.0x; at $80 with $50 cost margin is 37.5% -> BE 2.67x (+33%)', () => {
    const r = run({ adSpend: '100', revenue: '100', grossMargin: '37.5' });
    expect(getValue(r, 'minROAS')).toBe('2.67x — Unprofitable');
  });
  it('profit-per-order FAQ: $500 @15% minus $100 = -25; $300 @60% minus $100 = 80', () => {
    near(parseMoney(getValue(run({ adSpend: '100', revenue: '500', grossMargin: '15' }), 'profitAfterAds')), -25);
    near(parseMoney(getValue(run({ adSpend: '100', revenue: '300', grossMargin: '60' }), 'profitAfterAds')), 80);
  });
  it('zero revenue -> 0.00x; invalid input -> []', () => {
    expect(getValue(run({ adSpend: '100', revenue: '0' }), 'roas')).toBe('0.00x');
    expect(run({ adSpend: '0', revenue: '100' })).toEqual([]);
    expect(run({ adSpend: '100', revenue: '' })).toEqual([]);
  });
});
