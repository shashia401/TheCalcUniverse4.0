import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/p-value/index';
import { getValue, parseNumber } from '../../helpers';

describe('P-value calculator', () => {
  it('calculates p-value for Z=1.96, two-tailed', () => {
    const r = config.calculate({ testType: 'z', score: '1.96', alpha: '0.05', tails: 'two' });
    const p = parseFloat(getValue(r, 'pValue'));
    expect(p).toBeLessThan(0.05);
    expect(p).toBeGreaterThan(0.01);
  });

  it('declares significance for p < 0.05', () => {
    const r = config.calculate({ testType: 'z', score: '2.5', alpha: '0.05', tails: 'two' });
    expect(getValue(r, 'significant')).toBe('Yes');
  });

  it('declares non-significance for p >= 0.05', () => {
    const r = config.calculate({ testType: 'z', score: '0.5', alpha: '0.05', tails: 'two' });
    expect(getValue(r, 'significant')).toBe('No');
  });

  it('shows conclusion text', () => {
    const r = config.calculate({ testType: 'z', score: '2.5', alpha: '0.05', tails: 'two' });
    expect(getValue(r, 'conclusion')).toContain('reject');
  });

  it('one-tailed p-value is smaller than two-tailed', () => {
    const r1 = config.calculate({ testType: 'z', score: '1.96', alpha: '0.05', tails: 'one' });
    const r2 = config.calculate({ testType: 'z', score: '1.96', alpha: '0.05', tails: 'two' });
    const p1 = parseFloat(getValue(r1, 'pValue'));
    const p2 = parseFloat(getValue(r2, 'pValue'));
    expect(p1).toBeLessThan(p2);
  });

  it('returns empty for NaN score', () => {
    const r = config.calculate({ testType: 'z', score: 'abc', alpha: '0.05', tails: 'two' });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid alpha', () => {
    const r = config.calculate({ testType: 'z', score: '1.96', alpha: '0', tails: 'two' });
    expect(r).toEqual([]);
  });

  it('shows test statistic in results', () => {
    const r = config.calculate({ testType: 'z', score: '2.13', alpha: '0.05', tails: 'two' });
    expect(getValue(r, 'testStatistic')).toBe('2.13');
  });

  it('works with t-test when df provided', () => {
    const r = config.calculate({ testType: 't', score: '2.0', df: '30', alpha: '0.05', tails: 'two' });
    expect(getValue(r, 'pValue')).toBeTruthy();
  });
});
