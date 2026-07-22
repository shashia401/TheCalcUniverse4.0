import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/distance/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Distance calculator', () => {
  it('calculates 1D distance', () => {
    const r = config.calculate({ mode: '1d', x1_1d: '3', x2_1d: '7' });
    near(parseNumber(getValue(r, 'distance')), 4);
  });

  it('shows 1D formula', () => {
    const r = config.calculate({ mode: '1d', x1_1d: '3', x2_1d: '7' });
    expect(getValue(r, 'formula')).toContain('|x₂ − x₁|');
  });

  it('calculates 2D distance', () => {
    const r = config.calculate({ mode: '2d', x1: '0', y1: '0', x2: '3', y2: '4' });
    near(parseNumber(getValue(r, 'distance')), 5);
  });

  it('shows 2D formula', () => {
    const r = config.calculate({ mode: '2d', x1: '1', y1: '2', x2: '4', y2: '6' });
    expect(getValue(r, 'formula')).toContain('√');
  });

  it('calculates 2D midpoint', () => {
    const r = config.calculate({ mode: '2d', x1: '0', y1: '0', x2: '4', y2: '6' });
    expect(getValue(r, 'midpoint')).toContain('2, 3');
  });

  it('calculates 2D slope', () => {
    const r = config.calculate({ mode: '2d', x1: '1', y1: '2', x2: '3', y2: '6' });
    near(parseNumber(getValue(r, 'slope')), 2);
  });

  it('calculates 3D distance', () => {
    const r = config.calculate({ mode: '3d', x1: '0', y1: '0', z1: '0', x2: '1', y2: '2', z2: '2' });
    near(parseNumber(getValue(r, 'distance')), 3);
  });

  it('shows 3D midpoint', () => {
    const r = config.calculate({ mode: '3d', x1: '0', y1: '0', z1: '0', x2: '2', y2: '4', z2: '6' });
    expect(getValue(r, 'midpoint')).toContain('1, 2, 3');
  });

  it('shows steps', () => {
    const r = config.calculate({ mode: '2d', x1: '0', y1: '0', x2: '3', y2: '4' });
    expect(getValue(r, 'steps')).toContain('√');
  });

  it('returns empty for NaN input', () => {
    const r = config.calculate({ mode: '2d', x1: 'abc', y1: '0', x2: '3', y2: '4' });
    expect(r).toEqual([]);
  });

  // ── New tests ──

  it('1D distance with negative coordinates', () => {
    const r = config.calculate({ mode: '1d', x1_1d: '-5', x2_1d: '3' });
    near(parseNumber(getValue(r, 'distance')), 8);
  });

  it('1D distance is always non-negative', () => {
    const r = config.calculate({ mode: '1d', x1_1d: '10', x2_1d: '3' });
    const dist = parseNumber(getValue(r, 'distance'));
    expect(dist).toBeGreaterThanOrEqual(0);
    near(dist, 7);
  });

  it('2D distance with decimal coordinates', () => {
    const r = config.calculate({ mode: '2d', x1: '1.5', y1: '2.3', x2: '5.5', y2: '5.3' });
    near(parseNumber(getValue(r, 'distance')), 5);
  });

  it('2D distance with negative coordinates', () => {
    const r = config.calculate({ mode: '2d', x1: '-2', y1: '-3', x2: '4', y2: '5' });
    near(parseNumber(getValue(r, 'distance')), 10);
  });

  it('2D distance when points are same returns 0', () => {
    const r = config.calculate({ mode: '2d', x1: '7', y1: '8', x2: '7', y2: '8' });
    near(parseNumber(getValue(r, 'distance')), 0);
  });

  it('2D vertical line shows undefined slope', () => {
    const r = config.calculate({ mode: '2d', x1: '5', y1: '1', x2: '5', y2: '10' });
    expect(getValue(r, 'slope')).toContain('Undefined');
  });

  it('3D distance with negative coordinate', () => {
    const r = config.calculate({ mode: '3d', x1: '-1', y1: '-1', z1: '-1', x2: '2', y2: '2', z2: '2' });
    // Δx=3, Δy=3, Δz=3, d = √(9+9+9) = √27 ≈ 5.196
    near(parseNumber(getValue(r, 'distance')), 5.196, 0.01);
  });

  it('3D formula contains all three coordinates', () => {
    const r = config.calculate({ mode: '3d', x1: '1', y1: '2', z1: '3', x2: '4', y2: '5', z2: '6' });
    const formula = getValue(r, 'formula');
    expect(formula).toContain('√');
    expect(formula).toContain('²');
  });

  it('3D steps show intermediate calculation', () => {
    const r = config.calculate({ mode: '3d', x1: '0', y1: '0', z1: '0', x2: '1', y2: '2', z2: '2' });
    expect(getValue(r, 'steps')).toContain('√');
  });

  it('defaults to 2D mode when mode is missing', () => {
    const r = config.calculate({ x1: '0', y1: '0', x2: '6', y2: '8' });
    near(parseNumber(getValue(r, 'distance')), 10);
  });

  it('1D steps show absolute value', () => {
    const r = config.calculate({ mode: '1d', x1_1d: '3', x2_1d: '7' });
    const steps = getValue(r, 'steps');
    expect(steps).toContain('|');
  });

  it('2D with large coordinates still works', () => {
    const r = config.calculate({ mode: '2d', x1: '1000000', y1: '0', x2: '1000000', y2: '3000000' });
    near(parseNumber(getValue(r, 'distance')), 3000000);
  });
});
