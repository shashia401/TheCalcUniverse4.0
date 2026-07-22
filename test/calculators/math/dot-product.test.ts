import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/dot-product/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Dot Product Calculator', () => {
  it('computes dot product of 2D vectors', () => {
    const r = config.calculate({ v1x: '1', v1y: '2', v1z: '', v2x: '3', v2y: '4', v2z: '' });
    near(parseNumber(getValue(r, 'dotProduct')), 11);
  });

  it('computes dot product of 3D vectors', () => {
    const r = config.calculate({ v1x: '1', v1y: '2', v1z: '3', v2x: '4', v2y: '5', v2z: '6' });
    near(parseNumber(getValue(r, 'dotProduct')), 32);
  });

  it('computes magnitudes', () => {
    const r = config.calculate({ v1x: '3', v1y: '4', v1z: '', v2x: '1', v2y: '0', v2z: '' });
    near(parseNumber(getValue(r, 'magnitude1')), 5);
    near(parseNumber(getValue(r, 'magnitude2')), 1);
  });

  it('computes angle between perpendicular vectors as 90°', () => {
    const r = config.calculate({ v1x: '1', v1y: '0', v1z: '', v2x: '0', v2y: '1', v2z: '' });
    near(parseNumber(getValue(r, 'angleDeg')), 90);
  });

  it('reports orthogonal vectors correctly', () => {
    const r = config.calculate({ v1x: '1', v1y: '0', v1z: '', v2x: '0', v2y: '1', v2z: '' });
    expect(getValue(r, 'orthogonal')).toBe('Yes');
  });

  it('reports non-orthogonal vectors correctly', () => {
    const r = config.calculate({ v1x: '1', v1y: '0', v1z: '', v2x: '1', v2y: '0', v2z: '' });
    expect(getValue(r, 'orthogonal')).toBe('No');
  });

  it('computes cosθ for parallel vectors', () => {
    const r = config.calculate({ v1x: '1', v1y: '0', v1z: '', v2x: '2', v2y: '0', v2z: '' });
    near(parseNumber(getValue(r, 'cosTheta')), 1);
  });

  it('computes scalar projection', () => {
    const r = config.calculate({ v1x: '3', v1y: '4', v1z: '', v2x: '1', v2y: '0', v2z: '' });
    near(parseNumber(getValue(r, 'projection')), 3);
  });

  it('returns empty for NaN input', () => {
    const r = config.calculate({ v1x: 'abc', v1y: '2', v1z: '', v2x: '3', v2y: '4', v2z: '' });
    expect(r).toEqual([]);
  });

  it('returns empty for missing required values', () => {
    const r = config.calculate({ v1x: '', v1y: '2', v1z: '', v2x: '3', v2y: '4', v2z: '' });
    expect(r).toEqual([]);
  });
});
