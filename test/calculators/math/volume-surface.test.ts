import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/volume-surface/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('volume-surface calculator', () => {
  it('calculates cube volume, surface area, and diagonal', () => {
    const r = config.calculate({ shape: 'cube', dim1: '3' });
    near(parseNumber(getValue(r, 'volume')), 27);
    near(parseNumber(getValue(r, 'surface')), 54);
    near(parseNumber(getValue(r, 'diagonal')), 5.19615, 0.01);
  });

  it('calculates sphere volume, surface area, and diameter', () => {
    const r = config.calculate({ shape: 'sphere', dim1: '2' });
    near(parseNumber(getValue(r, 'volume')), 33.51032, 0.01);
    near(parseNumber(getValue(r, 'surface')), 50.26548, 0.01);
    near(parseNumber(getValue(r, 'diameter')), 4);
  });

  it('calculates cylinder volume, surface area, and lateral surface area', () => {
    const r = config.calculate({ shape: 'cylinder', dim1: '2', dim2: '5' });
    near(parseNumber(getValue(r, 'volume')), 62.83185, 0.01);
    near(parseNumber(getValue(r, 'surface')), 87.96459, 0.01);
    near(parseNumber(getValue(r, 'lateral')), 62.83185, 0.01);
  });

  it('calculates rectangular prism (box) volume, surface area, and diagonal', () => {
    const r = config.calculate({ shape: 'box', dim1: '4', dim2: '3', dim3: '2' });
    near(parseNumber(getValue(r, 'volume')), 24);
    near(parseNumber(getValue(r, 'surface')), 52);
    near(parseNumber(getValue(r, 'diagonal')), 5.38516, 0.01);
  });

  it('calculates cone volume, surface area, and slant height', () => {
    const r = config.calculate({ shape: 'cone', dim1: '3', dim2: '4' });
    near(parseNumber(getValue(r, 'volume')), 37.69911, 0.01);
    near(parseNumber(getValue(r, 'slant')), 5);
  });

  it('calculates pyramid volume, surface area, and slant height', () => {
    const r = config.calculate({ shape: 'pyramid', dim1: '4', dim2: '6' });
    near(parseNumber(getValue(r, 'volume')), 32);
    near(parseNumber(getValue(r, 'slant')), 6.32456, 0.01);
  });

  it('returns empty for empty inputs', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty for zero sphere radius', () => {
    expect(config.calculate({ shape: 'sphere', dim1: '0' })).toHaveLength(0);
  });

  it('returns empty for negative sphere radius', () => {
    expect(config.calculate({ shape: 'sphere', dim1: '-2' })).toHaveLength(0);
  });

  it('returns empty for missing cylinder dim2', () => {
    expect(config.calculate({ shape: 'cylinder', dim1: '2' })).toHaveLength(0);
  });

  it('returns empty for missing box dimensions', () => {
    expect(config.calculate({ shape: 'box', dim1: '4', dim2: '3' })).toHaveLength(0);
  });
});
