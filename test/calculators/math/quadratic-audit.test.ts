// Oracle: mpmath at 50 digits / sympy.solve, hand-derived discriminants.
import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/quadratic/index';
import { solveQuadratic, equationText } from '../../../src/calculators/math/quadratic/quadraticMath';
import { getValue } from '../../helpers';

const run = (a: string, b: string, c: string) => config.calculate({ a, b, c });
const q = (a: string, b: string, c: string) => {
  const r = solveQuadratic(a, b, c);
  if (r.kind !== 'ok') throw new Error('expected ok');
  return r.q;
};

describe('quadratic audit', () => {
  it('x^2 - 5x + 6: rational roots stay exact, vertex (2.5, -0.25), factored form', () => {
    const r = run('1', '-5', '6');
    expect(getValue(r, 'equation')).toBe('x² - 5x + 6 = 0');
    expect(getValue(r, 'x1')).toBe('3');
    expect(getValue(r, 'x2')).toBe('2');
    expect(getValue(r, 'exactForm')).toBe('x = 3 or x = 2');
    expect(getValue(r, 'vertex')).toBe('(2.5, -0.25)');
    expect(getValue(r, 'factoredForm')).toBe('(x − 3)(x − 2)');
    expect(getValue(r, 'vietaSum')).toBe('5');
    expect(getValue(r, 'vietaProduct')).toBe('6');
  });
  it('worked example 1 (projectile): roots 0.71739336 / 5.40505562, vertex y 26.91836735 (mpmath)', () => {
    const r = run('-4.9', '30', '-19');
    expect(getValue(r, 'discriminant')).toBe('527.6');
    expect(getValue(r, 'x1')).toBe('0.71739336');
    expect(getValue(r, 'x2')).toBe('5.40505562');
    expect(getValue(r, 'vertex')).toBe('(3.06122449, 26.91836735)');
    expect(getValue(r, 'axis')).toBe('x = 3.06122449');
  });
  it('worked example 2 (fence) and 3 (arch)', () => {
    const f = run('-2', '100', '0');
    expect(getValue(f, 'discriminant')).toBe('10000');
    expect(getValue(f, 'vertex')).toBe('(25, 1250)');
    expect(getValue(f, 'x1')).toBe('0');
    expect(getValue(f, 'x2')).toBe('50');
    const arch = run('-0.01', '2', '-75');
    expect(getValue(arch, 'discriminant')).toBe('1');
    expect(getValue(arch, 'x1')).toBe('50');
    expect(getValue(arch, 'x2')).toBe('150');
    expect(getValue(arch, 'vertex')).toBe('(100, 25)'); // not (100, 100): c is -75 here
  });
  it('no cancellation: x^2 + 1e8 x + 1 has roots -1e-8 and -1e8 (naive formula gives -7.45e-9)', () => {
    const s = q('1', '100000000', '1');
    // mpmath: x1 = -1.00000000000000010000000000000002e-8, x2 = -99999999.99999999
    expect(Math.abs(s.x1! - -1.0000000000000001e-8) / 1e-8).toBeLessThan(1e-12);
    expect(Math.abs(s.x2! - -99999999.99999999) / 1e8).toBeLessThan(1e-12);
    expect(getValue(run('1', '100000000', '1'), 'x1')).toBe('-1e-8');
  });
  it('discriminant sign is exact: c = 1.0000000000000000001 is complex, not a "double root"', () => {
    expect(q('1', '2', '1.0000000000000000001').kind).toBe('complex');
    expect(q('1', '2', '1').kind).toBe('repeated');
    expect(q('1e-9', '2e-9', '1e-9').kind).toBe('repeated'); // tiny but exactly zero
    expect(getValue(run('1', '2', '1'), 'factoredForm')).toBe('(x + 1)²');
  });
  it('exact closed forms for integer coefficients', () => {
    expect(getValue(run('1', '-1', '-1'), 'exactForm')).toBe('x = (1 ± √5) / 2');
    expect(getValue(run('1', '0', '-2'), 'exactForm')).toBe('x = ± √2');
    expect(getValue(run('-1', '1', '1'), 'exactForm')).toBe('x = (1 ± √5) / 2');
    expect(getValue(run('1', '0', '1'), 'exactForm')).toBe('x = ± i');
    expect(getValue(run('2', '4', '10'), 'exactForm')).toBe('x = -1 ± 2i');
    expect(getValue(run('3', '0', '-12'), 'exactForm')).toBe('x = 2 or x = -2');
  });
  it('complex roots: re ± im i with positive im regardless of the sign of a', () => {
    const r = run('1', '2', '5'); // -1 ± 2i
    expect(getValue(r, 'complex1')).toBe('-1 + 2i');
    expect(getValue(r, 'complex2')).toBe('-1 − 2i');
    expect(getValue(run('-1', '-2', '-5'), 'complex1')).toBe('-1 + 2i');
  });
  it('a = 0 is explained as linear instead of returning nothing', () => {
    const r = run('0', '2', '3');
    expect(r[0].id).toBe('error');
    expect(r[0].value).toContain('x = -1.5');
    expect(run('0', '0', '5')[0].value).toContain('no solution');
    expect(run('0', '0', '0')[0].value).toContain('every x');
  });
  it('equation text drops unit coefficients and zero terms', () => {
    expect(equationText(q('-1', '1', '-1'))).toBe('-x² + x - 1 = 0');
    expect(equationText(q('2', '0', '-3'))).toBe('2x² - 3 = 0');
    expect(equationText(q('1', '-1', '0'))).toBe('x² - x = 0');
  });
  it('invalid input is empty', () => {
    expect(run('', '1', '1')).toEqual([]);
    expect(run('x', '1', '1')).toEqual([]);
  });
});

describe('quadratic: extreme coefficients finish (the float-seeded integer square root used to hang or throw)', () => {
  // Oracle: python math.isqrt. x^2 - 10^80 has exact roots +-10^40; disc = 4*10^80 so sqrt(disc) = 2*10^40.
  it('exact roots of x^2 - 1e80 are +-1e40', () => {
    const t0 = Date.now();
    const r = q('1', '0', '-1e80');
    expect(r.kind).toBe('two-real');
    expect(r.exact).toBeTruthy();
    expect(Date.now() - t0).toBeLessThan(1000);
  });

  it('coefficients near 1e-300 return promptly instead of looping for hours', () => {
    const t0 = Date.now();
    const r = solveQuadratic('1e-300', '1e-300', '1e-300');
    expect(['ok', 'incomplete']).toContain(r.kind);
    expect(Date.now() - t0).toBeLessThan(2000);
  });

  it('coefficients near 1e300 return promptly and do not throw', () => {
    const t0 = Date.now();
    expect(() => solveQuadratic('1e300', '1e300', '-1e300')).not.toThrow();
    expect(Date.now() - t0).toBeLessThan(2000);
  });

  it('calculate() survives the same extremes', () => {
    for (const [a, b, c] of [['1e-300', '1', '1'], ['1e300', '1', '1'], ['1', '1e300', '1e-300']] as const) {
      const t0 = Date.now();
      expect(() => run(a, b, c)).not.toThrow();
      expect(Date.now() - t0).toBeLessThan(2000);
    }
  });
});
