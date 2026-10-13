import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/distance/index';
import { getValue } from '../../helpers';

// Reference: Python math.dist / math.hypot.
const d2 = (x1: string, y1: string, x2: string, y2: string) => config.calculate({ mode: '2d', x1, y1, x2, y2 });
const d3 = (a: string[], b: string[]) => config.calculate({ mode: '3d', x1: a[0], y1: a[1], z1: a[2], x2: b[0], y2: b[1], z2: b[2] });

describe('distance (audit)', () => {
  it('classic cases', () => {
    expect(getValue(d2('0', '0', '3', '4'), 'distance')).toBe('5');
    expect(getValue(d2('2', '3', '8', '11'), 'distance')).toBe('10');
    expect(getValue(d2('0.1', '0.2', '0.4', '0.6'), 'distance')).toBe('0.5'); // dx = 0.30000000000000004 in floating point
    expect(getValue(d3(['10', '5', '-3'], ['25', '-2', '7']), 'distance')).toBe('19.33908');
    expect(getValue(config.calculate({ mode: '1d', x1_1d: '38.7', x2_1d: '42.3' }), 'distance')).toBe('3.6');
  });
  it('uses hypot, so coordinates near 1e200 do not overflow to Infinity', () => {
    // Math.sqrt(dx*dx + dy*dy) squares to 2.5e401 = Infinity; Python math.hypot(3e200, 4e200) = 4.9999999999999995e+200
    const r = d2('0', '0', '3e200', '4e200');
    expect(getValue(r, 'distance')).toBe('4.9999999999999995e+200');
    expect(JSON.stringify(r)).not.toMatch(/Infinity|NaN/);
  });
  it('values whose span overflows give no output, tiny distances keep their digits', () => {
    expect(d2('-1e308', '0', '1e308', '0')).toEqual([]);
    expect(getValue(d2('0', '0', '1e-9', '0'), 'distance')).toBe('1e-9');
  });
  it('slope: identical points are not called a vertical line', () => {
    expect(getValue(d2('1', '1', '1', '1'), 'slope')).toBe('Undefined (the two points are identical)');
    expect(getValue(d2('1', '1', '1', '5'), 'slope')).toBe('Undefined (vertical line)');
    expect(getValue(d2('0', '0', '2', '1'), 'slope')).toBe('0.5');
    expect(getValue(d2('0', '0', '-2', '1'), 'slope')).toBe('-0.5');
  });
  it('midpoint is exact for odd sums, and 3D midpoint has three components', () => {
    expect(getValue(d2('1', '1', '2', '2'), 'midpoint')).toBe('(1.5, 1.5)');
    expect(getValue(d3(['0', '0', '0'], ['1', '2', '3']), 'midpoint')).toBe('(0.5, 1, 1.5)');
  });
  it('strict parsing and decimal keypad', () => {
    expect(d2('1', '2abc', '3', '4')).toEqual([]);
    expect(d2('', '2', '3', '4')).toEqual([]);
    expect(config.inputs.filter((i) => i.inputMode === 'numeric')).toEqual([]); // coordinates need a decimal point and sign
  });
});
