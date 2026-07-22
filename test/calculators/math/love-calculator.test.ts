import { describe, it, expect } from 'vitest';
import loveConfig from '../../../src/calculators/math/love-calculator/index';
import { getValue } from '../../helpers';

describe('Love Calculator', () => {
  it('returns empty array for empty names', () => {
    const results = loveConfig.calculate({ name1: '', name2: '' });
    expect(results).toEqual([]);
  });

  it('returns empty array for missing names', () => {
    const results = loveConfig.calculate({ name1: '', name2: 'Noah' });
    expect(results).toEqual([]);
  });

  it('returns empty array for null input', () => {
    const results = loveConfig.calculate({});
    expect(results).toEqual([]);
  });

  it('returns a score for valid names', () => {
    const results = loveConfig.calculate({ name1: 'Emma', name2: 'Noah' });
    const score = getValue(results, 'loveScore');
    expect(score).toBeTruthy();
    const scoreNum = parseInt(score);
    expect(scoreNum).toBeGreaterThanOrEqual(0);
    expect(scoreNum).toBeLessThanOrEqual(100);
  });

  it('is deterministic — same names give same score', () => {
    const r1 = loveConfig.calculate({ name1: 'Alice', name2: 'Bob' });
    const r2 = loveConfig.calculate({ name1: 'Alice', name2: 'Bob' });
    expect(getValue(r1, 'loveScore')).toBe(getValue(r2, 'loveScore'));
  });

  it('produces compatibility label', () => {
    const results = loveConfig.calculate({ name1: 'Emma', name2: 'Noah' });
    const compat = getValue(results, 'compatibility');
    expect(compat).toBeTruthy();
    expect(typeof compat).toBe('string');
  });

  it('includes flavor text verdict', () => {
    const results = loveConfig.calculate({ name1: 'Emma', name2: 'Noah' });
    const verdict = getValue(results, 'flavorText');
    expect(verdict).toBeTruthy();
    expect(typeof verdict).toBe('string');
  });

  it('includes share text', () => {
    const results = loveConfig.calculate({ name1: 'Emma', name2: 'Noah' });
    const share = getValue(results, 'shareText');
    expect(share).toContain('Emma');
    expect(share).toContain('Noah');
  });
});
