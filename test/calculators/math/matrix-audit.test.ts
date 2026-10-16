import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/matrix/index';
import { getValue } from '../../helpers';

// Oracle: sympy 1.14 Matrix.det() / .inv() / .rank() / .rref() (exact rational arithmetic).
const run = (size: number, operation: string, matrixA: string) => config.calculate({ size: String(size), operation, matrixA });

describe('matrix calculator: exact arithmetic (audit)', () => {
  it('determinants match sympy for 2x2 .. 5x5', () => {
    expect(getValue(run(2, 'determinant', '1 2\n3 4'), 'determinant')).toBe('-2');
    expect(getValue(run(3, 'determinant', '2 -1 0\n-1 2 -1\n0 -1 2'), 'determinant')).toBe('4');
    expect(getValue(run(4, 'determinant', '1 2 3 4\n5 6 7 8\n2 6 4 8\n3 1 1 2'), 'determinant')).toBe('72');
    expect(getValue(run(5, 'determinant', '1 2 0 0 0\n0 1 3 0 0\n0 0 1 4 0\n0 0 0 1 5\n2 0 0 0 1'), 'determinant')).toBe('241');
  });
  it('singular matrices have det exactly 0 and are flagged', () => {
    const r = run(3, 'determinant', '1 2 3\n4 5 6\n7 8 9');
    expect(getValue(r, 'determinant')).toBe('0');
    expect(getValue(r, 'invertible')).toMatch(/^No/);
  });
  it('a small but regular determinant is not rounded to 0 (old code used |det| < 1e-10)', () => {
    // det(diag(1e-6, 1e-6)) = 1e-12 exactly
    expect(getValue(run(2, 'determinant', '0.000001 0\n0 0.000001'), 'determinant')).toBe('1/1000000000000');
    expect(getValue(run(2, 'determinant', '0.000001 0\n0 0.000001'), 'invertible')).toBe('Yes');
    expect(getValue(run(2, 'inverse', '0.000001 0\n0 0.000001'), 'inverse')).toBe('1000000 0 | 0 1000000');
  });
  it('decimal entries are exact: [[0.1,0.2],[0.3,0.4]] has det -1/50 and inverse [[-20,10],[15,-5]]', () => {
    const d = run(2, 'determinant', '0.1 0.2\n0.3 0.4');
    expect(getValue(d, 'determinant')).toBe('-0.02');
    expect(getValue(run(2, 'inverse', '0.1 0.2\n0.3 0.4'), 'inverse')).toBe('-20 10 | 15 -5');
  });
  it('inverses are exact fractions', () => {
    expect(getValue(run(2, 'inverse', '1 2\n3 4'), 'inverse')).toBe('-2 1 | 1.5 -0.5');
    expect(getValue(run(3, 'inverse', '2 -1 0\n-1 2 -1\n0 -1 2'), 'inverse')).toBe('0.75 0.5 0.25 | 0.5 1 0.5 | 0.25 0.5 0.75');
    const r = run(4, 'inverse', '1 2 3 4\n5 6 7 8\n2 6 4 8\n3 1 1 2');
    expect(getValue(r, 'inverse').split(' | ')[0]).toBe('-1/6 1/18 -1/18 1/3');
    expect(getValue(r, 'inverseDecimal').split(' | ')[0]).toBe('-0.166667 0.055556 -0.055556 0.333333');
    const r5 = run(5, 'inverse', '1 2 0 0 0\n0 1 3 0 0\n0 0 1 4 0\n0 0 0 1 5\n2 0 0 0 1');
    expect(getValue(r5, 'inverse').split(' | ')[0]).toBe('1/241 -2/241 6/241 -24/241 120/241');
  });
  it('singular inverse reports an error row; permutation matrix inverts to itself', () => {
    expect(getValue(run(3, 'inverse', '1 2 3\n2 4 6\n1 0 1'), 'inverse')).toMatch(/singular/i);
    expect(getValue(run(2, 'inverse', '0 1\n1 0'), 'inverse')).toBe('0 1 | 1 0');
  });
  it('rank and RREF match sympy', () => {
    const r = run(3, 'rank', '1 2 3\n4 5 6\n7 8 9');
    expect(getValue(r, 'rank')).toBe('2');
    expect(getValue(r, 'nullity')).toBe('1');
    expect(getValue(r, 'rref')).toBe('1 0 -1 | 0 1 2 | 0 0 0');
    expect(getValue(run(3, 'rank', '1 2 3\n2 4 6\n1 0 1'), 'rref')).toBe('1 0 1 | 0 1 1 | 0 0 0');
    expect(getValue(run(4, 'rank', '1 2 3 4\n5 6 7 8\n2 6 4 8\n3 1 1 2'), 'rank')).toBe('4');
  });
  it('accepts commas and semicolons as separators', () => {
    expect(getValue(run(2, 'determinant', '1,2;3,4'), 'determinant')).toBe('-2');
  });
  it('rejects malformed input instead of truncating it (parseFloat("2abc") was 2)', () => {
    expect(run(2, 'determinant', '1 2abc\n3 4')).toEqual([]);
    expect(run(2, 'determinant', '1 2\n3')).toEqual([]);
    expect(run(2, 'determinant', '1 2 3\n3 4 5')).toEqual([]); // non-square
    expect(run(3, 'determinant', '1 2\n3 4')).toEqual([]);
    expect(run(2, 'determinant', '1 2\n3 Infinity')).toEqual([]);
    expect(run(6, 'determinant', '1')).toEqual([]);
    expect(run(2, 'determinant', '1e400 0\n0 1')).toEqual([]);
  });
  it('huge integers stay exact (beyond 2^53): det [[9007199254740993, 1],[1, 1]] = 9007199254740992', () => {
    expect(getValue(run(2, 'determinant', '9007199254740993 1\n1 1'), 'determinant')).toBe('9007199254740992');
  });
});
