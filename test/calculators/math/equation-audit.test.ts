import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/equation-solver/index';
import { polyRoots } from '../../../src/calculators/math/shared/polyRoots';
import { parseDecimalExact } from '../../../src/utils/rational';
import { getValue } from '../../helpers';

// Oracle: sympy 1.14 roots() / solve() (exact), numeric roots to 12 digits.
const E = (equationType: string, ...c: string[]) => {
  const v: Record<string, string> = { equationType };
  ['a', 'b', 'c', 'd', 'e'].slice(0, c.length).forEach((k, i) => (v[k] = c[i]));
  return config.calculate(v);
};
const rootsOf = (...c: string[]) => polyRoots(c.map((s) => parseDecimalExact(s)!)).map((r) => [+r.re.toFixed(9), +r.im.toFixed(9), r.multiplicity]);

describe('equation solver: linear', () => {
  it('exact: 3x - 9 = 0 -> 3; 0.3x + 0.1 = 0 -> -1/3 shown as -0.33333333', () => {
    expect(getValue(E('linear', '3', '-9'), 'root1')).toBe('3');
    expect(getValue(E('linear', '0.3', '0.1'), 'root1')).toBe('-0.33333333');
  });
  it('a = 0: no solution when b != 0, infinitely many when b = 0', () => {
    expect(getValue(E('linear', '0', '5'), 'nature')).toMatch(/^No solution/);
    expect(getValue(E('linear', '0', '0'), 'nature')).toMatch(/^Infinitely many/);
  });
});

describe('equation solver: quadratic (exact discriminant)', () => {
  it('x^2 + 0.2x + 0.01 = 0 has a repeated root -0.1 (a float discriminant 0.2*0.2 - 4*0.01 = 6.9e-18 > 0 gave two "distinct" roots)', () => {
    const r = E('quadratic', '1', '0.2', '0.01');
    expect(getValue(r, 'discriminant')).toBe('0');
    expect(getValue(r, 'nature')).toContain('repeated');
    expect(getValue(r, 'root1')).toBe('-0.1');
  });
  it('cancellation: x^2 + 1e8 x + 1 = 0 -> -1e8 and -1e-8 (c/q form); old formula gave 0 for the small root', () => {
    const r = E('quadratic', '1', '100000000', '1');
    expect(getValue(r, 'root2')).toBe('-100000000');
    expect(getValue(r, 'root1')).toBe('-1e-8');
  });
  it('rational, irrational and complex cases (sympy): 2x^2-3x+1 -> 1, 0.5; x^2-2 -> ±1.41421356; x^2+2x+5 -> -1 ± 2i', () => {
    const r1 = E('quadratic', '2', '-3', '1');
    expect([getValue(r1, 'root1'), getValue(r1, 'root2')]).toEqual(['1', '0.5']);
    const r2 = E('quadratic', '1', '0', '-2');
    expect(getValue(r2, 'root1')).toBe('1.41421356');
    expect(getValue(r2, 'root2')).toBe('-1.41421356');
    const r3 = E('quadratic', '1', '2', '5');
    expect(getValue(r3, 'root1')).toBe('-1 + 2i');
    expect(getValue(r3, 'root2')).toBe('-1 - 2i');
  });
  it('negative leading coefficient keeps the +/- imaginary parts in order: -x^2 - 2x - 5 = 0 -> -1 + 2i, -1 - 2i', () => {
    const r = E('quadratic', '-1', '-2', '-5');
    expect(getValue(r, 'root1')).toBe('-1 + 2i');
    expect(getValue(r, 'root2')).toBe('-1 - 2i');
  });
  it('a = 0 falls back to the linear solution with an explanation', () => {
    expect(getValue(E('quadratic', '0', '4', '-2'), 'nature')).toContain('0.5');
  });
});

