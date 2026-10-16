import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/slope/index';
import { getValue } from '../../helpers';

// Expected values derived independently with exact Fraction arithmetic in Python
// (m = dy/dx, b = y1 - m·x1, Ax+By=C with A=-dy, B=dx, C=A·x1+B·y1 scaled to coprime integers, A>0).
const run = (x1: string, y1: string, x2: string, y2: string, extra: Record<string, string> = {}) =>
  config.calculate({ x1, y1, x2, y2, outputFormat: 'standard', angleDisplay: 'degrees', ...extra });

describe('slope audit', () => {
  it('(2,3)->(5,7): m = 4/3, b = 1/3, 4x − 3y = −1, 53.13°, distance 5, midpoint (3.5, 5)', () => {
    const r = run('2', '3', '5', '7');
    expect(getValue(r, 'slope')).toBe('1.3333');
    expect(getValue(r, 'slopeFraction')).toBe('4/3');
    expect(getValue(r, 'slopeIntercept')).toBe('y = 1.3333x + 0.3333');
    expect(getValue(r, 'standardForm')).toBe('4x − 3y = −1');
    expect(getValue(r, 'yIntercept')).toBe('(0, 0.3333)');
    expect(getValue(r, 'angle')).toBe('53.13°');
    expect(getValue(r, 'distance')).toBe('5');
    expect(getValue(r, 'midpoint')).toBe('(3.5, 5)');
  });

  it('horizontal lines read y = b (previously "y =  + 3" and " + y = 3")', () => {
    const r = run('0', '3', '4', '3');
    expect(getValue(r, 'slope')).toBe('0');
    expect(getValue(r, 'slopeFraction')).toBe('0/1');
    expect(getValue(r, 'slopeIntercept')).toBe('y = 3');
    expect(getValue(r, 'pointSlope')).toBe('y − 3 = 0');
    expect(getValue(r, 'standardForm')).toBe('y = 3');
    expect(getValue(r, 'angle')).toBe('0.00°');
    const neg = run('1', '-2', '3', '-2');
    expect(getValue(neg, 'slopeIntercept')).toBe('y = -2');
    expect(getValue(neg, 'standardForm')).toBe('y = −2');
  });

  it('vertical lines: undefined slope, x = a, 90° (and π/2 = 1.5708 rad in radians mode)', () => {
    const r = run('1', '1', '1', '5');
    expect(getValue(r, 'slope')).toBe('Undefined (vertical)');
    expect(getValue(r, 'standardForm')).toBe('x = 1');
    expect(getValue(r, 'yIntercept')).toBe('none');
    expect(getValue(r, 'angle')).toBe('90.00°');
    const rad = run('0', '0', '0', '5', { angleDisplay: 'radians' });
    expect(getValue(rad, 'angle')).toBe('1.5708 rad'); // was "90°" even in radians mode
    expect(getValue(rad, 'yIntercept')).toBe('every point (the line is the y-axis)');
  });

  it('identical points define no line: error result, not a bogus "vertical line"', () => {
    const r = run('2', '2', '2', '2');
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe('error');
  });

  it('decimal inputs are exact: (0.1,0.2)->(0.4,0.5) has slope exactly 1 (not 0.9999999999999998)', () => {
    const r = run('0.1', '0.2', '0.4', '0.5');
    expect(getValue(r, 'slope')).toBe('1');
    expect(getValue(r, 'slopeFraction')).toBe('1/1');
    expect(getValue(r, 'slopeIntercept')).toBe('y = x + 0.1');
    expect(getValue(r, 'standardForm')).toBe('10x − 10y = −1');
  });

  it('standard form has A > 0 and coprime integers: (0,0)->(4,-2) is x + 2y = 0, negative slope reads -0.5x', () => {
    const r = run('0', '0', '4', '-2');
    expect(getValue(r, 'slopeFraction')).toBe('-1/2');
    expect(getValue(r, 'slopeIntercept')).toBe('y = -0.5x');
    expect(getValue(r, 'standardForm')).toBe('x + 2y = 0');
    expect(getValue(r, 'angle')).toBe('-26.57°');
  });

  it('tiny slopes keep significant digits instead of printing "0"', () => {
    const r = run('0', '0', '12345678', '7');
    expect(getValue(r, 'slope')).toBe('5.67e-7'); // 7/12345678 = 5.670000465e-7
    expect(getValue(r, 'slopeFraction')).toBe('7/12345678');
    expect(getValue(r, 'standardForm')).toBe('7x − 12345678y = 0');
  });

  it('beyond 2^53 the arithmetic stays exact: x 123456789012345678 -> …679 is NOT a vertical line', () => {
    const r = run('123456789012345678', '0', '123456789012345679', '1');
    expect(getValue(r, 'slope')).toBe('1');
    expect(getValue(r, 'standardForm')).toBe('x − y = 123456789012345678');
    expect(getValue(r, 'yIntercept')).toBe('(0, -123456789012345678)');
  });

  it('worked examples from the educational text', () => {
    const ramp = run('0', '0', '240', '24');
    expect(getValue(ramp, 'slope')).toBe('0.1');
    expect(getValue(ramp, 'slopeFraction')).toBe('1/10');
    expect(getValue(ramp, 'distance')).toBe('241.197');
    expect(getValue(ramp, 'angle')).toBe('5.71°');
    expect(getValue(ramp, 'slopeIntercept')).toBe('y = 0.1x');
    const roof = run('0', '0', '20', '8');
    expect(getValue(roof, 'slopeFraction')).toBe('2/5');
    expect(getValue(roof, 'distance')).toBe('21.5407');
    expect(getValue(roof, 'angle')).toBe('21.80°');
    const sales = run('1', '50000', '6', '65000');
    expect(getValue(sales, 'slope')).toBe('3000');
    expect(getValue(sales, 'slopeFraction')).toBe('3000/1');
    expect(getValue(sales, 'distance')).toBe('15000.0008');
    expect(getValue(sales, 'angle')).toBe('89.98°');
    expect(getValue(sales, 'yIntercept')).toBe('(0, 47000)');
    expect(getValue(sales, 'slopeIntercept')).toBe('y = 3000x + 47000');
    expect(getValue(sales, 'standardForm')).toBe('3000x − y = −47000');
    // projected December sales quoted in the text: 3000·12 + 47000
    expect(3000 * 12 + 47000).toBe(83000);
  });

  it('compact mode shows only slope, fraction, direction and distance', () => {
    const r = run('2', '3', '5', '7', { outputFormat: 'compact' });
    expect(r.map((x) => x.id)).toEqual(['slope', 'slopeFraction', 'direction', 'distance']);
  });

  it('rejects malformed input (strict parse) and blanks', () => {
    expect(run('5abc', '1', '2', '3')).toEqual([]);
    expect(run('', '1', '2', '3')).toEqual([]);
    expect(run('1', '1', '2', '')).toEqual([]);
  });

  it('every result has a unique id and no NaN/Infinity (the word "undefined" is intentional for vertical slopes)', () => {
    for (const c of [run('2', '3', '5', '7'), run('0', '0', '0', '5'), run('-1', '-1', '-1', '-1')]) {
      const ids = c.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const x of c) expect(x.value).not.toMatch(/NaN|Infinity/);
    }
  });
});
