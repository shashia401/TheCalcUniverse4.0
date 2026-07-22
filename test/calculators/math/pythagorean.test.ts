import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/pythagorean';
import { getValue, parseNumber, near } from '../../helpers';

describe('pythagorean', () => {
  it('classic 3-4-5 triangle: hypotenuse = 5', () => {
    const r = config.calculate({ mode: 'hypotenuse', a: '3', b: '4', c: '' });
    near(parseNumber(getValue(r, 'hyp')), 5);
    near(parseNumber(getValue(r, 'area')), 6); // 0.5 × 3 × 4
    near(parseNumber(getValue(r, 'perimeter')), 12); // 3 + 4 + 5
  });

  it('5-12-13 triple: hypotenuse = 13', () => {
    const r = config.calculate({ mode: 'hypotenuse', a: '5', b: '12', c: '' });
    near(parseNumber(getValue(r, 'hyp')), 13);
  });

  it('non-integer: 1, 1 → sqrt(2)', () => {
    const r = config.calculate({ mode: 'hypotenuse', a: '1', b: '1', c: '' });
    near(parseNumber(getValue(r, 'hyp')), Math.SQRT2, 1e-6);
  });

  it('angles add up correctly (a=3 b=4 → ~36.87°, ~53.13°)', () => {
    const r = config.calculate({ mode: 'hypotenuse', a: '3', b: '4', c: '' });
    const angleA = parseFloat(getValue(r, 'angleA').replace('°', ''));
    const angleB = parseFloat(getValue(r, 'angleB').replace('°', ''));
    near(angleA + angleB, 90, 0.001);
    near(angleA, Math.atan(3 / 4) * (180 / Math.PI), 0.01);
  });

  it('find leg a: c=5, b=4 → leg_a = 3', () => {
    const r = config.calculate({ mode: 'leg_a', a: '', b: '4', c: '5' });
    near(parseNumber(getValue(r, 'leg_a')), 3);
  });

  it('find leg b: c=13, a=5 → leg_b = 12', () => {
    const r = config.calculate({ mode: 'leg_b', a: '5', b: '', c: '13' });
    near(parseNumber(getValue(r, 'leg_b')), 12);
  });

  it('rejects c <= b in leg_a mode (would produce sqrt of negative)', () => {
    const r = config.calculate({ mode: 'leg_a', a: '', b: '5', c: '3' });
    expect(r).toEqual([]);
  });

  it('rejects c <= a in leg_b mode', () => {
    const r = config.calculate({ mode: 'leg_b', a: '5', b: '', c: '3' });
    expect(r).toEqual([]);
  });

  it('returns empty for missing legs in hypotenuse mode', () => {
    const r = config.calculate({ mode: 'hypotenuse', a: '', b: '', c: '' });
    expect(r).toEqual([]);
  });
});
