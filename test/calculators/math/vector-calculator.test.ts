import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/vector-calculator/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Vector Calculator', () => {
  it('calculates 2D vector addition', () => {
    const r = config.calculate({ v1x: '1', v1y: '2', v1z: '', v2x: '3', v2y: '4', v2z: '' });
    expect(getValue(r, 'sum')).toContain('4');
    expect(getValue(r, 'sum')).toContain('6');
  });

  it('calculates 3D vector addition', () => {
    const r = config.calculate({ v1x: '1', v1y: '2', v1z: '3', v2x: '4', v2y: '5', v2z: '6' });
    expect(getValue(r, 'sum')).toContain('5, 7, 9');
  });

  it('calculates vector subtraction', () => {
    const r = config.calculate({ v1x: '5', v1y: '6', v1z: '', v2x: '1', v2y: '2', v2z: '' });
    expect(getValue(r, 'difference')).toContain('4, 4');
  });

  it('calculates magnitudes', () => {
    const r = config.calculate({ v1x: '3', v1y: '4', v1z: '', v2x: '1', v2y: '0', v2z: '' });
    near(parseNumber(getValue(r, 'magnitude1')), 5);
    near(parseNumber(getValue(r, 'magnitude2')), 1);
  });

  it('calculates dot product', () => {
    const r = config.calculate({ v1x: '1', v1y: '2', v1z: '', v2x: '3', v2y: '4', v2z: '' });
    near(parseNumber(getValue(r, 'dotProduct')), 11);
  });

  it('calculates cross product for 3D vectors', () => {
    const r = config.calculate({ v1x: '1', v1y: '0', v1z: '0', v2x: '0', v2y: '1', v2z: '0' });
    expect(getValue(r, 'crossProduct')).toContain('0, 0, 1');
  });

  it('calculates angle between vectors', () => {
    const r = config.calculate({ v1x: '1', v1y: '0', v1z: '', v2x: '0', v2y: '1', v2z: '' });
    near(parseNumber(getValue(r, 'angleDeg')), 90);
  });

  it('returns empty for missing required values', () => {
    const r = config.calculate({ v1x: '', v1y: '2', v1z: '', v2x: '3', v2y: '4', v2z: '' });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN input', () => {
    const r = config.calculate({ v1x: 'abc', v1y: '2', v1z: '', v2x: '3', v2y: '4', v2z: '' });
    expect(r).toEqual([]);
  });

  it('handles perpendicular vectors angle', () => {
    const r = config.calculate({ v1x: '1', v1y: '0', v1z: '0', v2x: '0', v2y: '1', v2z: '0' });
    near(parseNumber(getValue(r, 'angleDeg')), 90);
  });
});
