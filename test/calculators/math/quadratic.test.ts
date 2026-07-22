import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/quadratic/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('quadratic calculator', () => {
  it('finds two real roots when discriminant > 0', () => {
    const r = config.calculate({ a: '1', b: '-5', c: '6' });
    near(parseNumber(getValue(r, 'discriminant')), 1);
    near(parseNumber(getValue(r, 'x1')), 3);
    near(parseNumber(getValue(r, 'x2')), 2);
    expect(getValue(r, 'equation')).toBe('1x² - 5x + 6 = 0');
  });

  it('finds one repeated root when discriminant = 0', () => {
    const r = config.calculate({ a: '1', b: '-4', c: '4' });
    near(parseNumber(getValue(r, 'discriminant')), 0);
    near(parseNumber(getValue(r, 'x')), 2);
  });

  it('finds complex roots when discriminant < 0', () => {
    const r = config.calculate({ a: '1', b: '2', c: '5' });
    near(parseNumber(getValue(r, 'discriminant')), -16);
    expect(getValue(r, 'complex1')).toContain('i');
    expect(getValue(r, 'complex2')).toContain('i');
  });

  it('computes vertex and axis of symmetry', () => {
    const r = config.calculate({ a: '1', b: '-5', c: '6' });
    expect(getValue(r, 'vertex')).toContain('2.5');
    near(parseNumber(getValue(r, 'axis')), 2.5);
  });

  it('returns empty for zero a coefficient', () => {
    expect(config.calculate({ a: '0', b: '2', c: '3' })).toHaveLength(0);
  });

  it('returns empty for empty inputs', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty for NaN b', () => {
    expect(config.calculate({ a: '1', b: 'abc', c: '3' })).toHaveLength(0);
  });

  it('returns empty for NaN c', () => {
    expect(config.calculate({ a: '1', b: '2', c: 'xyz' })).toHaveLength(0);
  });

  it('handles negative a coefficient', () => {
    const r = config.calculate({ a: '-1', b: '4', c: '-3' });
    near(parseNumber(getValue(r, 'discriminant')), 4);
    near(parseNumber(getValue(r, 'x1')), 1);
    near(parseNumber(getValue(r, 'x2')), 3);
  });
});
