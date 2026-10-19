import { describe, it, expect } from 'vitest';
import type { CalculatorConfig, ExplainStep } from '../../../src/types/calculator';
import { rangeErrors, seedDefaults } from '../../../src/lib/initialForm';
import engagement from '../../../src/calculators/ecommerce/engagement-rate';
import saas from '../../../src/calculators/ecommerce/saas-ltv-cac';
import youtube from '../../../src/calculators/ecommerce/youtube-revenue';

// Oracle: every pinned number below was computed independently in Python's decimal module (50-digit precision,
// ROUND_HALF_UP, `python -I`), not by running the calculators.

type V = Record<string, string>;
const steps = (c: CalculatorConfig, v: V): ExplainStep[] => c.explainSteps!(v);
const strip = (s: string) => s.replace(/(\d),(?=\d{3})/g, '$1');
const exprs = (c: CalculatorConfig, v: V) => steps(c, v).map((s) => strip(s.expr));

/** One array of required substrings per step; the step count must match exactly. */
function expectSteps(c: CalculatorConfig, v: V, expected: string[][]) {
  const out = exprs(c, v);
  expect(out).toHaveLength(expected.length);
  expected.forEach((subs, i) => {
    for (const s of subs) expect(out[i], `step ${i + 1}`).toContain(s);
  });
  for (const s of steps(c, v)) {
    expect(s.label.length).toBeGreaterThan(0);
    expect(`${s.label} ${s.expr} ${s.note ?? ''}`).not.toMatch(/NaN|Infinity|undefined/);
  }
}

const ALL: [string, CalculatorConfig][] = [['engagement-rate', engagement], ['saas-ltv-cac', saas], ['youtube-revenue', youtube]];

describe('ecommerce explainSteps (batch 2) - default values give a worked solution', () => {
  for (const [name, config] of ALL) {
    it(name, () => {
      const v = seedDefaults(config.inputs);
      if (config.calculate(v).length === 0) return;
      const s = steps(config, v);
      expect(s.length).toBeGreaterThanOrEqual(1);
      expect(s.length).toBeLessThanOrEqual(8);
    });
  }
});

describe('ecommerce explainSteps (batch 2) - blank, invalid and runaway input never print NaN/Infinity', () => {
  for (const [name, config] of ALL) {
    it(`${name}: empty values -> []`, () => {
      const blank = Object.fromEntries(config.inputs.map((i) => [i.id, '']));
      expect(steps(config, blank)).toEqual([]);
    });
    it(`${name}: junk in every number field is either clean or empty`, () => {
      for (const junk of ['abc', '-1', '0', '1e999', '1e308']) {
        const v = seedDefaults(config.inputs);
        for (const i of config.inputs) if (i.type === 'number') v[i.id] = junk;
        if (Object.keys(rangeErrors(config.inputs, v)).length) continue;
        const s = steps(config, v);
        if (config.calculate(v).length === 0) expect(s, `junk ${junk}`).toEqual([]);
        for (const st of s) expect(`${st.label} ${st.expr} ${st.note ?? ''}`, `junk ${junk}`).not.toMatch(/NaN|Infinity|undefined/);
      }
    });
    it(`${name}: one runaway field at a time stays clean`, () => {
      for (const i of config.inputs) {
        if (i.type !== 'number') continue;
        for (const junk of ['1e999', '1e308', '-1e308']) {
          const v = seedDefaults(config.inputs);
          v[i.id] = junk;
          if (Object.keys(rangeErrors(config.inputs, v)).length) continue;
          for (const st of steps(config, v)) expect(`${st.label} ${st.expr} ${st.note ?? ''}`, `${i.id}=${junk}`).not.toMatch(/NaN|Infinity|undefined/);
        }
      }
    });
  }
});

describe('engagement-rate explainSteps', () => {
  const v = { platform: 'instagram', followers: '10000', likes: '500', comments: '25', shares: '30', saves: '20' };
  it('instagram counts likes, comments, shares and saves', () => {
    expectSteps(engagement, v, [['500 likes + 25 comments + 30 shares + 20 saves = 575'], ['575 ÷ 10000 × 100 = 5.75%']]);
  });
  it('X ignores saves', () => {
    expectSteps(engagement, { ...v, platform: 'x' }, [['500 likes + 25 comments + 30 shares = 555'], ['555 ÷ 10000 × 100 = 5.55%']]);
    expect(steps(engagement, { ...v, platform: 'x' })[0].note).toContain('X does not show public saves');
  });
  it('blank optional shares and saves count as zero', () => {
    expectSteps(engagement, { platform: 'tiktok', followers: '12500', likes: '410', comments: '37', shares: '', saves: '' }, [
      ['410 likes + 37 comments + 0 shares + 0 saves = 447'],
      ['447 ÷ 12500 × 100 = 3.58%'],
    ]);
  });
  it('zero or blank followers, negative likes -> []', () => {
    expect(steps(engagement, { ...v, followers: '0' })).toEqual([]);
    expect(steps(engagement, { ...v, followers: '' })).toEqual([]);
    expect(steps(engagement, { ...v, likes: '-5' })).toEqual([]);
    expect(steps(engagement, { ...v, comments: '' })).toEqual([]);
  });
});

