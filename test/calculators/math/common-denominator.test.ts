import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/common-denominator/index';
import { getValue } from '../../helpers';

describe('Common Denominator Calculator', () => {
  it('finds LCD of 2 and 3 = 6', () => {
    const r = config.calculate({ numerators: '1', denominators: '2, 3' });
    expect(getValue(r, 'lcd')).toBe('6');
  });

  it('finds LCD of 4 and 6 = 12', () => {
    const r = config.calculate({ numerators: '1, 1', denominators: '4, 6' });
    expect(getValue(r, 'lcd')).toBe('12');
  });

  it('finds LCD for three fractions', () => {
    const r = config.calculate({ numerators: '1, 2, 3', denominators: '2, 3, 4' });
    expect(getValue(r, 'lcd')).toBe('12');
  });

  it('converts fractions correctly', () => {
    const r = config.calculate({ numerators: '1, 1', denominators: '2, 3' });
    const convertedRaw = getValue(r, '_convertedFractions');
    const converted = JSON.parse(convertedRaw);
    expect(converted[0].numerator).toBe(3);
    expect(converted[0].denominator).toBe(6);
    expect(converted[1].numerator).toBe(2);
    expect(converted[1].denominator).toBe(6);
  });

  it('includes work steps', () => {
    const r = config.calculate({ numerators: '1, 1', denominators: '2, 3' });
    expect(getValue(r, 'work')).toContain('Step');
    expect(getValue(r, 'work')).toContain('6');
  });

  it('returns empty for empty numerators', () => {
    const r = config.calculate({ numerators: '', denominators: '2, 3' });
    expect(r).toEqual([]);
  });

  it('returns empty for empty denominators', () => {
    const r = config.calculate({ numerators: '1, 1', denominators: '' });
    expect(r).toEqual([]);
  });

  it('returns empty for non-numeric input', () => {
    const r = config.calculate({ numerators: 'abc', denominators: 'def' });
    expect(r).toEqual([]);
  });

  it('returns empty for non-matching lengths', () => {
    const r = config.calculate({ numerators: '1, 2, 3', denominators: '2, 3' });
    expect(getValue(r, 'error')).toContain('match');
  });

  it('works with single digits', () => {
    const r = config.calculate({ numerators: '5, 7', denominators: '8, 12' });
    expect(getValue(r, 'lcd')).toBe('24');
  });

  it('finds LCD for coprime denominators', () => {
    const r = config.calculate({ numerators: '1, 1', denominators: '7, 5' });
    expect(getValue(r, 'lcd')).toBe('35');
  });

  it('converts fraction with multiplier info', () => {
    const r = config.calculate({ numerators: '3', denominators: '4, 6' });
    const convertedRaw = getValue(r, '_convertedFractions');
    const converted = JSON.parse(convertedRaw);
    expect(converted[0].multiplier).toBe(3); // 12/4 = 3
    expect(converted[1].multiplier).toBe(2); // 12/6 = 2
  });
});
