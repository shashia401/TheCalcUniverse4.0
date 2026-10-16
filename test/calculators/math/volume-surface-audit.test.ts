import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/volume-surface/index';
import { netDescription } from '../../../src/calculators/math/volume-surface/ShapeNets';
import { getValue } from '../../helpers';

// Expected values derived independently in Python (math.pi, math.sqrt), rounded to 6 d.p. like the calculator.
const run = (shape: string, dim1: string, dim2 = '', dim3 = '') => config.calculate({ shape, dim1, dim2, dim3 });

describe('volume-surface audit', () => {
  it('sphere r=5: V 523.598776, SA 314.159265, d 10 (matches the text "523.6" and "314.16")', () => {
    const r = run('sphere', '5');
    expect(getValue(r, 'volume')).toBe('523.598776');
    expect(getValue(r, 'surface')).toBe('314.159265');
    expect(getValue(r, 'diameter')).toBe('10');
  });

  it('cube s=5: V 125, SA 150, diagonal 8.660254 (text: 5 × 1.732 = 8.66)', () => {
    const r = run('cube', '5');
    expect(getValue(r, 'volume')).toBe('125');
    expect(getValue(r, 'surface')).toBe('150');
    expect(getValue(r, 'diagonal')).toBe('8.660254');
  });

  it('box 2×3×4: V 24, SA 2(6+8+12) = 52, diagonal √29 = 5.385165', () => {
    const r = run('box', '2', '3', '4');
    expect(getValue(r, 'volume')).toBe('24');
    expect(getValue(r, 'surface')).toBe('52');
    expect(getValue(r, 'diagonal')).toBe('5.385165');
  });

  it('cylinder r=3, h=5: V 141.371669 (text: 141.37), SA 2πr(r+h) = 150.796447, lateral 2πrh = 94.24778', () => {
    const r = run('cylinder', '3', '5');
    expect(getValue(r, 'volume')).toBe('141.371669');
    expect(getValue(r, 'surface')).toBe('150.796447');
    expect(getValue(r, 'lateral')).toBe('94.24778');
  });

  it('cone r=3, h=4: slant 5 (3-4-5), V 12π = 37.699112, SA πr(r+s) = 24π = 75.398224', () => {
    const r = run('cone', '3', '4');
    expect(getValue(r, 'slant')).toBe('5');
    expect(getValue(r, 'volume')).toBe('37.699112');
    expect(getValue(r, 'surface')).toBe('75.398224');
  });

  it('pyramid b=6, h=4: slant √(3²+4²) = 5, V = 36·4/3 = 48, SA = 36 + 2·6·5 = 96', () => {
    const r = run('pyramid', '6', '4');
    expect(getValue(r, 'slant')).toBe('5');
    expect(getValue(r, 'volume')).toBe('48');
    expect(getValue(r, 'surface')).toBe('96');
  });

  it('Great Pyramid example in the text: b=230, h=146 -> V = 2,574,466.67 m³ (≈ 2.6 million)', () => {
    const r = run('pyramid', '230', '146');
    expect(getValue(r, 'volume')).toBe('2574466.666667');
    expect(getValue(r, 'slant')).toBe('185.852092');
  });

  it('scaling claims: doubling r multiplies sphere V by 8 and SA by 4', () => {
    const a = run('sphere', '3');
    const b = run('sphere', '6');
    expect(parseFloat(getValue(b, 'volume')) / parseFloat(getValue(a, 'volume'))).toBeCloseTo(8, 5);
    expect(parseFloat(getValue(b, 'surface')) / parseFloat(getValue(a, 'surface'))).toBeCloseTo(4, 5);
  });

  it('rejects zero, negative, missing, malformed ("5abc") and unknown shapes', () => {
    expect(run('sphere', '0')).toEqual([]);
    expect(run('cube', '-2')).toEqual([]);
    expect(run('cylinder', '3')).toEqual([]); // height missing
    expect(run('box', '2', '3')).toEqual([]); // third dimension missing
    expect(run('sphere', '5abc')).toEqual([]); // parseFloat used to read this as 5
    expect(run('torus', '5', '2')).toEqual([]);
  });

  it('overflow returns no results instead of the text "Infinity"', () => {
    expect(run('sphere', '1e200')).toEqual([]);
    expect(run('cube', '1e200')).toEqual([]);
    for (const x of run('sphere', '1e100')) expect(x.value).not.toMatch(/NaN|Infinity/);
  });

  it('net descriptions are plain text: no raw HTML entities like &pi; or &mdash;', () => {
    for (const shape of ['cube', 'cylinder', 'cone', 'sphere', 'box', 'pyramid']) {
      expect(netDescription(shape, { r: 3, h: 4, s: 2 })).not.toMatch(/&[a-z]+;/);
    }
    expect(netDescription('cylinder', { r: 3, h: 4 })).toContain('2π'); // circumference 2πr ≈ 18.8
    expect(netDescription('cylinder', { r: 3, h: 4 })).toContain('18.8');
    expect(netDescription('cone', { r: 3, h: 4 })).toContain('5.00');
  });
});
