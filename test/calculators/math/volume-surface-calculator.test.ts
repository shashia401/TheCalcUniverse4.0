import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/volume-surface';
import { getValue, parseNumber, near } from '../../helpers';

describe('Volume & Surface Area calculator', () => {
  it('calculates sphere volume, surface area, and diameter from radius', () => {
    const r = config.calculate({ shape: 'sphere', dim1: '5', dim2: '', dim3: '' });
    near(parseNumber(getValue(r, 'volume')), (4 / 3) * Math.PI * 125, 0.01);
    near(parseNumber(getValue(r, 'surface')), 4 * Math.PI * 25, 0.01);
    near(parseNumber(getValue(r, 'diameter')), 10, 0.01);
  });

  it('calculates cube volume, surface area, and space diagonal from side length', () => {
    const r = config.calculate({ shape: 'cube', dim1: '5', dim2: '', dim3: '' });
    near(parseNumber(getValue(r, 'volume')), 125, 0.01);
    near(parseNumber(getValue(r, 'surface')), 150, 0.01);
    near(parseNumber(getValue(r, 'diagonal')), 5 * Math.sqrt(3), 0.01);
  });

  it('returns empty array for NaN input', () => {
    const r = config.calculate({ shape: 'sphere', dim1: 'abc', dim2: '', dim3: '' });
    expect(r).toEqual([]);
  });

  it('returns empty array for non-positive radius', () => {
    const r = config.calculate({ shape: 'sphere', dim1: '0', dim2: '', dim3: '' });
    expect(r).toEqual([]);
  });

  it('returns empty array for non-positive cube side', () => {
    const r = config.calculate({ shape: 'cube', dim1: '-3', dim2: '', dim3: '' });
    expect(r).toEqual([]);
  });

  it('calculates box volume, surface area, and space diagonal', () => {
    const r = config.calculate({ shape: 'box', dim1: '3', dim2: '4', dim3: '5' });
    near(parseNumber(getValue(r, 'volume')), 60, 0.01);
    near(parseNumber(getValue(r, 'surface')), 94, 0.01);
    near(parseNumber(getValue(r, 'diagonal')), Math.sqrt(3 * 3 + 4 * 4 + 5 * 5), 0.01);
  });

  it('returns empty array for box with NaN dimensions', () => {
    const r = config.calculate({ shape: 'box', dim1: '3', dim2: 'abc', dim3: '5' });
    expect(r).toEqual([]);
  });
});
