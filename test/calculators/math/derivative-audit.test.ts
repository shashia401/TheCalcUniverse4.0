import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/derivative-calculator/index';
import { getValue } from '../../helpers';

// Oracle: sympy 1.14 diff(); the symbolic engine itself is checked against sympy in cas.test.ts.
const d = (expression: string, extra: Record<string, string> = {}) => config.calculate({ expression, ...extra });

describe('derivative calculator (audit)', () => {
  it('product rule: d/dx x^3 sin(x) = 3x^2 sin(x) + x^3 cos(x)', () => {
    const r = d('x^3*sin(x)');
    expect(getValue(r, 'derivative')).toBe('3*x^2*sin(x) + x^3*cos(x)');
    expect(getValue(r, 'steps')).toContain('product rule');
  });
  it('quotient rule evaluated: d/dx (x^2+1)/(x-3) at 0.7 = -0.890359168241966 (sympy)', () => {
    const r = d('(x^2+1)/(x-3)', { xValue: '0.7' });
    expect(Number(getValue(r, 'evaluated'))).toBeCloseTo(-0.890359168241966, 10);
    expect(getValue(r, 'steps')).toContain('quotient rule');
  });
  it('chain rule: d/dx sin(x^2) = 2x cos(x^2); d/dx e^(-x^2) at 0.7 = -0.8576769518581825', () => {
    expect(getValue(d('sin(x^2)'), 'derivative')).toBe('2*x*cos(x^2)');
    expect(getValue(d('sin(x^2)'), 'steps')).toContain('chain rule');
    expect(Number(getValue(d('e^(-x^2)', { xValue: '0.7' }), 'evaluated'))).toBeCloseTo(-0.8576769518581825, 10);
  });
  it('second and third derivatives: (3x^2+2x+1)\'\' = 6; (x^4)\'\'\' = 24x', () => {
    expect(getValue(d('3x^2+2x+1', { order: '2' }), 'derivative')).toBe('6');
    expect(getValue(d('x^4', { order: '3' }), 'derivative')).toBe('24*x');
    expect(getValue(d('x^4', { order: '3' }), 'steps')).toContain("f''(x) = 12*x^2");
  });
  it("trig / log: (sin x)' = cos x, (ln x)' = 1/x, (log10 x)' at 2.5 = 1/(2.5 ln 10) = 0.17371779276130071", () => {
    expect(getValue(d('sin(x)'), 'derivative')).toBe('cos(x)');
    expect(getValue(d('ln(x)'), 'derivative')).toBe('1/x');
    expect(Number(getValue(d('log(x)', { xValue: '2.5' }), 'evaluated'))).toBeCloseTo(0.17371779276130071, 10);
  });
  it('input the old polynomial-only parser silently got wrong now differentiates correctly (or is rejected)', () => {
    // old: "3x^2 + sin(x)" -> the regex skipped "sin(" and treated the x inside as a term
    expect(getValue(d('3x^2 + sin(x)'), 'derivative')).toBe('6*x + cos(x)');
    // old: "3*x^2" dropped the * and parsed "3" + "x^2"
    expect(getValue(d('3*x^2'), 'derivative')).toBe('6*x');
    // old: "x^2.5" parsed as x^2 + .5
    expect(getValue(d('x^2.5'), 'derivative')).toBe('5*x^(3/2)/2');
    expect(d('3x^2 + @')).toEqual([]);
    expect(d('y^2')).toEqual([]);
    expect(d('x^')).toEqual([]);
  });
  it('decimal coefficients have no float noise: 0.1x + 0.2x -> 0.3x, derivative 0.3', () => {
    expect(getValue(d('0.1x+0.2x'), 'original')).toBe('0.3*x');
    expect(getValue(d('0.1x+0.2x'), 'derivative')).toBe('0.3');
  });
  it('rational exponents print exactly: d/dx x^(1/3) = 1/(3 x^(2/3)); sqrt(x)', () => {
    expect(getValue(d('x^(1/3)'), 'derivative')).toBe('1/(3*x^(2/3))');
    expect(getValue(d('sqrt(x)'), 'derivative')).toBe('1/(2*sqrt(x))');
  });
  it('evaluation outside the domain says so instead of NaN; bad x is ignored', () => {
    expect(getValue(d('ln(x)', { xValue: '-1' }), 'evaluated')).toMatch(/^Undefined/);
    expect(getValue(d('abs(x)', { xValue: '0' }), 'evaluated')).toMatch(/^Undefined/);
    expect(d('x^2', { xValue: '2abc' }).find((r) => r.id === 'evaluated')).toBeUndefined();
    expect(getValue(d('x^2', { xValue: '3' }), 'evaluated')).toBe('6');
    expect(getValue(d('x^2', { xValue: '3', order: '2' }), 'evaluated')).toBe('2');
  });
  it('expression size is capped (no hang on huge input)', () => {
    expect(d('x+'.repeat(300) + 'x')).toEqual([]);
  });
});
