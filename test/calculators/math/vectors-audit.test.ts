import { describe, it, expect } from 'vitest';
import cross from '../../../src/calculators/math/cross-product/index';
import dot from '../../../src/calculators/math/dot-product/index';
import vec from '../../../src/calculators/math/vector-calculator/index';
import { angleDeg3 } from '../../../src/utils/vector';
import { getValue } from '../../helpers';

// Oracle: sympy 1.14 (Matrix.dot / .cross / acos) for every expected value below.
const X = (a: number[], b: number[]) => ({
  v1x: String(a[0]),
  v1y: String(a[1]),
  v1z: String(a[2] ?? ''),
  v2x: String(b[0]),
  v2y: String(b[1]),
  v2z: String(b[2] ?? ''),
});

describe('cross product (audit)', () => {
  it('(2,3,4) x (5,6,7) = (-3,6,-3), |.| = sqrt(54) = 7.348469, orthogonality check is 0', () => {
    const r = cross.calculate(X([2, 3, 4], [5, 6, 7]));
    expect(getValue(r, 'crossProduct')).toBe('(-3, 6, -3)');
    expect(getValue(r, 'magnitude')).toBe('7.348469');
    expect(getValue(r, 'area')).toBe('7.348469');
    expect(getValue(r, 'verification')).toBe('0, 0');
    expect(getValue(r, 'unitVector')).toBe('(-0.408248, 0.816497, -0.408248)');
  });
  it('parallel vectors give the zero vector and an explicit "undefined" unit vector', () => {
    const r = cross.calculate(X([1, 2, 3], [-2, -4, -6]));
    expect(getValue(r, 'crossProduct')).toBe('(0, 0, 0)');
    expect(getValue(r, 'unitVector')).toMatch(/^Undefined/);
    expect(getValue(r, 'area')).toBe('0');
  });
  it('decimal inputs: (0.1,0.2,0.3) x (0.3,0.1,-0.2) = (-0.07, 0.11, -0.05)', () => {
    const r = cross.calculate(X([0.1, 0.2, 0.3], [0.3, 0.1, -0.2]));
    expect(getValue(r, 'crossProduct')).toBe('(-0.07, 0.11, -0.05)');
    expect(getValue(r, 'magnitude')).toBe('0.139642');
    expect(getValue(r, 'verification')).toBe('0, 0'); // float fuzz of ~1e-17 must not show
  });
  it('tiny components are not flushed to 0: (1e-9,0,0) x (0,1e-9,0) = (0,0,1e-18)', () => {
    expect(getValue(cross.calculate(X([1e-9, 0, 0], [0, 1e-9, 0])), 'crossProduct')).toBe('(0, 0, 1e-18)');
  });
  it('rejects malformed text instead of truncating it, and overflow', () => {
    expect(cross.calculate({ ...X([1, 2, 3], [4, 5, 6]), v1x: '1abc' })).toEqual([]);
    expect(cross.calculate({ ...X([1, 2, 3], [4, 5, 6]), v1z: '' })).toEqual([]);
    expect(cross.calculate(X([1e200, 0, 0], [0, 1e200, 0]))).toEqual([]); // 1e400 overflows a double
  });
});

