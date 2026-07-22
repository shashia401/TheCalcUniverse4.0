import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/ecommerce/youtube-revenue/index';
import { getValue, parseMoney, near, parseNumber } from '../../helpers';

describe('youtube-revenue (YouTube / AdSense Revenue Calculator)', () => {
  it('Finance/Crypto: 50,000 daily views → uses midpoint CPM of $20', () => {
    const r = config.calculate({
      dailyViews: '50000',
      niche: 'finance-crypto',
    });
    const fillRate = 0.5;
    const cpm = 20;
    const daily = 50000 * fillRate / 1000 * cpm;
    const monthly = daily * 30;
    const yearly = monthly * 12;

    near(parseMoney(getValue(r, 'dailyRevenue')), daily);
    near(parseMoney(getValue(r, 'monthlyRevenue')), monthly);
    near(parseMoney(getValue(r, 'yearlyRevenue')), yearly);
    expect(getValue(r, 'effectiveCpm')).toBe('$20.00');
    expect(getValue(r, 'niche')).toBe('Finance / Crypto');
    expect(getValue(r, 'fillRate')).toBe('50%');
  });

  it('Gaming: 100,000 daily views → uses midpoint CPM of $3.50', () => {
    const r = config.calculate({
      dailyViews: '100000',
      niche: 'gaming',
    });
    const cpm = 3.5;
    const daily = 100000 * 0.5 / 1000 * cpm;
    const monthly = daily * 30;

    near(parseMoney(getValue(r, 'dailyRevenue')), daily);
    near(parseMoney(getValue(r, 'monthlyRevenue')), monthly);
    expect(getValue(r, 'effectiveCpm')).toBe('$3.50');
    expect(getValue(r, 'niche')).toBe('Gaming');
  });

  it('Custom CPM override: 10,000 views, CPM $12 → uses custom CPM', () => {
    const r = config.calculate({
      dailyViews: '10000',
      niche: 'entertainment',
      cpm: '12',
    });
    const daily = 10000 * 0.5 / 1000 * 12;
    near(parseMoney(getValue(r, 'dailyRevenue')), daily);
    expect(getValue(r, 'effectiveCpm')).toBe('$12.00');
  });

  it('Calculates RPM correctly', () => {
    const r = config.calculate({
      dailyViews: '50000',
      niche: 'education',
    });
    const daily = parseMoney(getValue(r, 'dailyRevenue'));
    const rpm = daily / 50000 * 1000;
    near(parseMoney(getValue(r, 'rpm')), rpm);
  });

  it('Monthly views = dailyViews × 30', () => {
    const r = config.calculate({
      dailyViews: '7500',
      niche: 'tech',
    });
    const monthlyViews = parseNumber(getValue(r, 'monthlyViews'));
    near(monthlyViews, 7500 * 30, 1);
  });

  it('Education niche uses midpoint CPM of $14', () => {
    const r = config.calculate({
      dailyViews: '20000',
      niche: 'education',
    });
    expect(getValue(r, 'effectiveCpm')).toBe('$14.00');
  });

  it('Music niche uses midpoint CPM of $2', () => {
    const r = config.calculate({
      dailyViews: '20000',
      niche: 'music',
    });
    expect(getValue(r, 'effectiveCpm')).toBe('$2.00');
  });

  it('Tech niche uses midpoint CPM of $11.50', () => {
    const r = config.calculate({
      dailyViews: '20000',
      niche: 'tech',
    });
    expect(getValue(r, 'effectiveCpm')).toBe('$11.50');
  });

  it('Vlogging niche uses midpoint CPM of $5.50', () => {
    const r = config.calculate({
      dailyViews: '20000',
      niche: 'vlogging',
    });
    expect(getValue(r, 'effectiveCpm')).toBe('$5.50');
  });

  it('Watch time shows when provided', () => {
    const r = config.calculate({
      dailyViews: '10000',
      niche: 'entertainment',
      watchTimeHours: '5',
    });
    expect(getValue(r, 'watchTimeResult')).toBe('833.3 hrs');
  });

  it('Engagement rate shows when provided', () => {
    const r = config.calculate({
      dailyViews: '10000',
      niche: 'entertainment',
      engagementRate: '4',
    });
    expect(getValue(r, 'engagementResult')).toBe('400');
  });

  it('returns empty for invalid daily views', () => {
    const r = config.calculate({
      dailyViews: 'abc',
      niche: 'gaming',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for zero daily views', () => {
    const r = config.calculate({
      dailyViews: '0',
      niche: 'gaming',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid niche', () => {
    const r = config.calculate({
      dailyViews: '10000',
      niche: '',
    });
    expect(r).toEqual([]);
  });
});
