import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/ecommerce/cpm-cpc/index';
import { getResult, getValue, parseMoney, near } from '../../helpers';

const run = (v: Record<string, string>) =>
  config.calculate({ mode: 'cpm-from-spend', adSpend: '', impressions: '', clicks: '', targetCpm: '', desiredImpressions: '', ...v });

describe('CPM/CPC audit (CPM = spend/impr x 1000, CPC = spend/clicks, CTR = clicks/impr)', () => {
  it('diagram example: $5000 / 500000 impressions = $10 CPM; / 2500 clicks = $2 CPC; CTR 0.5%', () => {
    const r = run({ adSpend: '5000', impressions: '500000', clicks: '2500' });
    near(parseMoney(getValue(r, 'cpm')), 10);
    near(parseMoney(getValue(r, 'cpc')), 2);
    expect(getValue(r, 'ctr')).toBe('0.50%');
  });
  it('identity CPM = CPC x CTR% x 10 (educational text: 0.50 x 2 x 10 = 10)', () => {
    const r = run({ adSpend: '1000', impressions: '100000', clicks: '2000' });
    const cpm = parseMoney(getValue(r, 'cpm'));
    const cpc = parseMoney(getValue(r, 'cpc'));
    const ctr = parseFloat(getValue(r, 'ctr'));
    near(cpm, cpc * ctr * 10);
    near(cpm, 10);
    near(cpc, 0.5);
  });
  it('educational examples: $12 CPM + 2% CTR -> $0.60 CPC; $3 CPM + 0.2% CTR -> $1.50 CPC', () => {
    expect(12 / (2 * 10)).toBeCloseTo(0.6, 10);
    expect(3 / (0.2 * 10)).toBeCloseTo(1.5, 10);
  });
  it('cpc mode derives CPM only when impressions are given', () => {
    const r = run({ mode: 'cpc-from-spend', adSpend: '600', clicks: '1200', impressions: '50000' });
    near(parseMoney(getValue(r, 'cpc')), 0.5);
    near(parseMoney(getValue(r, 'cpm')), 12);
    expect(run({ mode: 'cpc-from-spend', adSpend: '600', clicks: '1200' }).some((x) => x.id === 'cpm')).toBe(false);
  });
  it('reverse budget: $12 CPM x 500,000 / 1000 = $6,000 (FAQ)', () => {
    const r = run({ mode: 'reverse-budget', targetCpm: '12', desiredImpressions: '500000' });
    near(parseMoney(getValue(r, 'requiredBudget')), 6000);
  });
  it('clicks > impressions warns (CTR above 100% is impossible)', () => {
    const r = run({ adSpend: '10', impressions: '100', clicks: '500' });
    expect(getResult(r, 'cpm').warning).toMatch(/100%/);
  });
  it('no invented industry benchmark row any more', () => {
    expect(run({ adSpend: '5000', impressions: '500000', clicks: '2500' }).some((x) => x.id === 'benchmarkNote')).toBe(false);
  });
  it('invalid inputs return []', () => {
    expect(run({ adSpend: '10', impressions: '0' })).toEqual([]);
    expect(run({ mode: 'cpc-from-spend', adSpend: '10', clicks: '' })).toEqual([]);
    expect(run({ mode: 'reverse-budget', targetCpm: '5', desiredImpressions: '0' })).toEqual([]);
  });
});
