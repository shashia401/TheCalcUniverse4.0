import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/confidence-interval/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Confidence Interval calculator', () => {
  it('calculates 95% CI for mean=50, n=100, σ=10', () => {
    const r = config.calculate({ sampleMean: '50', sampleSize: '100', stddev: '10', confidence: '95' });
    const lower = parseFloat(getValue(r, 'lowerBound'));
    const upper = parseFloat(getValue(r, 'upperBound'));
    expect(lower).toBeLessThan(50);
    expect(upper).toBeGreaterThan(50);
    near(lower, 48.04, 0.1);
    near(upper, 51.96, 0.1);
  });

  it('calculates margin of error (known sigma: z 1.96; sample s: t 1.9842 at df 99)', () => {
    const z = config.calculate({ sampleMean: '50', sampleSize: '100', stddev: '10', confidence: '95', sdType: 'population' });
    expect(getValue(z, 'marginOfError')).toContain('±');
    near(parseNumber(getValue(z, 'marginOfError')), 1.96, 0.01);
    const t = config.calculate({ sampleMean: '50', sampleSize: '100', stddev: '10', confidence: '95' });
    near(parseNumber(getValue(t, 'marginOfError')), 1.984217, 1e-6);
  });

  it('shows critical Z-value (known sigma) and critical t (sample s)', () => {
    const z = config.calculate({ sampleMean: '50', sampleSize: '100', stddev: '10', confidence: '95', sdType: 'population' });
    expect(getValue(z, 'criticalValue')).toContain('1.96');
    const t = config.calculate({ sampleMean: '50', sampleSize: '100', stddev: '10', confidence: '95' });
    expect(getValue(t, 'criticalValue')).toContain('1.9842');
  });

  it('shows standard error', () => {
    const r = config.calculate({ sampleMean: '50', sampleSize: '100', stddev: '10', confidence: '95' });
    near(parseNumber(getValue(r, 'standardError')), 1);
  });

  it('99% CI is wider than 95% CI', () => {
    const r95 = config.calculate({ sampleMean: '50', sampleSize: '100', stddev: '10', confidence: '95' });
    const r99 = config.calculate({ sampleMean: '50', sampleSize: '100', stddev: '10', confidence: '99' });
    const moe95 = parseNumber(getValue(r95, 'marginOfError'));
    const moe99 = parseNumber(getValue(r99, 'marginOfError'));
    expect(moe99).toBeGreaterThan(moe95);
  });

  it('shows confidence interval label', () => {
    const r = config.calculate({ sampleMean: '50', sampleSize: '100', stddev: '10', confidence: '95' });
    expect(getValue(r, 'confidenceInterval')).toContain('[');
  });

  it('shows formula', () => {
    const r = config.calculate({ sampleMean: '50', sampleSize: '100', stddev: '10', confidence: '95' });
    expect(getValue(r, 'formula')).toContain('CI =');
  });

  it('returns empty for sample size < 1', () => {
    const r = config.calculate({ sampleMean: '50', sampleSize: '0', stddev: '10', confidence: '95' });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN input', () => {
    const r = config.calculate({ sampleMean: 'abc', sampleSize: '100', stddev: '10', confidence: '95' });
    expect(r).toEqual([]);
  });

  it('90% confidence with known sigma uses Z=1.6449 (exact quantile 1.644854)', () => {
    const r = config.calculate({ sampleMean: '50', sampleSize: '100', stddev: '10', confidence: '90', sdType: 'population' });
    expect(getValue(r, 'criticalValue')).toContain('1.6449');
  });
});