describe('equation solver: cubic and quartic', () => {
  it('distinct real roots: x^3 - 6x^2 + 11x - 6 -> 1, 2, 3', () => {
    const r = E('cubic', '1', '-6', '11', '-6');
    expect([1, 2, 3].map((i) => getValue(r, `root${i}`))).toEqual(['1', '2', '3']);
    expect(getValue(r, 'nature')).toBe('3 real roots');
  });
  it('multiple roots are exact: (x-1)^3 -> 1 (triple); (x-1)^2(x+1) -> -1, 1 (double); 0.1x^3-0.3x^2+0.3x-0.1 -> 1 (triple)', () => {
    expect(getValue(E('cubic', '1', '-3', '3', '-1'), 'root1')).toBe('1 (triple root)');
    expect(getValue(E('cubic', '1', '-1', '-1', '1'), 'root1')).toBe('-1');
    expect(getValue(E('cubic', '1', '-1', '-1', '1'), 'root2')).toBe('1 (double root)');
    expect(getValue(E('cubic', '0.1', '-0.3', '0.3', '-0.1'), 'root1')).toBe('1 (triple root)');
    expect(getValue(E('quartic', '1', '-4', '6', '-4', '1'), 'root1')).toBe('1 (multiplicity 4)');
  });
  it('one real + a complex pair: x^3 - 2 -> 1.25992105, -0.62996052 ± 1.09112364i', () => {
    const r = E('cubic', '1', '0', '0', '-2');
    expect(getValue(r, 'root1')).toBe('1.25992105');
    expect(getValue(r, 'root2')).toBe('-0.62996052 + 1.09112364i');
    expect(getValue(r, 'root3')).toBe('-0.62996052 - 1.09112364i');
    expect(getValue(r, 'nature')).toContain('1 real root');
  });
  it('zero root and x^3 + x', () => {
    const r = E('cubic', '1', '0', '1', '0');
    expect(getValue(r, 'root1')).toBe('0');
    expect(getValue(r, 'root2')).toBe('i');
    expect(getValue(r, 'root3')).toBe('-i');
  });
  it('non-monic: 2x^3 + 3x^2 - 8x + 3 -> -3, 0.5, 1', () => {
    const r = E('cubic', '2', '3', '-8', '3');
    expect([1, 2, 3].map((i) => getValue(r, `root${i}`))).toEqual(['-3', '0.5', '1']);
  });
  it('quartic: x^4 - 5x^2 + 4 -> -2,-1,1,2; x^4 + 4 -> ±1 ± i; x^4 - 1 -> ±1, ±i', () => {
    const r = E('quartic', '1', '0', '-5', '0', '4');
    expect([1, 2, 3, 4].map((i) => getValue(r, `root${i}`))).toEqual(['-2', '-1', '1', '2']);
    const c = E('quartic', '1', '0', '0', '0', '4');
    expect(getValue(c, 'root1')).toBe('-1 + i');
    expect(getValue(c, 'root3')).toBe('1 + i');
    const u = E('quartic', '1', '0', '0', '0', '-1');
    expect([getValue(u, 'root1'), getValue(u, 'root2'), getValue(u, 'root3'), getValue(u, 'root4')]).toEqual(['-1', '1', 'i', '-i']);
  });
  it('quartic with a double zero root: x^4 - 2x^3 + x^2 = x^2 (x-1)^2 -> 0 (double), 1 (double)', () => {
    expect(rootsOf('1', '-2', '1', '0', '0')).toEqual([[0, 0, 2], [1, 0, 2]]);
  });
  it('fifth roots of unity quartic x^4+x^3+x^2+x+1 matches sympy', () => {
    expect(rootsOf('1', '1', '1', '1', '1')).toEqual([[-0.809016994, 0.587785252, 1], [0.309016994, 0.951056516, 1]]);
  });
  it('leading zero and bad input', () => {
    expect(getValue(E('cubic', '0', '1', '2', '3'), 'nature')).toContain('not a cubic');
    expect(E('cubic', '1', '2', '3')).toEqual([]);
    expect(E('cubic', '1', '2', '3', 'x')).toEqual([]);
    expect(E('quintic', '1', '2')).toEqual([]);
  });
});
