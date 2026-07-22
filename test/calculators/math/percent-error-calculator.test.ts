import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/percent-error/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Percent Error calculator', () => {
  // ── Basic computation tests ──
  it('calculates percent error correctly', () => {
    const r = config.calculate({ accepted: '100', experimental: '95' });
    const pct = parseFloat(getValue(r, 'percentError'));
    near(pct, 5);
  });

  it('calculates exact 10% error', () => {
    const r = config.calculate({ accepted: '50', experimental: '45' });
    const pct = parseFloat(getValue(r, 'percentError'));
    near(pct, 10);
  });

  it('calculates 25% error', () => {
    const r = config.calculate({ accepted: '200', experimental: '150' });
    const pct = parseFloat(getValue(r, 'percentError'));
    near(pct, 25);
  });

  it('absolute error is the difference', () => {
    const r = config.calculate({ accepted: '100', experimental: '95' });
    near(parseNumber(getValue(r, 'absoluteError')), 5);
  });

  it('absolute error for overestimate', () => {
    const r = config.calculate({ accepted: '100', experimental: '110' });
    near(parseNumber(getValue(r, 'absoluteError')), 10);
  });

  it('signed error shows overestimate/underestimate', () => {
    const r1 = config.calculate({ accepted: '100', experimental: '110' });
    expect(getValue(r1, 'signedError')).toContain('overestimate');

    const r2 = config.calculate({ accepted: '100', experimental: '90' });
    expect(getValue(r2, 'signedError')).toContain('underestimate');
  });

  it('signed error is 0 when values match', () => {
    const r = config.calculate({ accepted: '100', experimental: '100' });
    expect(getValue(r, 'signedError')).toContain('0');
  });

  it('accuracy = 100 - percent error', () => {
    const r = config.calculate({ accepted: '100', experimental: '95' });
    const acc = parseFloat(getValue(r, 'accuracy'));
    near(acc, 95);
  });

  it('accuracy is 0 for 100% error', () => {
    const r = config.calculate({ accepted: '50', experimental: '0' });
    const acc = parseFloat(getValue(r, 'accuracy'));
    near(acc, 0);
  });

  it('relative error is correct', () => {
    const r = config.calculate({ accepted: '100', experimental: '95' });
    near(parseNumber(getValue(r, 'relativeError')), 0.05);
  });

  it('includes formula in results', () => {
    const r = config.calculate({ accepted: '100', experimental: '95' });
    expect(getValue(r, 'formula')).toBeTruthy();
    expect(getValue(r, 'formula')).toContain('100');
    expect(getValue(r, 'formula')).toContain('95');
    expect(getValue(r, 'formula')).toContain('%');
  });

  // ── Edge case tests ──
  it('returns empty for zero accepted', () => {
    const r = config.calculate({ accepted: '0', experimental: '5' });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN values', () => {
    const r = config.calculate({ accepted: 'abc', experimental: '5' });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN experimental', () => {
    const r = config.calculate({ accepted: '100', experimental: 'xyz' });
    expect(r).toEqual([]);
  });

  it('returns empty for missing accepted', () => {
    const r = config.calculate({ experimental: '5' } as unknown as Record<string, string>);
    expect(r).toEqual([]);
  });

  it('returns empty for missing experimental', () => {
    const r = config.calculate({ accepted: '100' } as unknown as Record<string, string>);
    expect(r).toEqual([]);
  });

  // ── Special value tests ──
  it('0% error when values match', () => {
    const r = config.calculate({ accepted: '50', experimental: '50' });
    expect(getValue(r, 'percentError')).toContain('0');
  });

  it('100% error when experimental is 0 and accepted is not', () => {
    const r = config.calculate({ accepted: '50', experimental: '0' });
    const pct = parseFloat(getValue(r, 'percentError'));
    near(pct, 100);
  });

  it('200% error when experimental doubles the accepted', () => {
    const r = config.calculate({ accepted: '10', experimental: '30' });
    const pct = parseFloat(getValue(r, 'percentError'));
    near(pct, 200);
  });

  it('handles negative accepted value', () => {
    const r = config.calculate({ accepted: '-50', experimental: '-45' });
    const pct = parseFloat(getValue(r, 'percentError'));
    near(pct, 10);
  });

  // ── Decimal.js precision tests ──
  it('handles small decimal values', () => {
    const r = config.calculate({ accepted: '0.001', experimental: '0.0012' });
    const pct = parseFloat(getValue(r, 'percentError'));
    near(pct, 20, 1);
  });

  it('handles very precise accepted values', () => {
    const r = config.calculate({ accepted: '9.81', experimental: '9.78' });
    const pct = parseFloat(getValue(r, 'percentError'));
    near(pct, 0.306, 0.01);
  });

  it('handles scientific notation input', () => {
    const r = config.calculate({ accepted: '1e6', experimental: '0.95e6' });
    const pct = parseFloat(getValue(r, 'percentError'));
    near(pct, 5);
  });

  // ── Result structure tests ──
  it('returns all expected result fields', () => {
    const r = config.calculate({ accepted: '100', experimental: '95' });
    const ids = r.map(x => x.id);
    expect(ids).toContain('percentError');
    expect(ids).toContain('absoluteError');
    expect(ids).toContain('signedError');
    expect(ids).toContain('accuracy');
    expect(ids).toContain('relativeError');
    expect(ids).toContain('formula');
  });

  it('highlights percent error result', () => {
    const r = config.calculate({ accepted: '100', experimental: '95' });
    const pe = r.find(x => x.id === 'percentError');
    expect(pe).toBeTruthy();
    expect(pe!.highlight).toBe(true);
  });

  it('marks <5% error as positive color', () => {
    const r = config.calculate({ accepted: '100', experimental: '98' });
    const pe = r.find(x => x.id === 'percentError');
    expect(pe).toBeTruthy();
    expect(pe!.color).toBe('positive');
  });

  it('marks >15% error as negative color', () => {
    const r = config.calculate({ accepted: '100', experimental: '70' });
    const pe = r.find(x => x.id === 'percentError');
    expect(pe).toBeTruthy();
    expect(pe!.color).toBe('negative');
  });

  it('formats percent error without unnecessary trailing zeros', () => {
    const r = config.calculate({ accepted: '100', experimental: '95' });
    const val = getValue(r, 'percentError');
    expect(parseFloat(val)).toBe(5);
  });
});
