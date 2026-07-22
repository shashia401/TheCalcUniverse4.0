import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/circle/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Circle calculator', () => {
  it('calculates all from radius', () => {
    const r = config.calculate({ inputType: 'radius', value: '5' });
    near(parseNumber(getValue(r, 'radius')), 5);
    near(parseNumber(getValue(r, 'diameter')), 10);
    near(parseNumber(getValue(r, 'circumference')), 31.4159, 0.01);
    near(parseNumber(getValue(r, 'area')), 78.5398, 0.01);
  });

  it('calculates all from diameter', () => {
    const r = config.calculate({ inputType: 'diameter', value: '10' });
    near(parseNumber(getValue(r, 'radius')), 5);
    near(parseNumber(getValue(r, 'diameter')), 10);
  });

  it('shows reverse step for diameter input', () => {
    const r = config.calculate({ inputType: 'diameter', value: '10' });
    expect(getValue(r, 'reverseStep')).toContain('r = d / 2');
  });

  it('calculates all from circumference', () => {
    const r = config.calculate({ inputType: 'circumference', value: '31.4159265359' });
    near(parseNumber(getValue(r, 'radius')), 5, 0.01);
    near(parseNumber(getValue(r, 'circumference')), 31.4159, 0.01);
  });

  it('shows reverse step for circumference input', () => {
    const r = config.calculate({ inputType: 'circumference', value: '31.416' });
    expect(getValue(r, 'reverseStep')).toContain('r = C');
  });

  it('calculates all from area', () => {
    const r = config.calculate({ inputType: 'area', value: '78.5398163397' });
    near(parseNumber(getValue(r, 'radius')), 5, 0.01);
    near(parseNumber(getValue(r, 'area')), 78.5398, 0.01);
  });

  it('shows reverse step for area input', () => {
    const r = config.calculate({ inputType: 'area', value: '78.54' });
    expect(getValue(r, 'reverseStep')).toContain('√(A');
  });

  it('highlights the input type', () => {
    const r = config.calculate({ inputType: 'radius', value: '5' });
    const radiusRow = r.find(x => x.id === 'radius');
    expect(radiusRow?.highlight).toBe(true);
  });

  it('returns empty for non-positive input', () => {
    const r = config.calculate({ inputType: 'radius', value: '-1' });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN input', () => {
    const r = config.calculate({ inputType: 'radius', value: 'abc' });
    expect(r).toEqual([]);
  });
});
