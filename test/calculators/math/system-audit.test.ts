import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/system-of-equations/index';
import { getValue } from '../../helpers';

// Oracle: sympy 1.14 linsolve (exact).
const S = (a1: string, b1: string, c1: string, a2: string, b2: string, c2: string) => config.calculate({ a1, b1, c1, a2, b2, c2 });

describe('system of equations (audit)', () => {
  it('unique solution matches sympy: 2x+3y=7, 5x-2y=3 -> (23/19, 29/19)', () => {
    const r = S('2', '3', '7', '5', '-2', '3');
    expect(getValue(r, 'determinant')).toBe('-19');
    expect(getValue(r, 'x')).toBe('1.210526');
    expect(getValue(r, 'y')).toBe('1.526316');
    expect(getValue(r, 'exact')).toBe('x = 23/19, y = 29/19');
  });
  it('x+3y=6, 2x-y=1 -> (9/7, 11/7)', () => {
    expect(getValue(S('1', '3', '6', '2', '-1', '1'), 'exact')).toBe('x = 9/7, y = 11/7');
  });
  it('decimal dependent system is recognised exactly (0.1*0.6 - 0.3*0.2 is 6.9e-18 in floats -> bogus unique solution)', () => {
    const r = S('0.1', '0.2', '0.3', '0.3', '0.6', '0.9');
    expect(getValue(r, 'determinant')).toBe('0');
    expect(getValue(r, 'solutionType')).toMatch(/^Infinite/);
    expect(getValue(r, 'solutionSet')).toBe('Every point on the line 0.1x + 0.2y = 0.3');
  });
  it('0 = 0 and 0 = 5 are told apart (the old Dx = Dy = 0 test called "0x+0y=0, 0x+0y=5" infinite)', () => {
    expect(getValue(S('0', '0', '0', '0', '0', '5'), 'solutionType')).toMatch(/^No solution/);
    expect(getValue(S('0', '0', '0', '0', '0', '0'), 'solutionType')).toMatch(/^Infinite/);
    expect(getValue(S('0', '0', '0', '1', '1', '2'), 'solutionSet')).toBe('Every point on the line x + y = 2');
    expect(getValue(S('0', '0', '3', '1', '1', '2'), 'solutionType')).toMatch(/^No solution/);
    expect(getValue(S('1', '1', '2', '0', '0', '0'), 'solutionType')).toMatch(/^Infinite/);
  });
  it('parallel lines, coincident lines', () => {
    expect(getValue(S('1', '1', '3', '1', '1', '7'), 'solutionType')).toMatch(/^No solution/);
    expect(getValue(S('2', '1', '5', '4', '2', '15'), 'solutionType')).toMatch(/^No solution/);
    expect(getValue(S('2', '3', '6', '4', '6', '12'), 'solutionType')).toMatch(/^Infinite/);
  });
  it('vertical / horizontal lines: x = 4 and y = -2', () => {
    const r = S('1', '0', '4', '0', '1', '-2');
    expect(getValue(r, 'x')).toBe('4');
    expect(getValue(r, 'y')).toBe('-2');
  });
  it('nearly singular but exactly solvable: x+y=2, x+1.0000000001y=2.0000000001 -> (1, 1)', () => {
    const r = S('1', '1', '2', '1', '1.0000000001', '2.0000000001');
    expect(getValue(r, 'determinant')).toBe('0.0000000001'); // 1e-10, not rounded to 0
    expect(getValue(r, 'x')).toBe('1');
    expect(getValue(r, 'y')).toBe('1');
  });
  it('rejects malformed numbers instead of truncating them', () => {
    expect(S('2abc', '3', '7', '5', '-2', '3')).toEqual([]);
    expect(S('2', '3', '', '5', '-2', '3')).toEqual([]);
  });
});
