import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/polynomial-calculator/index';
import { getValue } from '../../helpers';

// Oracle: Python fractions / sympy (exact rational arithmetic).
const P = (coefficients: string, x: string) => config.calculate({ coefficients, x });

describe('polynomial calculator (audit)', () => {
  it('exact evaluation: x^3 - 2x^2 + 1 at 2 = 1; derivative 3x^2 - 4x = 4', () => {
    const r = P('1, -2, 0, 1', '2');
    expect(getValue(r, 'evaluated')).toBe('1');
    expect(getValue(r, 'derivativeValue')).toBe('4');
    expect(getValue(r, 'polynomial')).toBe('x³ − 2x² + 1');
  });
  it('decimals are exact: 1.1^3 = 1.331 (binary floats give 1.3310000000000004); 0.1+0.2 style sums', () => {
    expect(getValue(P('1, 0, 0, 0', '1.1'), 'evaluated')).toBe('1.331');
    expect(getValue(P('1, -0.3', '0.1'), 'evaluated')).toBe('-0.2');
    expect(getValue(P('10, -3, 0.3, -0.01', '0.1'), 'evaluated')).toBe('0'); // = 10(x-0.1)^3 expanded, so exactly 0 at x = 0.1
  });
  it('integers beyond 2^53 stay exact: (x + 1) at 9007199254740993 = 9007199254740994', () => {
    expect(getValue(P('1, 1', '9007199254740993'), 'evaluated')).toBe('9007199254740994');
  });
  it('huge results use scientific notation instead of Infinity/NaN: x^20 at 1e10 = 1e200', () => {
    expect(getValue(P('1' + ', 0'.repeat(20), '10000000000'), 'evaluated')).toBe('1.000000000e+200');
  });
  it('leading zero coefficients do not inflate the degree: "0, 0, 2, 3" is 2x + 3', () => {
    const r = P('0, 0, 2, 3', '4');
    expect(getValue(r, 'degree')).toBe('1');
    expect(getValue(r, 'evaluated')).toBe('11');
    expect(getValue(r, 'polynomial')).toBe('2x + 3');
  });
  it('zero and constant polynomials', () => {
    const z = P('0, 0', '5');
    expect(getValue(z, 'polynomial')).toBe('0');
    expect(getValue(z, 'evaluated')).toBe('0');
    expect(getValue(P('7', '5'), 'evaluated')).toBe('7');
    expect(() => getValue(P('7', '5'), 'derivativeValue')).toThrow();
  });
  it('negative x, odd/even powers: -x^3 + x^2 at -2 = 12', () => {
    expect(getValue(P('-1, 1, 0, 0', '-2'), 'evaluated')).toBe('12');
  });
  it('separators: spaces and semicolons work like commas; malformed text is rejected, not truncated', () => {
    expect(getValue(P('1 -3 2', '4'), 'evaluated')).toBe('6');
    expect(getValue(P('1;-3;2', '4'), 'evaluated')).toBe('6');
    expect(P('1, 2x, 3', '4')).toEqual([]);
    expect(P('1, 2, 3', '4abc')).toEqual([]);
    expect(P('1, 2, 3', '')).toEqual([]);
    expect(P('1,'.repeat(61) + '1', '1')).toEqual([]); // more than 60 coefficients
  });
});
