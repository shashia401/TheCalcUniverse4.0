import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/equation-solver/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Equation Solver', () => {
  // ─── Linear Equations ──────────────────────────────────────
  it('solves linear: 2x + 4 = 0 → x = -2', () => {
    const r = config.calculate({ equationType: 'linear', a: '2', b: '4' });
    near(parseNumber(getValue(r, 'root1')), -2);
    expect(getValue(r, 'equation')).toContain('x');
    expect(getValue(r, 'nature')).toContain('linear');
  });

  it('solves linear: 3x - 9 = 0 → x = 3', () => {
    const r = config.calculate({ equationType: 'linear', a: '3', b: '-9' });
    near(parseNumber(getValue(r, 'root1')), 3);
  });

  it('solves linear: -5x + 10 = 0 → x = 2', () => {
    const r = config.calculate({ equationType: 'linear', a: '-5', b: '10' });
    near(parseNumber(getValue(r, 'root1')), 2);
  });

  it('returns empty for linear when a = 0', () => {
    const r = config.calculate({ equationType: 'linear', a: '0', b: '5' });
    expect(r).toEqual([]);
  });

  it('returns empty for linear when NaN a', () => {
    const r = config.calculate({ equationType: 'linear', a: 'abc', b: '5' });
    expect(r).toEqual([]);
  });

  // ─── Quadratic Equations ───────────────────────────────────
  it('finds two real roots when discriminant > 0: x² - 5x + 6 = 0', () => {
    const r = config.calculate({ equationType: 'quadratic', a: '1', b: '-5', c: '6' });
    near(parseNumber(getValue(r, 'discriminant')), 1);
    near(parseNumber(getValue(r, 'root1')), 3);
    near(parseNumber(getValue(r, 'root2')), 2);
    expect(getValue(r, 'nature')).toContain('distinct real');
  });

  it('finds one repeated root when discriminant = 0: x² - 4x + 4 = 0', () => {
    const r = config.calculate({ equationType: 'quadratic', a: '1', b: '-4', c: '4' });
    near(parseNumber(getValue(r, 'discriminant')), 0);
    near(parseNumber(getValue(r, 'root1')), 2);
    expect(getValue(r, 'nature')).toContain('repeated');
  });

  it('finds complex roots when discriminant < 0: x² + 2x + 5 = 0', () => {
    const r = config.calculate({ equationType: 'quadratic', a: '1', b: '2', c: '5' });
    near(parseNumber(getValue(r, 'discriminant')), -16);
    expect(getValue(r, 'root1')).toContain('i');
    expect(getValue(r, 'root2')).toContain('i');
    expect(getValue(r, 'nature')).toContain('complex');
  });

  it('formats complex roots with positive and negative imaginary parts', () => {
    const r = config.calculate({ equationType: 'quadratic', a: '1', b: '2', c: '5' });
    const root1 = getValue(r, 'root1');
    const root2 = getValue(r, 'root2');
    expect(root1).toContain('+');
    expect(root2).toContain('-');
  });

  it('returns empty when quadratic a = 0', () => {
    const r = config.calculate({ equationType: 'quadratic', a: '0', b: '2', c: '3' });
    expect(r).toEqual([]);
  });

  it('returns empty for missing equation type', () => {
    const r = config.calculate({ a: '1', b: '2', c: '3' });
    expect(r).toEqual([]);
  });

  it('returns empty for empty inputs', () => {
    const r = config.calculate({});
    expect(r).toEqual([]);
  });

  it('returns empty for NaN inputs in quadratic', () => {
    const r = config.calculate({ equationType: 'quadratic', a: '1', b: 'abc', c: '3' });
    expect(r).toEqual([]);
  });

  it('handles negative a coefficient in quadratic', () => {
    const r = config.calculate({ equationType: 'quadratic', a: '-1', b: '4', c: '-3' });
    near(parseNumber(getValue(r, 'discriminant')), 4);
    near(parseNumber(getValue(r, 'root1')), 1);
    near(parseNumber(getValue(r, 'root2')), 3);
  });

  it('displays equation string correctly for quadratic', () => {
    const r = config.calculate({ equationType: 'quadratic', a: '2', b: '-3', c: '1' });
    const eq = getValue(r, 'equation');
    expect(eq).toMatch(/²/);
    expect(eq).toContain('= 0');
  });

  it('handles fractional coefficients', () => {
    const r = config.calculate({ equationType: 'quadratic', a: '0.5', b: '-1.5', c: '1' });
    near(parseNumber(getValue(r, 'discriminant')), 0.25);
    near(parseNumber(getValue(r, 'root1')), 2);
    near(parseNumber(getValue(r, 'root2')), 1);
  });
});
