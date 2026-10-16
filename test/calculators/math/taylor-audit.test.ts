import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/taylor-series/index';
import { ratApprox } from '../../../src/calculators/math/taylor-series/taylorFormat';
import { getValue } from '../../helpers';

// Oracle: sympy 1.14 series() / diff(f, x, k).subs(x, a)/k!  (coefficients also checked in cas.test.ts).
const T = (expression: string, center = '0', order = '5', xValue?: string) =>
  config.calculate({ expression, center, order, ...(xValue !== undefined ? { xValue } : {}) });

describe('taylor series (audit)', () => {
  it('Maclaurin series print exact fractions', () => {
    expect(getValue(T('sin(x)', '0', '7'), 'approximation')).toBe('x - x^3/6 + x^5/120 - x^7/5040');
    expect(getValue(T('cos(x)', '0', '6'), 'approximation')).toBe('1 - x^2/2 + x^4/24 - x^6/720');
    expect(getValue(T('e^x', '0', '4'), 'approximation')).toBe('1 + x + x^2/2 + x^3/6 + x^4/24');
    expect(getValue(T('1/(1-x)', '0', '4'), 'approximation')).toBe('1 + x + x^2 + x^3 + x^4');
    expect(getValue(T('ln(1+x)', '0', '4'), 'approximation')).toBe('x - x^2/2 + x^3/3 - x^4/4');
    expect(getValue(T('atan(x)', '0', '5'), 'approximation')).toBe('x - x^3/3 + x^5/5');
    expect(getValue(T('tan(x)', '0', '5'), 'approximation')).toBe('x + x^3/3 + 2*x^5/15');
    expect(getValue(T('sqrt(1+x)', '0', '3'), 'approximation')).toBe('1 + x/2 - x^2/8 + x^3/16');
  });
  it('other centres: ln(x) about 2, e^x about 1 (the old known-list code printed constant term 1, not e)', () => {
    // ln x = ln2 + (x-2)/2 - (x-2)^2/8 + (x-2)^3/24 ...
    const r = T('ln(x)', '2', '3');
    expect(getValue(r, 'approximation')).toBe('0.693147 + (x - 2)/2 - (x - 2)^2/8 + (x - 2)^3/24');
    // e^x about a=1: e * sum (x-1)^k / k!
    const e = T('e^x', '1', '2');
    expect(getValue(e, 'approximation')).toBe('2.71828 + 2.71828*(x - 1) + 1.35914*(x - 1)^2');
  });
  it('negative centre prints (x + c)', () => {
    expect(getValue(T('x^2', '-1', '2'), 'approximation')).toBe('1 - 2*(x + 1) + (x + 1)^2');
  });
  it('orders above 5 are real (old code returned 0 for every derivative beyond the 4th for unknown functions)', () => {
    // x*exp(x) about 0: x + x^2 + x^3/2 + x^4/6 + x^5/24 + x^6/120
    expect(getValue(T('x*exp(x)', '0', '6'), 'approximation')).toBe('x + x^2 + x^3/2 + x^4/6 + x^5/24 + x^6/120');
  });
  it('evaluation, exact value and error: sin x order 3 at 0.1 -> P = 0.0998333333, f = 0.0998334166', () => {
    const r = T('sin(x)', '0', '3', '0.1');
    expect(getValue(r, 'evaluation')).toBe('0.09983333333');
    expect(getValue(r, 'actual')).toBe('0.09983341665');
    expect(Number(getValue(r, 'error'))).toBeCloseTo(8.3e-8, 9);
  });
  it('worked example 2: e^x order 5 at x = 2 is 109/15 = 7.266667 (exact e^2 = 7.389056)', () => {
    const r = T('e^x', '0', '5', '2');
    expect(Number(getValue(r, 'evaluation'))).toBeCloseTo(109 / 15, 9);
    expect(Number(getValue(r, 'actual'))).toBeCloseTo(7.38905609893065, 9);
    expect(((7.38905609893065 - 109 / 15) / 7.38905609893065) * 100).toBeCloseTo(1.66, 2); // "about 1.7%"
  });
  it('functions that are not analytic at the centre give an explanation, not a wrong series', () => {
    for (const [e, c] of [['ln(x)', '0'], ['sqrt(x)', '0'], ['1/x', '0'], ['abs(x)', '0']] as const) {
      const r = T(e, c, '3');
      expect(getValue(r, 'approximation')).toMatch(/^Not available/);
    }
  });
  it('order and centre handling: blank defaults, non-integer / negative / text rejected, big orders capped at 20', () => {
    expect(getValue(config.calculate({ expression: 'e^x' }), 'numberOfTerms')).toBe('6');
    expect(T('e^x', '0', '2.5')).toEqual([]);
    expect(T('e^x', '0', '-1')).toEqual([]);
    expect(T('e^x', '0', '3abc')).toEqual([]);
    expect(T('e^x', '1..2', '3')).toEqual([]);
    expect(getValue(T('e^x', '0', '9999'), 'numberOfTerms')).toBe('21');
    expect(getValue(T('5', '0', '3'), 'approximation')).toBe('5');
    expect(getValue(T('0', '0', '3'), 'approximation')).toBe('0');
  });
  it('rejects junk and injection strings', () => {
    for (const bad of ['constructor', 'sin x', 'x^', '__proto__', 'process']) expect(T(bad)).toEqual([]);
  });
  it('ratApprox recognises 1/n! to n = 10 and does not turn e into a fraction', () => {
    expect(ratApprox(1 / 3628800)).toEqual([1, 3628800]);
    expect(ratApprox(2 / 15)).toEqual([2, 15]);
    expect(ratApprox(Math.E)).toBeNull();
    expect(ratApprox(Math.PI)).toBeNull();
  });
});
