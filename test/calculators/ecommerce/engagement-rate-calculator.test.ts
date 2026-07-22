import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/ecommerce/engagement-rate';
import { getValue, getResult, parseNumber, near } from '../../helpers';

describe('engagement-rate', () => {
  it('calculates Instagram ER from likes and comments', () => {
    const r = config.calculate({
      platform: 'instagram',
      followers: '10000',
      likes: '500',
      comments: '25',
      shares: '',
      saves: '',
    });
    // ER = (500 + 25) / 10000 * 100 = 5.25%
    near(parseNumber(getValue(r, 'engagementRate')), 5.25);
  });

  it('calculates TikTok ER with shares and saves', () => {
    const r = config.calculate({
      platform: 'tiktok',
      followers: '5000',
      likes: '300',
      comments: '40',
      shares: '50',
      saves: '30',
    });
    // ER = (300 + 40 + 50 + 30) / 5000 * 100 = 8.4%
    near(parseNumber(getValue(r, 'engagementRate')), 8.4);
  });

  it('calculates X/Twitter ER using shares as reposts', () => {
    const r = config.calculate({
      platform: 'x',
      followers: '20000',
      likes: '400',
      comments: '30',
      shares: '20',
      saves: '',
    });
    // ER = (400 + 30 + 20) / 20000 * 100 = 2.25%
    near(parseNumber(getValue(r, 'engagementRate')), 2.25);
  });

  it('classifies low engagement rate (<1%)', () => {
    const r = config.calculate({
      platform: 'instagram',
      followers: '100000',
      likes: '500',
      comments: '50',
      shares: '',
      saves: '',
    });
    // ER = 550 / 100000 * 100 = 0.55%
    near(parseNumber(getValue(r, 'engagementRate')), 0.55);
    expect(getResult(r, 'benchmark').value).toBe('Low engagement');
  });

  it('classifies average engagement rate (1-3.5%)', () => {
    const r = config.calculate({
      platform: 'instagram',
      followers: '10000',
      likes: '200',
      comments: '20',
      shares: '',
      saves: '',
    });
    // ER = 220 / 10000 * 100 = 2.2%
    near(parseNumber(getValue(r, 'engagementRate')), 2.2);
    expect(getResult(r, 'benchmark').value).toBe('Average engagement');
  });

  it('classifies high engagement rate (>3.5%)', () => {
    const r = config.calculate({
      platform: 'instagram',
      followers: '5000',
      likes: '400',
      comments: '50',
      shares: '',
      saves: '',
    });
    // ER = 450 / 5000 * 100 = 9.0%
    near(parseNumber(getValue(r, 'engagementRate')), 9.0);
    expect(getResult(r, 'benchmark').value).toBe('High engagement');
  });

  it('returns empty array when followers is empty', () => {
    const r = config.calculate({
      platform: 'instagram',
      followers: '',
      likes: '500',
      comments: '25',
      shares: '',
      saves: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array when followers is zero', () => {
    const r = config.calculate({
      platform: 'instagram',
      followers: '0',
      likes: '500',
      comments: '25',
      shares: '',
      saves: '',
    });
    expect(r).toEqual([]);
  });
});
