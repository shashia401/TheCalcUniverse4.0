import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/unit-circle/index';
import { getValue } from '../../helpers';

// Expected values derived independently (Python: math.sin/cos/tan, fractions.Fraction for exact mod 360 and π-fractions).
const run = (angle: string) => config.calculate({ angle });

describe('unit-circle audit', () => {
  it('decimal degrees reduce exactly: 720.3° is 0.3° (floats gave 0.2999999999999545°)', () => {
    expect(getValue(run('720.3'), 'normalizedAngle')).toBe('0.3°');
    expect(getValue(run('-0.1'), 'normalizedAngle')).toBe('359.9°');
    expect(getValue(run('1e3'), 'normalizedAngle')).toBe('280°');
  });

  it('a tiny negative angle stays inside [0, 360): -1e-20° does not print as 360°', () => {
    expect(getValue(run('-1e-20'), 'normalizedAngle')).toBe('0°');
  });

  it('radians are exact π-fractions only for whole-degree angles; 30.1° is NOT π/6', () => {
    expect(getValue(run('30.1'), 'radians')).toBe('0.5253 rad'); // old matcher (±0.001π) said "π/6"
    expect(getValue(run('33.5'), 'radians')).toBe('0.5847 rad');
    expect(getValue(run('10'), 'radians')).toBe('π/18'); // 10/180
    expect(getValue(run('100'), 'radians')).toBe('5π/9'); // 100/180
    expect(getValue(run('20'), 'radians')).toBe('π/9');
    expect(getValue(run('225'), 'radians')).toBe('5π/4');
  });

  it('undefined only at exact multiples of 90°, never near them', () => {
    const near90 = run('89.999999');
    const [, , tan] = getValue(near90, 'trig').split('  |  ');
    expect(tan).not.toBe('Undefined');
    expect(Math.abs(parseFloat(tan) - 57295779.81445014) < 1e-3).toBe(true); // tan(89.999999°)
    const nearZero = run('0.000001');
    const [csc] = getValue(nearZero, 'reciprocal').split('  |  ');
    expect(csc).not.toBe('Undefined'); // sin(1e-6°) ≠ 0
    expect(Math.abs(parseFloat(csc) - 57295779.51308232) < 1e-3).toBe(true); // 1/sin(1e-6°)
  });

  it('30°: all six functions (csc/sec/cot come from unrounded sin/cos)', () => {
    const r = run('30');
    expect(getValue(r, 'coordinates')).toBe('(0.8660254, 0.5)');
    expect(getValue(r, 'trig')).toBe('0.5  |  0.8660254  |  0.57735027');
    expect(getValue(r, 'reciprocal')).toBe('2  |  1.15470054  |  1.73205081');
    expect(getValue(r, 'exact')).toBe('sin = 1/2, cos = √3/2, tan = √3/3');
  });

  it('225° (worked example): (-0.70710678, -0.70710678), tan = 1, reference 45°, Quadrant III', () => {
    const r = run('225');
    expect(getValue(r, 'coordinates')).toBe('(-0.70710678, -0.70710678)');
    expect(getValue(r, 'trig').split('  |  ')[2]).toBe('1');
    expect(getValue(r, 'referenceAngle')).toBe('45°');
    expect(getValue(r, 'quadrant')).toBe('III');
    expect(getValue(r, 'exact')).toBe('sin = -√2/2, cos = -√2/2, tan = 1');
  });

  it('exact radical row exists only for multiples of 15°, and says "not defined" for tan at 90°', () => {
    expect(getValue(run('90'), 'exact')).toBe('sin = 1, cos = 0, tan = not defined');
    expect(run('31').some((x) => x.id === 'exact')).toBe(false);
  });

  it('150°: (-0.8660254, 0.5), reference angle 30°, Quadrant II', () => {
    const r = run('150');
    expect(getValue(r, 'coordinates')).toBe('(-0.8660254, 0.5)');
    expect(getValue(r, 'referenceAngle')).toBe('30°');
    expect(getValue(r, 'quadrant')).toBe('II');
  });

  it('axis angles: reciprocal and tan undefined exactly where the divisor is zero', () => {
    expect(getValue(run('0'), 'reciprocal')).toBe('Undefined  |  1  |  Undefined');
    expect(getValue(run('90'), 'reciprocal')).toBe('1  |  Undefined  |  0');
    expect(getValue(run('180'), 'reciprocal')).toBe('Undefined  |  -1  |  Undefined');
    expect(getValue(run('270'), 'reciprocal')).toBe('-1  |  Undefined  |  0');
  });

  it('rejects malformed input (strict parse) and never renders NaN/Infinity', () => {
    expect(run('30abc')).toEqual([]);
    expect(run('')).toEqual([]);
    for (const a of ['0', '30', '90', '1e30', '-720.5']) {
      for (const x of run(a)) expect(x.value).not.toMatch(/NaN|Infinity/);
    }
  });
});
