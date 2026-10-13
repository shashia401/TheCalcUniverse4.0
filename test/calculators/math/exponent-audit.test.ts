import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/exponent/index';
import { analyzePower, asRatio, ordinal, parseNumberStrict } from '../../../src/calculators/math/exponent/exponentMath';
import { getValue } from '../../helpers';

// Reference values: Python (3.12) big ints / floats / cmath.exp(e * cmath.log(b)) for the principal complex value.
const run = (base: string, exponent: string) => config.calculate({ base, exponent });

describe('exponent: correctness fixes (audit)', () => {
  it('0 raised to a negative power is a division by zero, not an "overflow"', () => {
    const r = run('0', '-1'); // Math.pow(0, -1) = Infinity, which the old code reported as "Overflow: more than 1.8e308"
    expect(getValue(r, 'result')).toBe('Undefined (division by zero)');
    expect(JSON.stringify(r)).not.toMatch(/Overflow|Infinity|NaN/);
  });
  it('negative base with a negative odd-denominator exponent keeps its sign: (-8)^(-1/3) = -0.5', () => {
    // The old code treated the negative numerator as "even" and returned +0.5.
    expect(parseFloat(getValue(run('-8', '-0.3333333333333333'), 'result'))).toBeCloseTo(-0.5, 12);
    expect(parseFloat(getValue(run('-8', '0.3333333333333333'), 'result'))).toBeCloseTo(-2, 12);
    expect(parseFloat(getValue(run('-8', '0.6666666666666666'), 'result'))).toBeCloseTo(4, 12); // (-8)^(2/3) = (-2)^2
    expect(parseFloat(getValue(run('-32', '0.2'), 'result'))).toBeCloseTo(-2, 12);
  });
  it('complex principal value uses the full angle pi*e: (-4)^1.5 = -8i (the old code gave +8i)', () => {
    expect(getValue(run('-4', '1.5'), 'result')).toBe('Complex: 0 − 8i');
    expect(getValue(run('-4', '1.5'), 'reciprocal')).toBe('Complex: 0 + 0.125i'); // 1/(-8i) = i/8
    expect(getValue(run('-2', '0.5'), 'result')).toBe('Complex: 0 + 1.41421356237i');
    expect(getValue(run('-2', '2.5'), 'result')).toBe('Complex: 0 + 5.65685424949i'); // cmath
  });
  it('the root row is the exp-th root of the base, with the right name, sign and ordinal', () => {
    expect(getValue(run('27', '3'), 'inverse')).toBe('cube root of 27 = 3');
    expect(getValue(run('-8', '3'), 'inverse')).toBe('cube root of -8 = -2'); // old: "3th root of -8 = 2"
    expect(getValue(run('16', '4'), 'inverse')).toBe('4th root of 16 = 2');
    expect(getValue(run('9', '2'), 'inverse')).toBe('square root of 9 = 3');
    expect(getValue(run('-4', '2'), 'inverse')).toBe('square root of -4 has no real value (complex)');
    expect(getValue(run('4', '-2'), 'inverse')).toBe('4^(1/-2) = 0.5'); // old ignored the sign of the exponent
    expect(run('5', '0').find((x) => x.id === 'inverse')).toBeUndefined(); // 0th root is meaningless
    expect(getValue(run('2', '0.0001'), 'inverse')).toBe('2^(1/0.0001) is too large to represent'); // 2^10000 overflows a double
    expect(getValue(run('0', '-2'), 'result')).toContain('division by zero');
  });
  it('shows the exact integer once a double cannot hold it', () => {
    expect(getValue(run('2', '100'), 'exactValue')).toBe('1267650600228229401496703205376');
    expect(getValue(run('3', '100'), 'exactValue')).toBe('515377520732011331036461129765621272702107522001');
    expect(getValue(run('-3', '99'), 'exactValue')).toBe('-171792506910670443678820376588540424234035840667'); // Python (-3)**99
    expect(run('2', '52').find((x) => x.id === 'exactValue')).toBeUndefined(); // 2^52 is exact as a double
    expect(run('2.5', '100').find((x) => x.id === 'exactValue')).toBeUndefined();
  });
  it('negative bases are parenthesised in the working', () => {
    expect(getValue(run('-2', '3'), 'expandedForm')).toBe('(-2) × (-2) × (-2) = -8');
    expect(getValue(run('-2', '-3'), 'result')).toBe('-0.125');
  });
  it('overflow and underflow are explained, never Infinity/0', () => {
    expect(getValue(run('-10', '1001'), 'result')).toContain('less than -1.8');
    expect(getValue(run('10', '-400'), 'result')).toContain('Underflow');
    expect(JSON.stringify(run('10', '-400'))).not.toMatch(/Infinity|NaN/);
    expect(run('10', '-400').find((x) => x.id === 'reciprocal')!.value).toBe('Undefined'); // 1/0 would otherwise print Infinity
  });
  it('compound interest example from the page: 1.07^10 = 1.96715135729, 1.10^10 = 2.5937424601', () => {
    expect(getValue(run('1.07', '10'), 'result')).toBe('1.96715135729');
    expect(getValue(run('1.1', '10'), 'result')).toBe('2.5937424601');
    expect(getValue(run('0.5', '3'), 'result')).toBe('0.125');
  });
  it('input parsing is strict (parseFloat would accept "2abc" as 2)', () => {
    expect(run('2abc', '3')).toEqual([]);
    expect(run('2', '3x')).toEqual([]);
    expect(run('1e3', '2')[0].value).toBe('1000000');
    expect(getValue(run(' 2 ', ' 3 '), 'result')).toBe('8');
  });
});

describe('exponentMath helpers', () => {
  it('asRatio finds small-denominator fractions to 12 digits and rejects near misses', () => {
    expect(asRatio(0.3333333333333333)).toEqual({ p: 1, q: 3 });
    expect(asRatio(-0.4)).toEqual({ p: -2, q: 5 });
    expect(asRatio(2.5)).toEqual({ p: 5, q: 2 });
    expect(asRatio(0.3333)).toBeNull();
    expect(asRatio(7)).toEqual({ p: 7, q: 1 });
  });
  it('ordinal', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 100, 101, 111].map(ordinal)).toEqual([
      '1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '23rd', '100th', '101st', '111th',
    ]);
  });
  it('analyzePower kinds', () => {
    expect(analyzePower(0, 0).kind).toBe('indeterminate');
    expect(analyzePower(0, -2).kind).toBe('divByZero');
    expect(analyzePower(0, 2)).toMatchObject({ kind: 'real', value: 0, underflow: false });
    expect(analyzePower(-4, 0.5).kind).toBe('complex');
    expect(analyzePower(10, 400).kind).toBe('overflow');
    expect(analyzePower(-1, 1e300)).toMatchObject({ kind: 'real', value: 1 });
  });
  it('parseNumberStrict', () => {
    expect(parseNumberStrict('-1.5e2')).toBe(-150);
    expect(parseNumberStrict('.5')).toBe(0.5);
    for (const bad of ['', 'abc', '1.2.3', '1e999', 'Infinity', undefined]) expect(parseNumberStrict(bad as string)).toBeNaN();
  });
});
