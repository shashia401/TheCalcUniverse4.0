import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/ecommerce/cac/index';
import { getResult, getValue, parseMoney, parseNumber, near } from '../../helpers';

const run = (v: Record<string, string>) =>
  config.calculate({ totalMarketingSpend: '', newCustomers: '', ltv: '', avgOrderValue: '', grossMarginPct: '', ordersPerMonth: '', ...v });

describe('CAC audit (CAC = spend / new customers; payback = CAC / (AOV x GM x orders/month))', () => {
  it('Derek DTC example: 50000/500 = $100, LTV 400 -> 4.00x', () => {
    const r = run({ totalMarketingSpend: '50000', newCustomers: '500', ltv: '400' });
    near(parseMoney(getValue(r, 'cac')), 100);
    expect(getValue(r, 'ltvCac')).toBe('4.00x');
  });
  it('Lisa SaaS example: CAC 300, GP/month 160 -> 1.9 months', () => {
    const r = run({ totalMarketingSpend: '30000', newCustomers: '100', avgOrderValue: '200', grossMarginPct: '80' });
    near(parseMoney(getValue(r, 'cac')), 300);
    expect(getValue(r, 'payback')).toBe('1.9 months');
  });
  it('Mateo example: blended CAC from channel mix is 37.10, payback 37.10/41.25 = 0.9', () => {
    const blended = 0.3 * 5 + 0.2 * 3 + 0.25 * 55 + 0.25 * 85;
    expect(blended).toBeCloseTo(37.1, 10);
    const r = run({ totalMarketingSpend: '14840', newCustomers: '400', avgOrderValue: '75', grossMarginPct: '55' });
    near(parseMoney(getValue(r, 'cac')), 37.1);
    expect(getValue(r, 'payback')).toBe('0.9 months');
  });
  it('payback honours orders per month (one order every 4 months => 4x slower)', () => {
    const base = { totalMarketingSpend: '10000', newCustomers: '100', avgOrderValue: '50', grossMarginPct: '50' };
    // CAC 100, GP per order 25 => 4 orders => 4 months at 1/month, 16 months at 0.25/month
    expect(getValue(run(base), 'payback')).toBe('4.0 months');
    expect(getValue(run({ ...base, ordersPerMonth: '0.25' }), 'payback')).toBe('16.0 months');
    expect(getResult(run({ ...base, ordersPerMonth: '0.25' }), 'payback').color).toBe('neutral'); // 12 < 16 <= 24
  });
  it('colour is chosen from the DISPLAYED ratio (2.996 shows 3.00x -> positive)', () => {
    // CAC = 100.1001..., LTV 300 => ratio 2.9970 -> displays 3.00x
    const r = run({ totalMarketingSpend: '10010', newCustomers: '100', ltv: '300.0' });
    expect(getValue(r, 'ltvCac')).toBe('3.00x');
    expect(getResult(r, 'ltvCac').color).toBe('positive');
  });
  it('zero spend: CAC $0, LTV:CAC N/A, no NaN', () => {
    const r = run({ totalMarketingSpend: '0', newCustomers: '10', ltv: '100' });
    expect(getValue(r, 'ltvCac')).toBe('N/A (no spend)');
    expect(parseNumber(getValue(r, 'cac'))).toBe(0);
  });
  it('invalid input returns []', () => {
    expect(run({ totalMarketingSpend: '100', newCustomers: '0' })).toEqual([]);
    expect(run({ totalMarketingSpend: '-5', newCustomers: '5' })).toEqual([]);
  });
});
