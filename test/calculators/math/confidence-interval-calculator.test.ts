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

  it('calculates margin of error', () => {
    const r = config.calculate({ sampleMean: '50', sampleSize: '100', stddev: '10', confidence: '95' });
    expect(getValue(r, 'marginOfError')).toContain('±');
    near(parseNumber(getValue(r, 'marginOfError')), 1.96, 0.01);
  });

  it('shows critical Z-value', () => {
    const r = config.calculate({ sampleMean: '50', sampleSize: '100', stddev: '10', confidence: '95' });
    expect(getValue(r, 'criticalValue')).toContain('1.96');
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

  it('90% confidence uses Z=1.645', () => {
    const r = config.calculate({ sampleMean: '50', sampleSize: '100', stddev: '10', confidence: '90' });
    expect(getValue(r, 'criticalValue')).toContain('1.645');
  });
});
