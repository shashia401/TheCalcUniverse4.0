import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/factoring-calculator/index';
import { getValue } from '../../helpers';

// Reference: sympy 1.14 factor() / solve() for every case below.
const f = (a: string, b: string, c: string) => config.calculate({ a, b, c });

describe('factoring: full factorisation, exact roots (audit)', () => {
  it('pulls out the GCF: 2x² + 4x + 2 = 2(x + 1)² (the old code stopped at (x + 1)(2x + 2))', () => {
    expect(getValue(f('2', '4', '2'), 'factored')).toBe('2(x + 1)²');
  });
  it('c = 0: x² + 3x = x(x + 3) with roots -3 and 0 (the old code printed "1(x − 0)(x − -3)")', () => {
    const r = f('1', '3', '0');
    expect(getValue(r, 'factored')).toBe('x(x + 3)');
    expect([getValue(r, 'root1'), getValue(r, 'root2')]).toEqual(['-3', '0']);
    expect(getValue(f('1', '0', '0'), 'factored')).toBe('x²');
  });
  it('negative leading coefficient factors out -1', () => {
    expect(getValue(f('-1', '5', '-6'), 'factored')).toBe('-(x − 2)(x − 3)');
    expect(getValue(f('-6', '1', '2'), 'factored')).toBe('-(2x + 1)(3x − 2)');
  });
  it('a ≠ 1 cases match sympy', () => {
    expect(getValue(f('3', '1', '-2'), 'factored')).toBe('(x + 1)(3x − 2)');
    expect(getValue(f('12', '1', '-6'), 'factored')).toBe('(4x + 3)(3x − 2)');
    expect(getValue(f('4', '0', '-9'), 'factored')).toBe('(2x + 3)(2x − 3)'); // difference of squares
  });
  it('rational roots keep an exact fraction when the decimal would repeat', () => {
    const r = f('6', '-7', '-3'); // roots -1/3 and 3/2
    expect(getValue(r, 'root1')).toBe('-1/3');
    expect(getValue(r, 'root2')).toBe('1.5');
    expect(getValue(f('3', '1', '-2'), 'root2')).toBe('2/3');
  });
  it('decimal coefficients are read exactly: 0.5x² - 1.5x + 1 = (1/2)(x - 1)(x - 2)', () => {
    const r = f('0.5', '-1.5', '1');
    expect(getValue(r, 'factored')).toBe('(1/2)(x − 1)(x − 2)');
    expect(getValue(r, 'discriminant')).toBe('0.25');
    expect(getValue(r, 'roots')).toBe('x = 1, x = 2');
  });
  it('irrational roots use the stable quadratic formula (x² + 1000000x + 1)', () => {
    const r = f('1', '1000000', '1');
    expect(getValue(r, 'root1')).toBe('-999999.999999');
    expect(getValue(r, 'root2')).toBe('-0.000001');
    expect(getValue(r, 'factored')).toContain('roots rounded');
    expect(getValue(f('1', '0', '-2'), 'roots')).toBe('x = -1.414214, x = 1.414214');
  });
  it('complex roots: x² + 2x + 5 → -1 ± 2i', () => {
    const r = f('1', '2', '5');
    expect(getValue(r, 'roots')).toBe('x = -1 ± 2i');
    expect(r.find((x) => x.id === 'root1')).toBeUndefined();
  });
  it('steps are numbered consecutively and end with the roots', () => {
    const steps = getValue(f('2', '4', '2'), 'steps');
    expect(steps).toContain('Step 2: Factor out the common factor 2');
    expect(steps).toContain('Step 7: Factor out the common binomial');
    expect(steps).toContain('Roots: x = -1, x = -1 (a repeated root)');
  });
  it('the discriminant is exact for large coefficients (b² beyond 2^53)', () => {
    // Python: 94906267² = 9007199515875289 (> 2^53), minus 4ac = 4 → 9007199515875285
    expect(getValue(f('1', '94906267', '1'), 'discriminant')).toBe('9007199515875285');
  });
  it('rejects a = 0 and garbage; declares coefficient bounds', () => {
    expect(f('0', '1', '1')).toEqual([]);
    expect(f('1', 'x', '1')).toEqual([]);
    expect(config.inputs.every((i) => i.max === 1e12 && i.min === -1e12)).toBe(true);
  });
});
