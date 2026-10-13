import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/circle/index';
import { getValue } from '../../helpers';

// Reference: Python math.pi (identical IEEE double), values rounded to 8 decimals like the page.
const run = (inputType: string, value: string) => config.calculate({ inputType, value });

describe('circle (audit)', () => {
  it('worked examples from the page agree with an independent computation', () => {
    const d = run('diameter', '6'); // r = 3, C = 6π, A = 9π
    expect(getValue(d, 'radius')).toBe('3');
    expect(getValue(d, 'circumference')).toBe('18.84955592');
    expect(getValue(d, 'area')).toBe('28.27433388');
    const a = run('area', '500');
    expect(getValue(a, 'radius')).toBe('12.61566261');
    expect(getValue(a, 'diameter')).toBe('25.23132522');
    expect(getValue(a, 'circumference')).toBe('79.26654595');
    const c = run('circumference', '400');
    expect(getValue(c, 'radius')).toBe('63.66197724');
    expect(getValue(c, 'area')).toBe('12732.39544735');
  });
  it('tiny circles are not collapsed to 0 (a 0.00001 radius has area 3.14159e-10)', () => {
    const r = run('radius', '0.00001');
    expect(getValue(r, 'area')).toBe('3.14159e-10');
    expect(getValue(r, 'circumference')).toBe('0.00006283');
  });
  it('overflowing results give no output instead of "Infinity"', () => {
    expect(run('radius', '1e200')).toEqual([]); // area 3e400 overflows
    expect(JSON.stringify(run('radius', '1e100'))).not.toMatch(/Infinity|NaN/);
  });
  it('strict parsing and zero/negative values', () => {
    expect(run('radius', '5abc')).toEqual([]);
    expect(run('radius', '0')).toEqual([]);
    expect(run('radius', '-2')).toEqual([]);
    expect(getValue(run('radius', '5'), 'area')).toBe('78.53981634');
  });
});