describe('saas-ltv-cac explainSteps', () => {
  const v = { arpu: '50', monthlyChurnRate: '5', totalMarketingSpend: '10000', newCustomersAcquired: '100', grossMargin: '80' };
  it('lifetime, LTV, CAC, ratio and payback', () => {
    expectSteps(saas, v, [
      ['1 ÷ 0.05 = 20.0 months'],
      ['$50.00 × 20.0 months × 80% = $800.00'],
      ['$10000.00 ÷ 100 = $100.00'],
      ['$800.00 ÷ $100.00 = 8.00:1'],
      ['$100.00 ÷ ($50.00 × 80%) = 2.5 months'],
    ]);
  });
  it('low churn hits the 120 month lifetime cap', () => {
    expectSteps(saas, { arpu: '99', monthlyChurnRate: '0.5', totalMarketingSpend: '30000', newCustomersAcquired: '120', grossMargin: '75' }, [
      ['1 ÷ 0.005 would be longer than 120 months, so lifetime is capped at 120.0 months'],
      ['$99.00 × 120.0 months × 75% = $8910.00'],
      ['$30000.00 ÷ 120 = $250.00'],
      ['$8910.00 ÷ $250.00 = 35.64:1'],
      ['$250.00 ÷ ($99.00 × 75%) = 3.4 months'],
    ]);
  });
  it('zero churn is capped without dividing by zero', () => {
    const out = exprs(saas, { arpu: '20', monthlyChurnRate: '0', totalMarketingSpend: '8000', newCustomersAcquired: '40', grossMargin: '90' });
    expect(out[0]).toBe('Churn is 0%, so lifetime is capped at 120.0 months');
    expect(out[1]).toContain('$20.00 × 120.0 months × 90% = $2160.00');
    expect(out[3]).toContain('$2160.00 ÷ $200.00 = 10.80:1');
    expect(out[4]).toContain('$200.00 ÷ ($20.00 × 90%) = 11.1 months');
  });
  it('0% margin has no payback step', () => {
    expectSteps(saas, { arpu: '30', monthlyChurnRate: '4', totalMarketingSpend: '5000', newCustomersAcquired: '50', grossMargin: '0' }, [
      ['1 ÷ 0.04 = 25.0 months'],
      ['$30.00 × 25.0 months × 0% = $0.00'],
      ['$5000.00 ÷ 50 = $100.00'],
      ['$0.00 ÷ $100.00 = 0.00:1'],
    ]);
  });
  it('no spend has no ratio step; a blank margin means 80%', () => {
    const s = steps(saas, { ...v, totalMarketingSpend: '0', grossMargin: '' });
    expect(s).toHaveLength(4);
    expect(strip(s[1].expr)).toContain('× 80% = $800.00');
    expect(strip(s[3].expr)).toContain('$0.00 ÷ ($50.00 × 80%) = 0.0 months');
  });
  it('invalid input -> []', () => {
    expect(steps(saas, { ...v, arpu: '0' })).toEqual([]);
    expect(steps(saas, { ...v, newCustomersAcquired: '0' })).toEqual([]);
    expect(steps(saas, { ...v, monthlyChurnRate: '-1' })).toEqual([]);
    expect(steps(saas, { ...v, totalMarketingSpend: '-5' })).toEqual([]);
    expect(steps(saas, { ...v, arpu: '' })).toEqual([]);
  });
});

describe('youtube-revenue explainSteps', () => {
  const v = { dailyViews: '10000', niche: 'tech', cpm: '8', adRate: '50' };
  it('your own CPM is multiplied through and labelled as your assumption', () => {
    expectSteps(youtube, v, [
      ['$8.00 per 1000 ad views, as you entered it'],
      ['50% × $8.00 × 55% = $2.20 per 1000 views'],
      ['10000 ÷ 1000 × $2.20 = $22.00'],
      ['$22.00 × 365 = $8030.00'],
      ['$8030.00 ÷ 12 = $669.17'],
    ]);
    const s = steps(youtube, v);
    expect(s[0].label).toBe('CPM (your assumption)');
    expect(s[1].note).toContain('your assumption');
  });
  it('custom ad share and fractional RPM', () => {
    expectSteps(youtube, { dailyViews: '24000', niche: 'tech', cpm: '12.5', adRate: '60' }, [
      ['$12.50 per 1000 ad views'],
      ['60% × $12.50 × 55% = $4.125 per 1000 views'],
      ['24000 ÷ 1000 × $4.125 = $99.00'],
      ['$99.00 × 365 = $36135.00'],
      ['$36135.00 ÷ 12 = $3011.25'],
    ]);
  });
  it('blank CPM uses the niche planning midpoint, labelled as an assumption not a fact', () => {
    const w = { dailyViews: '12000', niche: 'tech', cpm: '', adRate: '' };
    expectSteps(youtube, w, [
      ['Tech planning range $8.00 to $15.00, midpoint $11.50'],
      ['50% × $11.50 × 55% = $3.1625 per 1000 views'],
      ['12000 ÷ 1000 × $3.1625 = $37.95'],
      ['$37.95 × 365 = $13851.75'],
      ['$13851.75 ÷ 12 = $1154.31'],
    ]);
    const s = steps(youtube, w);
    expect(s[0].label).toBe('CPM (planning assumption)');
    expect(s[0].note).toContain('not a YouTube-published figure');
  });
  it('0% of views showing an ad gives zero revenue', () => {
    const out = exprs(youtube, { dailyViews: '5000', niche: 'tech', cpm: '', adRate: '0' });
    expect(out[1]).toContain('0% × $11.50 × 55% = $0.00 per 1000 views');
    expect(out[2]).toContain('= $0.00');
  });
  it('invalid input -> []', () => {
    expect(steps(youtube, { ...v, dailyViews: '0' })).toEqual([]);
    expect(steps(youtube, { ...v, dailyViews: '' })).toEqual([]);
    expect(steps(youtube, { ...v, niche: '' })).toEqual([]);
    expect(steps(youtube, { ...v, niche: 'nope' })).toEqual([]);
    expect(steps(youtube, { ...v, adRate: '101' })).toEqual([]);
    expect(steps(youtube, { ...v, adRate: '-1' })).toEqual([]);
  });
});
