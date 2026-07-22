import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/system-of-equations/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('System of Equations Solver', () => {
  // ─── Unique Solutions ──────────────────────────────────────
  it('solves 2x + 3y = 7, 5x - 2y = 3', () => {
    const r = config.calculate({ a1: '2', b1: '3', c1: '7', a2: '5', b2: '-2', c2: '3' });
    near(parseNumber(getValue(r, 'determinant')), -19);
    near(parseNumber(getValue(r, 'x')), 1.210526, 0.01);
    near(parseNumber(getValue(r, 'y')), 1.526316, 0.01);
    expect(getValue(r, 'solutionType')).toBe('Unique solution');
  });

  it('solves x + y = 5, x - y = 1 → x = 3, y = 2', () => {
    const r = config.calculate({ a1: '1', b1: '1', c1: '5', a2: '1', b2: '-1', c2: '1' });
    near(parseNumber(getValue(r, 'determinant')), -2);
    near(parseNumber(getValue(r, 'x')), 3);
    near(parseNumber(getValue(r, 'y')), 2);
    expect(getValue(r, 'solutionType')).toBe('Unique solution');
  });

  it('solves 3x + 4y = 10, 2x + y = 5 → x = 2, y = 1', () => {
    const r = config.calculate({ a1: '3', b1: '4', c1: '10', a2: '2', b2: '1', c2: '5' });
    near(parseNumber(getValue(r, 'x')), 2);
    near(parseNumber(getValue(r, 'y')), 1);
  });

  it('handles fractional solutions: x + 2y = 4, 3x + 4y = 10', () => {
    const r = config.calculate({ a1: '1', b1: '2', c1: '4', a2: '3', b2: '4', c2: '10' });
    near(parseNumber(getValue(r, 'x')), 2);
    near(parseNumber(getValue(r, 'y')), 1);
  });

  // ─── Infinite Solutions ────────────────────────────────────
  it('detects infinite solutions for dependent system', () => {
    // 2x + 3y = 6 and 4x + 6y = 12 (second is 2x first)
    const r = config.calculate({ a1: '2', b1: '3', c1: '6', a2: '4', b2: '6', c2: '12' });
    near(parseNumber(getValue(r, 'determinant')), 0);
    expect(getValue(r, 'solutionType')).toContain('Infinite');
    expect(getValue(r, 'x')).toContain('No unique');
    expect(getValue(r, 'y')).toContain('No unique');
  });

  // ─── No Solution ───────────────────────────────────────────
  it('detects no solution for parallel lines', () => {
    // x + y = 3 and x + y = 7 (parallel)
    const r = config.calculate({ a1: '1', b1: '1', c1: '3', a2: '1', b2: '1', c2: '7' });
    near(parseNumber(getValue(r, 'determinant')), 0);
    expect(getValue(r, 'solutionType')).toContain('No solution');
    expect(getValue(r, 'x')).toContain('No solution');
    expect(getValue(r, 'y')).toContain('No solution');
  });

  it('detects no solution for another parallel case', () => {
    // 2x + y = 5 and 4x + 2y = 15 (parallel: same slope, different intercepts)
    const r = config.calculate({ a1: '2', b1: '1', c1: '5', a2: '4', b2: '2', c2: '15' });
    near(parseNumber(getValue(r, 'determinant')), 0);
    expect(getValue(r, 'solutionType')).toContain('No solution');
  });

  // ─── Error Handling ────────────────────────────────────────
  it('returns empty for empty inputs', () => {
    const r = config.calculate({});
    expect(r).toEqual([]);
  });

  it('returns empty for NaN a1', () => {
    const r = config.calculate({ a1: 'abc', b1: '1', c1: '1', a2: '1', b2: '1', c2: '1' });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN c2', () => {
    const r = config.calculate({ a1: '1', b1: '1', c1: '1', a2: '1', b2: '1', c2: 'xyz' });
    expect(r).toEqual([]);
  });

  it('returns step-by-step work', () => {
    const r = config.calculate({ a1: '2', b1: '3', c1: '7', a2: '5', b2: '-2', c2: '3' });
    const steps = getValue(r, 'steps');
    expect(steps).toContain('Determinant');
    expect(steps).toContain('unique solution');
    expect(steps).toContain('Dx');
    expect(steps).toContain('Dy');
  });

  it('handles coefficients with decimal values', () => {
    const r = config.calculate({ a1: '1.5', b1: '2.5', c1: '8', a2: '3.5', b2: '-1.5', c2: '4' });
    expect(parseNumber(getValue(r, 'determinant'))).not.toBe(0);
    expect(getValue(r, 'solutionType')).toBe('Unique solution');
    // x and y should be defined for this solvable system
    expect(() => getValue(r, 'x')).not.toThrow();
    expect(() => getValue(r, 'y')).not.toThrow();
  });
});
