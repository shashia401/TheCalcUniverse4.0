import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/ratio/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Ratio calculator', () => {
  it('simplifies 16:9', () => {
    const r = config.calculate({ a: '16', b: '9', c: '', d: '', preset: 'none' });
    expect(getValue(r, 'simplified')).toBe('16 : 9');
  });

  it('simplifies 32:18 to 16:9', () => {
    const r = config.calculate({ a: '32', b: '18', c: '', d: '', preset: 'none' });
    expect(getValue(r, 'simplified')).toBe('16 : 9');
  });

  it('shows decimal form', () => {
    const r = config.calculate({ a: '16', b: '9', c: '', d: '', preset: 'none' });
    near(parseNumber(getValue(r, 'decimal')), 1.7777, 0.001);
  });

  it('solves for D: A:B = C:D, D = B*C/A', () => {
    const r = config.calculate({ a: '16', b: '9', c: '32', d: '', preset: 'none' });
    expect(getValue(r, 'proportionResult')).toBe('18');
  });

  it('solves for C: A:B = C:D, C = A*D/B', () => {
    const r = config.calculate({ a: '16', b: '9', c: '', d: '18', preset: 'none' });
    expect(getValue(r, 'proportionResult')).toBe('32');
  });

  it('checks proportional match', () => {
    const r = config.calculate({ a: '16', b: '9', c: '32', d: '18', preset: 'none' });
    expect(getValue(r, 'proportionResult')).toContain('Proportional');
  });

  it('detects non-proportional', () => {
    const r = config.calculate({ a: '16', b: '9', c: '10', d: '10', preset: 'none' });
    expect(getValue(r, 'proportionResult')).toContain('Not proportional');
  });

  it('shows fraction form', () => {
    const r = config.calculate({ a: '3', b: '4', c: '', d: '', preset: 'none' });
    expect(getValue(r, 'fraction')).toBe('3 / 4');
  });

  it('returns empty for invalid inputs', () => {
    const r = config.calculate({ a: '0', b: '0', c: '', d: '', preset: 'none' });
    expect(r).toEqual([]);
  });
});
