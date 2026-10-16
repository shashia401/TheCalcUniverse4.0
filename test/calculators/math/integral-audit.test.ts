import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/integral-calculator/index';
import { getValue } from '../../helpers';

// Oracle: mpmath 30-digit quad() / exact antiderivatives; Simpson error is checked against the reported estimate.
const I = (expression: string, lowerBound: string, upperBound: string, n?: string) =>
  config.calculate({ expression, lowerBound, upperBound, ...(n ? { n } : {}) });
const num = (r: ReturnType<typeof I>) => Number(getValue(r, 'result'));

describe('integral calculator (audit)', () => {
  it('known integrals to Simpson accuracy', () => {
    expect(num(I('e^(-x^2)', '0', '1'))).toBeCloseTo(0.746824132812427, 8);
    expect(num(I('e^(-x)*sin(x)', '0', '3.141592653589793'))).toBeCloseTo(0.5216069591318861, 7);
    expect(num(I('1/(1+x^2)', '0', '1'))).toBeCloseTo(Math.PI / 4, 9);
    expect(num(I('x*sin(x)', '0', '2'))).toBeCloseTo(1.741591099919966, 8);
    expect(num(I('cos(x)^2', '0', '3'))).toBeCloseTo(1.4301461254502685, 7);
  });
  it('the placeholder example 3x+2 (implicit multiplication) works: integral 0..2 = 10', () => {
    expect(num(I('3x+2', '0', '2'))).toBeCloseTo(10, 12);
  });
  it('polynomials up to cubic are exact with Simpson: x^3 on [0,2] = 4', () => {
    expect(num(I('x^3', '0', '2', '2'))).toBeCloseTo(4, 12);
  });
  it('reversed bounds negate; |x| on [-2,1] = 2.5 (kink inside a panel is why n matters)', () => {
    expect(num(I('x^2', '1', '0'))).toBeCloseTo(-1 / 3, 6);
    expect(num(I('abs(x)', '-2', '1', '100'))).toBeCloseTo(2.5, 10);
  });
  it('error estimate is reported and bounds the real error: sqrt(x) on [0,1] (true 2/3)', () => {
    const r = I('sqrt(x)', '0', '1', '100');
    const err = Math.abs(num(r) - 2 / 3);
    const est = Number(getValue(r, 'errorEstimate').replace('~', ''));
    expect(est).toBeGreaterThan(0);
    expect(err).toBeLessThan(5 * est + 1e-12);
  });
  it('n handling: blank -> 100, odd -> +1, "50abc" -> default 100 (not 50), huge capped at 100000', () => {
    expect(getValue(I('x', '0', '1'), 'subdivisions')).toBe('100');
    expect(getValue(I('x', '0', '1', '51'), 'subdivisions')).toBe('52');
    expect(getValue(I('x', '0', '1', '50abc'), 'subdivisions')).toBe('100');
    expect(getValue(I('x', '0', '1', '1e9'), 'subdivisions')).toBe('100000');
    expect(getValue(I('x', '0', '1', '2.5'), 'subdivisions')).toBe('100');
  });
  it('non-finite integrand, malformed bounds and bad expressions give no result', () => {
    expect(I('1/x', '-1', '1')).toEqual([]); // pole at 0 is a node of the rule
    expect(I('ln(x)', '0', '1')).toEqual([]);
    expect(I('x', '0', '1abc')).toEqual([]);
    expect(I('x', '', '1')).toEqual([]);
    expect(I('constructor', '0', '1')).toEqual([]);
    expect(I('x^', '0', '1')).toEqual([]);
  });
});
