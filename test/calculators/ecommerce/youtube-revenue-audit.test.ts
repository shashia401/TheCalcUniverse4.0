import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/ecommerce/youtube-revenue/index';
import { getResult, getValue, parseMoney, near } from '../../helpers';

const run = (v: Record<string, string>) =>
  config.calculate({ dailyViews: '', niche: 'finance-crypto', cpm: '', adRate: '', watchTimeHours: '', engagementRate: '', ...v });

// Revenue = views/1000 x ad share x CPM x 55% creator share; year = 365 days; month = 365/12. Hand-derived.
describe('youtube-revenue audit', () => {
  it('finance 5000/day, CPM $20: RPM 5.50, $27.50/day, $836.46/mo, $10,037.50/yr', () => {
    const r = run({ dailyViews: '5000' });
    expect(getValue(r, 'rpm')).toBe('$5.50');
    near(parseMoney(getValue(r, 'dailyRevenue')), 27.5);
    near(parseMoney(getValue(r, 'monthlyRevenue')), 836.46);
    near(parseMoney(getValue(r, 'yearlyRevenue')), 10037.5);
    expect(getValue(r, 'monthlyViews')).toBe((152083).toLocaleString());
  });
  it('gaming 200k/day CPM 3.5: $192.50/day, $5,855.21/mo, $70,262.50/yr, RPM $0.96', () => {
    const r = run({ dailyViews: '200000', niche: 'gaming' });
    near(parseMoney(getValue(r, 'dailyRevenue')), 192.5);
    near(parseMoney(getValue(r, 'monthlyRevenue')), 5855.21);
    near(parseMoney(getValue(r, 'yearlyRevenue')), 70262.5);
    expect(getValue(r, 'rpm')).toBe('$0.96');
  });
  it('education 10k -> 50k views scale linearly', () => {
    near(parseMoney(getValue(run({ dailyViews: '10000', niche: 'education' }), 'monthlyRevenue')), 1171.04);
    near(parseMoney(getValue(run({ dailyViews: '50000', niche: 'education' }), 'monthlyRevenue')), 5855.21);
  });
  it('yearly is 365 x daily (not 360)', () => {
    const r = run({ dailyViews: '1000' });
    near(parseMoney(getValue(r, 'yearlyRevenue')), parseMoney(getValue(r, 'dailyRevenue')) * 365, 0.1);
  });
  it('ad-view share input scales revenue; 100% doubles the 50% default', () => {
    const a = parseMoney(getValue(run({ dailyViews: '5000' }), 'dailyRevenue'));
    const b = parseMoney(getValue(run({ dailyViews: '5000', adRate: '100' }), 'dailyRevenue'));
    near(b, a * 2, 0.01);
    expect(getValue(run({ dailyViews: '5000', adRate: '100' }), 'fillRate')).toBe('100%');
  });
  it('views needed for $1,000/month (FAQ): 5.50 RPM -> ~181,818 monthly views', () => {
    expect(1000 / 5.5 * 1000).toBeCloseTo(181818.18, 1);
    expect(1000 / 3.85 * 1000).toBeCloseTo(259740.26, 1);
    expect(1000 / 0.55 * 1000).toBeCloseTo(1818181.8, 0);
  });
  it('custom CPM overrides the niche midpoint', () => {
    const r = run({ dailyViews: '10000', cpm: '12' });
    expect(getValue(r, 'effectiveCpm')).toBe('$12.00');
    near(parseMoney(getValue(r, 'dailyRevenue')), 10000 / 1000 * 0.5 * 12 * 0.55);
  });
  it('no longer claims a niche label for invalid input; bad ad share returns []', () => {
    expect(run({ dailyViews: '100', adRate: '150' })).toEqual([]);
    expect(run({ dailyViews: '0' })).toEqual([]);
    expect(getResult(run({ dailyViews: '100' }), 'monthlyRevenue').interpretation).toMatch(/rough estimate/);
  });
});
