import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/taylor-series/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Taylor Series Calculator', () => {
  it('expands e^x around 0', () => {
    const r = config.calculate({ expression: 'e^x', center: '0', order: '3' });
    const approx = getValue(r, 'approximation');
    expect(approx).toContain('1');
    expect(approx).toContain('x');
  });

  it('evaluates e^x at x=1', () => {
    const r = config.calculate({ expression: 'e^x', center: '0', order: '5', xValue: '1' });
    near(parseNumber(getValue(r, 'evaluation')), Math.E, 0.1);
  });

  it('expands sin(x) around 0 (skips zero even terms)', () => {
    const r = config.calculate({ expression: 'sin(x)', center: '0', order: '5' });
    // sin(x) at center 0 has only odd-degree non-zero terms: x, -x³/6, x⁵/120
    const n = parseInt(getValue(r, 'numberOfTerms'), 10);
    expect(n).toBeGreaterThanOrEqual(3);
  });

  it('evaluates sin(x) at x=π/2', () => {
    const r = config.calculate({ expression: 'sin(x)', center: '0', order: '7', xValue: '1.5708' });
    near(parseNumber(getValue(r, 'evaluation')), 1, 0.01);
  });

  it('expands cos(x) around 0 (skips zero odd terms)', () => {
    const r = config.calculate({ expression: 'cos(x)', center: '0', order: '4' });
    // cos(x) at center 0 has only even-degree non-zero terms: 1, -x²/2, x⁴/24
    const n = parseInt(getValue(r, 'numberOfTerms'), 10);
    expect(n).toBeGreaterThanOrEqual(3);
  });

  it('expands 1/(1-x) around 0', () => {
    const r = config.calculate({ expression: '1/(1-x)', center: '0', order: '4' });
    expect(getValue(r, 'approximation')).toContain('1');
  });

  it('uses default center and order', () => {
    const r = config.calculate({ expression: 'e^x' });
    expect(getValue(r, 'numberOfTerms')).toBe('6'); // order 5 + 1
  });

  it('returns empty for empty expression', () => {
    const r = config.calculate({ expression: '' });
    expect(r).toEqual([]);
  });

  it('shows individual terms', () => {
    const r = config.calculate({ expression: 'e^x', center: '0', order: '2' });
    expect(getValue(r, 'terms')).toContain('·');
  });
});
