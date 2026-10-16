import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/limit-calculator/index';
import { getValue } from '../../helpers';

// Oracle: sympy 1.14 limit(expr, x, a, dir) for every case below.
const L = (expression: string, approachValue: string, direction = 'both') =>
  config.calculate({ expression, approachValue, direction });
const lim = (e: string, a: string, d = 'both') => getValue(L(e, a, d), 'limit');

describe('limit calculator (audit)', () => {
  it('cancellation-prone limits are right (the old "f at 1e-8" gave 0 for (1-cos x)/x^2, true value 1/2)', () => {
    expect(lim('(1-cos(x))/x^2', '0')).toBe('0.5');
    expect(lim('(sin(x)-x)/x^3', '0')).toBe('-0.1666666667'); // -1/6
    expect(lim('(e^x-1-x)/x^2', '0')).toBe('0.5');
    expect(lim('(e^x-1)/x', '0')).toBe('1');
  });
  it('classical limits', () => {
    expect(lim('sin(x)/x', '0')).toBe('1');
    expect(lim('(1+x)^(1/x)', '0')).toBe('2.718281828'); // e
    expect(lim('(x^3-8)/(x-2)', '2')).toBe('12');
    expect(lim('x^x', '0', 'right')).toBe('1');
    expect(lim('x*ln(x)', '0', 'right')).toBe('0');
    expect(lim('sqrt(x)', '0', 'right')).toBe('0');
  });
  it('infinite limits are reported as infinity, not as a huge finite number', () => {
    expect(lim('1/x^2', '0')).toBe('∞');
    expect(lim('ln(x)', '0', 'right')).toBe('-∞');
    expect(lim('tan(x)', '1.5707963267948966', 'left')).toBe('∞');
    expect(lim('tan(x)', '1.5707963267948966', 'right')).toBe('-∞');
    expect(lim('1/(x-1)', '1', 'right')).toBe('∞');
  });
  it('limits that do not exist say so (the old code averaged left and right: 1/x gave a finite number)', () => {
    expect(lim('1/x', '0')).toMatch(/^Does not exist/);
    expect(getValue(L('1/x', '0'), 'leftLimit')).toBe('-∞');
    expect(getValue(L('1/x', '0'), 'rightLimit')).toBe('∞');
    expect(lim('abs(x)/x', '0')).toMatch(/^Does not exist \(left ≠ right\)/);
    expect(getValue(L('abs(x)/x', '0'), 'leftLimit')).toBe('-1');
    expect(getValue(L('abs(x)/x', '0'), 'rightLimit')).toBe('1');
    expect(lim('sin(1/x)', '0')).toMatch(/^Does not exist/);
  });
  it('domain: sqrt(x) at 0 has a right limit but no two-sided limit', () => {
    expect(lim('sqrt(x)', '0', 'both')).toMatch(/^Does not exist/);
    expect(getValue(L('sqrt(x)', '0'), 'leftLimit')).toMatch(/^Undefined/);
    expect(getValue(L('sqrt(x)', '0'), 'rightLimit')).toBe('0');
  });
  it('continuity row compares the limit with f(a)', () => {
    expect(getValue(L('x^2', '3'), 'isContinuous')).toMatch(/^Yes/);
    expect(getValue(L('(x^2-1)/(x-1)', '1'), 'isContinuous')).toMatch(/removable/);
    expect(getValue(L('(x^2-1)/(x-1)', '1'), 'valueAtPoint')).toBe('Undefined');
  });
  it('implicit multiplication and malformed input', () => {
    expect(lim('sin(3x)/x', '0')).toBe('3');
    expect(L('x^2', '3abc')).toEqual([]);
    expect(L('x^2', '')).toEqual([]);
    expect(L('constructor', '0')).toEqual([]);
    expect(L('x^', '0')).toEqual([]);
    expect(L('x+', '0')).toEqual([]);
  });
});
