import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/inverse-trig/index';
import { getValue } from '../../helpers';

// Oracle: sympy 1.14 asin/acos/atan evaluated to 14 digits.
const T = (func: string, value: string) => config.calculate({ function: func, value });

describe('inverse trig (audit)', () => {
  it('standard angles are exact: asin(0.5)=30, acos(0.5)=60, acos(-0.5)=120, atan(1)=45', () => {
    expect(getValue(T('arcsin', '0.5'), 'degrees')).toBe('30°');
    expect(getValue(T('arcsin', '0.5'), 'exactValue')).toBe('π/6 rad = 30°');
    expect(getValue(T('arccos', '0.5'), 'degrees')).toBe('60°');
    expect(getValue(T('arccos', '-0.5'), 'degrees')).toBe('120°');
    expect(getValue(T('arccos', '-0.5'), 'exactValue')).toBe('2π/3 rad = 120°');
    expect(getValue(T('arctan', '1'), 'degrees')).toBe('45°');
    expect(getValue(T('arctan', '-1'), 'exactValue')).toBe('-π/4 rad = -45°');
  });
  it('principal-value ranges: asin in [-90,90], acos in [0,180], atan in (-90,90)', () => {
    expect(getValue(T('arcsin', '-1'), 'degrees')).toBe('-90°');
    expect(getValue(T('arccos', '-1'), 'degrees')).toBe('180°');
    expect(getValue(T('arccos', '1'), 'degrees')).toBe('0°');
    expect(getValue(T('arctan', '-5'), 'degrees')).toBe('-78.69006753°');
    expect(getValue(T('arctan', '-5'), 'radians')).toBe('-1.37340077');
  });
  it('non-standard values to 8 decimals', () => {
    expect(getValue(T('arcsin', '0.3'), 'degrees')).toBe('17.45760312°');
    expect(getValue(T('arccos', '-0.3'), 'degrees')).toBe('107.45760312°');
    expect(getValue(T('arcsin', '0.3'), 'radians')).toBe('0.30469265');
  });
  it('very small and very large inputs are not rounded to 0 / 90', () => {
    expect(getValue(T('arcsin', '1e-9'), 'degrees')).toBe('5.72958e-8°'); // sympy: 5.72957795131e-8
    expect(getValue(T('arctan', '1000000'), 'degrees')).toBe('89.9999427°'); // sympy 89.999942704221 (8 dp: 89.9999427)
  });
  it('domain errors: asin(2), acos(-1.0001) are rejected with a message, tan has no domain limit', () => {
    expect(getValue(T('arcsin', '2'), 'domainError')).toContain('outside this domain');
    expect(getValue(T('arccos', '-1.0001'), 'domainError')).toContain('[-1, 1]');
    expect(getValue(T('arctan', '1e300'), 'degrees')).toBe('90°');
  });
  it('general solutions list every angle with the same value', () => {
    expect(getValue(T('arcsin', '0.5'), 'allSolutions')).toBe('θ = 30° + 360°·k  or  θ = 150° + 360°·k');
    expect(getValue(T('arccos', '0.5'), 'allSolutions')).toBe('θ = ±60° + 360°·k');
    expect(getValue(T('arctan', '1'), 'allSolutions')).toBe('θ = 45° + 180°·k');
    expect(getValue(T('arcsin', '1'), 'allSolutions')).toBe('θ = 90° + 360°·k');
  });
  it('rejects text with trailing junk instead of truncating it (parseFloat("0.5abc") was 0.5)', () => {
    expect(T('arcsin', '0.5abc')).toEqual([]);
    expect(T('arcsin', '')).toEqual([]);
  });
});
