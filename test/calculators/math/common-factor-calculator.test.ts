import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/common-factor/index';
import { getValue } from '../../helpers';

describe('Common Factor calculator', () => {
  it('finds common factors of 24 and 36', () => {
    const r = config.calculate({ a: '24', b: '36' });
    expect(getValue(r, 'commonFactors')).toBe('1, 2, 3, 4, 6, 12');
  });

  it('GCF of 24 and 36 = 12', () => {
    const r = config.calculate({ a: '24', b: '36' });
    expect(getValue(r, 'gcf')).toBe('12');
  });

  it('common factors of 7 and 13 = 1 (coprime)', () => {
    const r = config.calculate({ a: '7', b: '13' });
    expect(getValue(r, 'commonFactors')).toBe('1');
  });

  it('shows factors of each number', () => {
    const r = config.calculate({ a: '24', b: '36' });
    expect(getValue(r, 'factorsA')).toContain('24');
    expect(getValue(r, 'factorsB')).toContain('36');
  });

  it('shows common count', () => {
    const r = config.calculate({ a: '24', b: '36' });
    expect(getValue(r, 'commonCount')).toBe('6');
  });

  it('returns empty for missing inputs', () => {
    const r = config.calculate({ a: '', b: '' });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid inputs', () => {
    const r = config.calculate({ a: 'abc', b: '5' });
    expect(r).toEqual([]);
  });

  it('returns empty for zero', () => {
    const r = config.calculate({ a: '0', b: '5' });
    expect(r).toEqual([]);
  });
});
