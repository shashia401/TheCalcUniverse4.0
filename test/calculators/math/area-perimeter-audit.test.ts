import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/area-perimeter/index';
import { getValue } from '../../helpers';

// Reference: Python math (3-4-5 triangle: area 6 by Heron and by half base times height).
const run = (v: Record<string, string>) => config.calculate(v);

describe('area-perimeter: triangle perimeter is the sum of the three sides (audit)', () => {
  it('3-4-5 right triangle: base 4, height 3, sides 3 and 5 -> area 6, perimeter 12 (old code added the height: 4 + 3 + s)', () => {
    const r = run({ shape: 'triangle', triBase: '4', triHeight: '3', triSide: '3', triSide3: '5' });
    expect(getValue(r, 'area')).toBe('6');
    expect(getValue(r, 'perimeter')).toBe('12');
    expect(r.find((x) => x.id === 'perimeter')!.warning).toBeUndefined();
  });
  it('no perimeter until both other sides are given', () => {
    expect(run({ shape: 'triangle', triBase: '4', triHeight: '3', triSide: '5' }).map((x) => x.id)).toEqual(['area']);
    expect(run({ shape: 'triangle', triBase: '4', triHeight: '3' }).map((x) => x.id)).toEqual(['area']);
  });
  it('rejects sides that violate the triangle inequality', () => {
    const r = run({ shape: 'triangle', triBase: '10', triHeight: '2', triSide: '3', triSide3: '4' });
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe('error');
  });
  it('warns when sides and height describe different triangles (Heron area != half base x height)', () => {
    const r = run({ shape: 'triangle', triBase: '4', triHeight: '2', triSide: '3', triSide3: '5' });
    expect(getValue(r, 'area')).toBe('4'); // area still follows the entered height
    expect(r.find((x) => x.id === 'perimeter')!.warning).toMatch(/Heron/);
  });
});

describe('area-perimeter: other shapes (audit)', () => {
  it('rectangle + semicircle: r = 2.5 on a width of 5 -> 50 + pi*6.25/2, perimeter 25 + 2.5 pi', () => {
    const r = run({ shape: 'rectangle', rectLength: '10', rectWidth: '5', compound: 'rectSemi', compRadius: '2.5' });
    expect(getValue(r, 'area')).toBe('59.817477');
    expect(getValue(r, 'perimeter')).toBe('32.853982');
  });
  it('a semicircle wider than the longest side is refused instead of giving a geometrically impossible outline', () => {
    const r = run({ shape: 'rectangle', rectLength: '10', rectWidth: '5', compound: 'rectSemi', compRadius: '6' });
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe('error');
  });
  it('parallelogram: the sloping side cannot be shorter than the height', () => {
    expect(run({ shape: 'parallelogram', paraBase: '10', paraSide: '3', paraHeight: '4' })[0].id).toBe('error');
    expect(getValue(run({ shape: 'parallelogram', paraBase: '10', paraSide: '5', paraHeight: '4' }), 'perimeter')).toBe('30');
  });
  it('hexagon of side 5: area 64.951905, apothem 4.330127', () => {
    const r = run({ shape: 'hexagon', hexSide: '5' });
    expect(getValue(r, 'area')).toBe('64.951905');
    expect(getValue(r, 'apothem')).toBe('4.330127');
    expect(getValue(r, 'perimeter')).toBe('30');
  });
  it('zero / negative dimensions give no result (rectangle used to accept 0 and return area 0)', () => {
    expect(run({ shape: 'rectangle', rectLength: '0', rectWidth: '5' })).toEqual([]);
    expect(run({ shape: 'trapezoid', trapBase1: '0', trapBase2: '5', trapHeight: '2' })).toEqual([]);
    expect(run({ shape: 'circle', circleRadius: '-1' })).toEqual([]);
  });
  it('tiny shapes keep significant digits; rectangle diagonal avoids overflow', () => {
    expect(getValue(run({ shape: 'square', squareSide: '0.000001' }), 'area')).toBe('1e-12');
    const huge = run({ shape: 'rectangle', rectLength: '1e200', rectWidth: '1e200' });
    expect(getValue(huge, 'diagonal')).toBe('1.414213562373095e+200'); // Math.hypot: sqrt(l*l + w*w) would overflow to Infinity
    expect(getValue(huge, 'area')).toBe('too large to display'); // 1e400 overflows a double
    expect(JSON.stringify(huge)).not.toMatch(/Infinity|NaN/);
  });
  it('strict number parsing', () => {
    expect(run({ shape: 'square', squareSide: '4abc' })).toEqual([]);
  });
});
