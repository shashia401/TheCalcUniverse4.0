import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/cross-product/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Cross Product Calculator', () => {
  it('computes cross product of basis vectors i × j = k', () => {
    const r = config.calculate({
      v1x: '1', v1y: '0', v1z: '0',
      v2x: '0', v2y: '1', v2z: '0',
    });
    expect(getValue(r, 'crossProduct')).toContain('0, 0, 1');
  });

  it('computes cross product magnitude', () => {
    const r = config.calculate({
      v1x: '3', v1y: '0', v1z: '0',
      v2x: '0', v2y: '4', v2z: '0',
    });
    near(parseNumber(getValue(r, 'magnitude')), 12);
  });

  it('computes unit vector direction', () => {
    const r = config.calculate({
      v1x: '1', v1y: '0', v1z: '0',
      v2x: '0', v2y: '1', v2z: '0',
    });
    expect(getValue(r, 'unitVector')).toContain('0, 0, 1');
  });

  it('verifies orthogonality with original vectors', () => {
    const r = config.calculate({
      v1x: '2', v1y: '3', v1z: '4',
      v2x: '5', v2y: '6', v2z: '7',
    });
    const ver = getValue(r, 'verification');
    const parts = ver.split(',').map(s => parseFloat(s.trim()));
    near(parts[0], 0);
    near(parts[1], 0);
  });

  it('computes area of parallelogram', () => {
    const r = config.calculate({
      v1x: '1', v1y: '0', v1z: '0',
      v2x: '0', v2y: '1', v2z: '0',
    });
    near(parseNumber(getValue(r, 'area')), 1);
  });

  it('returns empty for NaN input', () => {
    const r = config.calculate({
      v1x: 'abc', v1y: '0', v1z: '0',
      v2x: '0', v2y: '1', v2z: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for missing required values', () => {
    const r = config.calculate({
      v1x: '', v1y: '0', v1z: '0',
      v2x: '0', v2y: '1', v2z: '0',
    });
    expect(r).toEqual([]);
  });

  it('computes cross product of anti-parallel vectors as zero', () => {
    const r = config.calculate({
      v1x: '1', v1y: '0', v1z: '0',
      v2x: '2', v2y: '0', v2z: '0',
    });
    expect(getValue(r, 'crossProduct')).toContain('0, 0, 0');
  });

  it('computes correct area for non-orthogonal vectors', () => {
    const r = config.calculate({
      v1x: '1', v1y: '0', v1z: '0',
      v2x: '1', v2y: '1', v2z: '0',
    });
    near(parseNumber(getValue(r, 'area')), 1);
  });
});