describe('dot product (audit)', () => {
  it('(2,3,4).(5,6,7) = 56, angle 7.475791, cos 0.9915, projection 56/|b| = 5.339390', () => {
    const r = dot.calculate(X([2, 3, 4], [5, 6, 7]));
    expect(getValue(r, 'dotProduct')).toBe('56');
    expect(getValue(r, 'magnitude1')).toBe('5.385165');
    expect(getValue(r, 'magnitude2')).toBe('10.488088');
    expect(getValue(r, 'angleDeg')).toBe('7.475791°');
    expect(getValue(r, 'cosTheta')).toBe('0.9915');
    expect(getValue(r, 'projection')).toBe('5.33939');
    expect(getValue(r, 'vectorProjection')).toBe('(2.545455, 3.054545, 3.563636)');
    expect(getValue(r, 'orthogonal')).toBe('No');
  });
  it('antiparallel vectors give exactly 180 degrees and cos = -1', () => {
    const r = dot.calculate(X([1, 2, 3], [-2, -4, -6]));
    expect(getValue(r, 'angleDeg')).toBe('180°');
    expect(getValue(r, 'cosTheta')).toBe('-1');
  });
  it('orthogonal (1,2,2).(2,1,-2) = 0, 90 degrees; and 2D (3,4).(-4,3)', () => {
    const r = dot.calculate(X([1, 2, 2], [2, 1, -2]));
    expect(getValue(r, 'angleDeg')).toBe('90°');
    expect(getValue(r, 'orthogonal')).toBe('Yes');
    const r2 = dot.calculate(X([3, 4], [-4, 3]));
    expect(getValue(r2, 'angleDeg')).toBe('90°');
    expect(getValue(r2, 'orthogonal')).toBe('Yes');
  });
  it('tiny angle is not rounded to 0 (atan2 form): (1,0,0),(1,1e-9,0) -> 5.72958e-8 degrees (sympy atan(1e-9))', () => {
    expect(getValue(dot.calculate(X([1, 0, 0], [1, 1e-9, 0])), 'angleDeg')).toBe('5.72958e-8°');
  });
  it('orthogonality test is scale-free: (1e-6,0).(0,1e-6) is orthogonal; (1e-6,0).(1e-6,1e-6) is not', () => {
    expect(getValue(dot.calculate(X([1e-6, 0], [0, 1e-6])), 'orthogonal')).toBe('Yes');
    expect(getValue(dot.calculate(X([1e-6, 0], [1e-6, 1e-6])), 'orthogonal')).toBe('No');
  });
  it('zero vector: angle, cos and projection are reported as undefined, not 0', () => {
    const r = dot.calculate(X([0, 0, 0], [1, 2, 3]));
    expect(getValue(r, 'angleDeg')).toMatch(/^Undefined/);
    expect(getValue(r, 'cosTheta')).toMatch(/^Undefined/);
    expect(getValue(r, 'dotProduct')).toBe('0');
    const r2 = dot.calculate(X([1, 2, 3], [0, 0, 0]));
    expect(getValue(r2, 'projection')).toMatch(/^Undefined/);
    expect(getValue(r2, 'vectorProjection')).toMatch(/^Undefined/);
  });
  it('huge components: angle stays exact (unit-vector form); magnitudes use hypot', () => {
    expect(angleDeg3([1e200, 0, 0], [0, 1e200, 0])).toBe(90);
    const r = dot.calculate(X([1e154, 1e154], [1e154, 0]));
    expect(getValue(r, 'magnitude1')).toBe('1.4142135623730953e+154'); // sqrt(2)e154: x*x would overflow to Infinity
    expect(getValue(r, 'angleDeg')).toBe('45°');
  });
  it('rejects text and bad z', () => {
    expect(dot.calculate({ ...X([1, 2, 3], [4, 5, 6]), v1y: '2,5' })).toEqual([]);
    expect(dot.calculate({ ...X([1, 2, 3], [4, 5, 6]), v2z: 'x' })).toEqual([]);
  });
});

describe('vector calculator (audit)', () => {
  it('3D example matches sympy: sum, difference, cross, dot, angle', () => {
    const r = vec.calculate(X([2, 3, 4], [5, 6, 7]));
    expect(getValue(r, 'sum')).toBe('(7, 9, 11)');
    expect(getValue(r, 'difference')).toBe('(-3, -3, -3)');
    expect(getValue(r, 'crossProduct')).toBe('(-3, 6, -3)');
    expect(getValue(r, 'dotProduct')).toBe('56');
    expect(getValue(r, 'angleDeg')).toBe('7.475791°');
  });
  it('2D: blank z fields give two-component results and cross (0,0,z) = (0,0,-2)', () => {
    const r = vec.calculate(X([1, 2], [3, 4]));
    expect(getValue(r, 'sum')).toBe('(4, 6)');
    expect(getValue(r, 'difference')).toBe('(-2, -2)');
    expect(getValue(r, 'crossProduct')).toBe('(0, 0, -2)'); // 1*4 - 2*3
  });
  it('a missing (undefined) z field is 2D, not 3D', () => {
    const r = vec.calculate({ v1x: '1', v1y: '2', v2x: '3', v2y: '4' });
    expect(getValue(r, 'sum')).toBe('(4, 6)');
  });
  it('zero vector: angle and unit vector undefined', () => {
    const r = vec.calculate(X([0, 0], [3, 4]));
    expect(getValue(r, 'angleDeg')).toMatch(/^Undefined/);
    expect(getValue(r, 'unit1')).toMatch(/^Undefined/);
    expect(getValue(r, 'unit2')).toBe('(0.6, 0.8)');
  });
  it('rejects truncated text', () => {
    expect(vec.calculate({ ...X([1, 2], [3, 4]), v1x: '1e' })).toEqual([]);
  });
});
