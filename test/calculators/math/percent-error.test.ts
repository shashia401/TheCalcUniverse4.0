import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/percent-error/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Percent Error calculator', () => {
  it('calculates percent error correctly', () => {
    const r = config.calculate({ accepted: '100', experimental: '95' });
    const pct = parseFloat(getValue(r, 'percentError'));
    near(pct, 5);
  });

  it('absolute error is the difference', () => {
    const r = config.calculate({ accepted: '100', experimental: '95' });
    near(parseNumber(getValue(r, 'absoluteError')), 5);
  });

  it('signed error shows overestimate/underestimate', () => {
    const r1 = config.calculate({ accepted: '100', experimental: '110' });
    expect(getValue(r1, 'signedError')).toContain('overestimate');

    const r2 = config.calculate({ accepted: '100', experimental: '90' });
    expect(getValue(r2, 'signedError')).toContain('underestimate');
  });

  it('accuracy = 100 - percent error', () => {
    const r = config.calculate({ accepted: '100', experimental: '95' });
    const acc = parseFloat(getValue(r, 'accuracy'));
    near(acc, 95);
  });

  it('returns empty for zero accepted', () => {
    const r = config.calculate({ accepted: '0', experimental: '5' });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN values', () => {
    const r = config.calculate({ accepted: 'abc', experimental: '5' });
    expect(r).toEqual([]);
  });

  it('0% error when values match', () => {
    const r = config.calculate({ accepted: '50', experimental: '50' });
    expect(getValue(r, 'percentError')).toContain('0');
  });

  it('100% error when experimental is 0 and accepted is not', () => {
    const r = config.calculate({ accepted: '50', experimental: '0' });
    const pct = parseFloat(getValue(r, 'percentError'));
    near(pct, 100);
  });

  it('includes formula in results', () => {
    const r = config.calculate({ accepted: '100', experimental: '95' });
    expect(getValue(r, 'formula')).toBeTruthy();
  });
});
