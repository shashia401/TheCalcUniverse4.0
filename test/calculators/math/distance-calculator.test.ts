import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/distance';
import { getValue, parseNumber, near } from '../../helpers';

describe('distance-calculator', () => {
  it('1D distance: |7 − 3| = 4', () => {
    const r = config.calculate({ mode: '1d', x1_1d: '3', x2_1d: '7' });
    near(parseNumber(getValue(r, 'distance')), 4);
    expect(getValue(r, 'formula')).toBe('d = |x₂ − x₁|');
  });

  it('1D distance (negative): |2 − 8| = 6', () => {
    const r = config.calculate({ mode: '1d', x1_1d: '8', x2_1d: '2' });
    near(parseNumber(getValue(r, 'distance')), 6);
  });

  it('2D classic 3-4-5: (2,3) to (5,7) → 5', () => {
    const r = config.calculate({ mode: '2d', x1: '2', y1: '3', x2: '5', y2: '7' });
    near(parseNumber(getValue(r, 'distance')), 5);
  });

  it('2D horizontal line: (0,0) to (10,0) → 10', () => {
    const r = config.calculate({ mode: '2d', x1: '0', y1: '0', x2: '10', y2: '0' });
    near(parseNumber(getValue(r, 'distance')), 10);
  });

  it('2D vertical line: (4,2) to (4,8) → 6', () => {
    const r = config.calculate({ mode: '2d', x1: '4', y1: '2', x2: '4', y2: '8' });
    near(parseNumber(getValue(r, 'distance')), 6);
  });

  it('2D midpoint: (2,3) to (8,7) → (5,5)', () => {
    const r = config.calculate({ mode: '2d', x1: '2', y1: '3', x2: '8', y2: '7' });
    expect(getValue(r, 'midpoint')).toContain('5');
  });

  it('2D slope: (1,2) to (4,8) → slope = 2', () => {
    const r = config.calculate({ mode: '2d', x1: '1', y1: '2', x2: '4', y2: '8' });
    near(parseNumber(getValue(r, 'slope')), 2);
  });

  it('2D vertical slope undefined: (5,1) to (5,9)', () => {
    const r = config.calculate({ mode: '2d', x1: '5', y1: '1', x2: '5', y2: '9' });
    expect(getValue(r, 'slope')).toContain('Undefined');
  });

  it('3D distance: (1,1,1) to (4,5,9) → ~9.434', () => {
    const r = config.calculate({ mode: '3d', x1: '1', y1: '1', z1: '1', x2: '4', y2: '5', z2: '9' });
    const expected = Math.sqrt(9 + 16 + 64); // √89
    near(parseNumber(getValue(r, 'distance')), expected, 0.001);
  });

  it('3D midpoint computed', () => {
    const r = config.calculate({ mode: '3d', x1: '0', y1: '0', z1: '0', x2: '10', y2: '10', z2: '10' });
    expect(getValue(r, 'midpoint')).toContain('5');
  });

  it('rejects NaN x1 in 2D', () => {
    const r = config.calculate({ mode: '2d', x1: 'abc', y1: '3', x2: '5', y2: '7' });
    expect(r).toEqual([]);
  });

  it('rejects NaN y1 in 2D', () => {
    const r = config.calculate({ mode: '2d', x1: '2', y1: '', x2: '5', y2: '7' });
    expect(r).toEqual([]);
  });

  it('rejects NaN in 1D', () => {
    const r = config.calculate({ mode: '1d', x1_1d: '3', x2_1d: 'abc' });
    expect(r).toEqual([]);
  });

  it('rejects NaN z in 3D', () => {
    const r = config.calculate({ mode: '3d', x1: '1', y1: '2', z1: '3', x2: '4', y2: '5', z2: '' });
    expect(r).toEqual([]);
  });

  it('returns empty for unknown mode', () => {
    const r = config.calculate({ mode: '4d' });
    expect(r).toEqual([]);
  });
});
