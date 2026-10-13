import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/ecommerce/saas-ltv-cac/index';
import { computeSaas } from '../../../src/calculators/ecommerce/saas-ltv-cac/saasMath';
import { getResult, getValue, parseMoney, near } from '../../helpers';

const run = (v: Record<string, string>) =>
  config.calculate({ arpu: '', monthlyChurnRate: '', totalMarketingSpend: '', newCustomersAcquired: '', grossMargin: '', ...v });

// LTV = ARPU x (1/churn) x GM ; CAC = spend/customers ; payback = CAC/(ARPU x GM). Hand-derived.
describe('saas-ltv-cac audit', () => {
  const base = { arpu: '50', monthlyChurnRate: '5', totalMarketingSpend: '50000', newCustomersAcquired: '200', grossMargin: '80' };
  it('ARPU 50, churn 5%, GM 80%: lifetime 20 mo, LTV 800, CAC 250, ratio 3.2, payback 6.25', () => {
    const r = run(base);
    near(parseMoney(getValue(r, 'ltv')), 800);
    near(parseMoney(getValue(r, 'cac')), 250);
    expect(getValue(r, 'ltvCacRatio')).toBe('3.20:1');
    expect(getValue(r, 'paybackMonths')).toBe('6.3 months'); // 250/40 = 6.25 -> toFixed(1)
    expect(getValue(r, 'avgLifetimeMonths')).toBe('20.0 months');
    near(parseMoney(getValue(r, 'totalRevenue')), 50 * 200 * 20);
  });
  it('blank margin defaults to 80%', () => {
    expect(getValue(run({ ...base, grossMargin: '' }), 'ltv')).toBe(getValue(run(base), 'ltv'));
  });
  it('zero churn is capped at 120 months and labelled', () => {
    const r = run({ ...base, monthlyChurnRate: '0' });
    expect(getValue(r, 'avgLifetimeMonths')).toBe('120.0 months');
    expect(getResult(r, 'avgLifetimeMonths').label).toMatch(/capped/);
    near(parseMoney(getValue(r, 'ltv')), 50 * 120 * 0.8);
  });
  it('0% margin: payback N/A (no NaN/Infinity), LTV 0', () => {
    const r = run({ ...base, grossMargin: '0' });
    expect(getValue(r, 'paybackMonths')).toBe('N/A (0% margin)');
    expect(JSON.stringify(r)).not.toMatch(/NaN|Infinity/);
  });
  it('colour uses the displayed ratio (2.996 -> 3.00:1 -> positive)', () => {
    // cohort: LTV 800, CAC = 800/2.996
    const r = run({ ...base, totalMarketingSpend: String(250 * 200 * (3.2 / 2.996)) });
    expect(getValue(r, 'ltvCacRatio')).toBe('3.00:1');
    expect(getResult(r, 'ltvCacRatio').color).toBe('positive');
  });
  it('new MRR per $1 = ARPU x customers / spend (not the classic Magic Number)', () => {
    expect(getValue(run(base), 'newMrrPerSpend')).toBe('$0.20');
    expect(computeSaas(50, 5, 50000, 200, 80).mrrPerSpend).toBeCloseTo(0.2, 10);
  });
  it('churn FAQ: 5% -> 4% lengthens lifetime 20 -> 25 months', () => {
    expect(computeSaas(1, 5, 1, 1, 100).lifetimeMonths).toBeCloseTo(20, 10);
    expect(computeSaas(1, 4, 1, 1, 100).lifetimeMonths).toBeCloseTo(25, 10);
  });
  it('invalid input returns []', () => {
    expect(run({ ...base, arpu: '0' })).toEqual([]);
    expect(run({ ...base, newCustomersAcquired: '0' })).toEqual([]);
    expect(run({ ...base, grossMargin: 'abc' })).toEqual([]);
  });
});
