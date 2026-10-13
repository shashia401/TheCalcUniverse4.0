import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/ecommerce/engagement-rate/index';
import { getResult, getValue, near } from '../../helpers';

const run = (v: Record<string, string>) =>
  config.calculate({ platform: 'instagram', followers: '', likes: '', comments: '0', shares: '', saves: '', ...v });

describe('engagement rate audit (ER = (likes+comments+shares+saves)/followers x 100)', () => {
  it('Instagram counts saves (the field is shown for Instagram; it used to be ignored)', () => {
    // (500 + 25 + 20) / 10000 = 5.45%
    const r = run({ followers: '10000', likes: '500', comments: '25', saves: '20' });
    expect(getValue(r, 'engagementRate')).toBe('5.45%');
    expect(getValue(r, 'totalEngagements')).toBe('545');
  });
  it('TikTok counts all four', () => {
    // (500+25+30+20)/10000 = 5.75%
    const r = run({ platform: 'tiktok', followers: '10000', likes: '500', comments: '25', shares: '30', saves: '20' });
    expect(getValue(r, 'engagementRate')).toBe('5.75%');
  });
  it('X ignores saves (no public saves) but counts reposts', () => {
    // (500+25+30)/10000 = 5.55%
    const r = run({ platform: 'x', followers: '10000', likes: '500', comments: '25', shares: '30', saves: '999' });
    expect(getValue(r, 'engagementRate')).toBe('5.55%');
  });
  it('benchmark band is chosen from the displayed 2-dp rate (0.996 -> 1.00% -> typical, not low)', () => {
    const r = run({ followers: '100000', likes: '996', comments: '0' });
    expect(getValue(r, 'engagementRate')).toBe('1.00%');
    expect(getValue(r, 'benchmark')).toBe('Typical engagement');
  });
  it('band edges: 0.5% low, 3.5% typical, 3.51% high', () => {
    expect(getValue(run({ followers: '1000', likes: '5' }), 'benchmark')).toBe('Low engagement');
    expect(getValue(run({ followers: '10000', likes: '350' }), 'benchmark')).toBe('Typical engagement');
    expect(getResult(run({ followers: '10000', likes: '351' }), 'benchmark').color).toBe('positive');
  });
  it('influencer tier edges 10k / 100k / 1M', () => {
    const t = (f: string) => getValue(run({ followers: f, likes: '1' }), 'influencerTier');
    expect(t('9999')).toMatch(/^Nano/);
    expect(t('10000')).toMatch(/^Micro/);
    expect(t('100000')).toMatch(/^Macro/);
    expect(t('1000000')).toMatch(/^Mega/);
  });
  it('invalid input returns []', () => {
    near(0, 0);
    expect(run({ followers: '0', likes: '5', comments: '1' })).toEqual([]);
    expect(run({ followers: '100', likes: '', comments: '' })).toEqual([]);
  });
});
