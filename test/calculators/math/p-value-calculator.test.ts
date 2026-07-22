import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/p-value/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('P-value Calculator', () => {
  // ── Z-test ─────────────────────────────────────────────────────────
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

  it('shows test statistic in results', () => {
    const r = config.calculate({ testType: 'z', score: '2.13', alpha: '0.05', tails: 'two' });
    expect(getValue(r, 'testStatistic')).toBe('2.13');
  });

  // ── Validation ────────────────────────────────────────────────────
  it('returns empty for NaN score', () => {
    const r = config.calculate({ testType: 'z', score: 'abc', alpha: '0.05', tails: 'two' });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid alpha', () => {
    const r = config.calculate({ testType: 'z', score: '1.96', alpha: '0', tails: 'two' });
    expect(r).toEqual([]);
  });

  it('works with t-test when df provided', () => {
    const r = config.calculate({ testType: 't', score: '2.0', df: '30', alpha: '0.05', tails: 'two' });
    expect(getValue(r, 'pValue')).toBeTruthy();
  });

  it('returns empty for t-test without df', () => {
    const r = config.calculate({ testType: 't', score: '2.0', df: '', alpha: '0.05', tails: 'two' });
    expect(r).toEqual([]);
  });

  it('returns empty for t-test with zero df', () => {
    const r = config.calculate({ testType: 't', score: '2.0', df: '0', alpha: '0.05', tails: 'two' });
    expect(r).toEqual([]);
  });

  // ── Extreme values ─────────────────────────────────────────────────
  it('very large Z-score gives very small p-value', () => {
    const r = config.calculate({ testType: 'z', score: '6', alpha: '0.05', tails: 'two' });
    const p = parseFloat(getValue(r, 'pValue'));
    expect(p).toBeLessThan(0.000001);
  });

  it('Z=0 gives large two-tailed p-value', () => {
    const r = config.calculate({ testType: 'z', score: '0', alpha: '0.05', tails: 'two' });
    const p = parseFloat(getValue(r, 'pValue'));
    near(p, 1.0, 0.01);
  });

  it('negative Z-score works correctly', () => {
    const r = config.calculate({ testType: 'z', score: '-1.96', alpha: '0.05', tails: 'two' });
    const p = parseFloat(getValue(r, 'pValue'));
    expect(p).toBeLessThan(0.05);
    expect(p).toBeGreaterThan(0.04);
  });

  // ── New output fields ─────────────────────────────────────────────
  it('shows evidence strength', () => {
    const r = config.calculate({ testType: 'z', score: '3.0', alpha: '0.05', tails: 'two' });
    expect(getValue(r, 'strength')).toBeTruthy();
    expect(getValue(r, 'strength').length).toBeGreaterThan(5);
  });

  it('shows critical value', () => {
    const r = config.calculate({ testType: 'z', score: '2.0', alpha: '0.05', tails: 'two' });
    expect(getValue(r, 'criticalValue')).toBeTruthy();
  });

  it('shows confidence level', () => {
    const r = config.calculate({ testType: 'z', score: '2.0', alpha: '0.05', tails: 'two' });
    expect(getValue(r, 'confidence')).toContain('%');
  });

  it('shows action recommendation', () => {
    const r = config.calculate({ testType: 'z', score: '2.5', alpha: '0.05', tails: 'two' });
    expect(getValue(r, 'action')).toContain('Reject');
  });

  // ── Educational content ───────────────────────────────────────────
  it('includes educational content fields', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.explanation).toBeTruthy();
    expect(config.educational.workedExamples).toBeTruthy();
    expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.faqs).toBeTruthy();
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
    expect(config.educational.proTips).toBeTruthy();
    expect(config.educational.proTips!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.quickReference).toBeTruthy();
    expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(5);
  });

  it('has limitations with real content', () => {
    expect(config.educational.limitations.length).toBeGreaterThan(0);
    expect(config.educational.limitations.every((l: string) => l.length > 20)).toBe(true);
  });

  it('all number inputs have inputMode defined', () => {
    for (const input of config.inputs) {
      if (input.type === 'number') {
        expect(input.inputMode).toBeDefined();
      }
    }
  });
});
