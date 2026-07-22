import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/roman-numeral/index';
import { getValue } from '../../helpers';

describe('roman-numeral', () => {
  it('converts 1 to I', () => {
    const r = config.calculate({ mode: 'toRoman', number: '1' });
    expect(getValue(r, 'romanResult')).toBe('I');
  });

  it('converts 4 to IV', () => {
    const r = config.calculate({ mode: 'toRoman', number: '4' });
    expect(getValue(r, 'romanResult')).toBe('IV');
  });

  it('converts 9 to IX', () => {
    const r = config.calculate({ mode: 'toRoman', number: '9' });
    expect(getValue(r, 'romanResult')).toBe('IX');
  });

  it('converts 40 to XL', () => {
    const r = config.calculate({ mode: 'toRoman', number: '40' });
    expect(getValue(r, 'romanResult')).toBe('XL');
  });

  it('converts 90 to XC', () => {
    const r = config.calculate({ mode: 'toRoman', number: '90' });
    expect(getValue(r, 'romanResult')).toBe('XC');
  });

  it('converts 400 to CD', () => {
    const r = config.calculate({ mode: 'toRoman', number: '400' });
    expect(getValue(r, 'romanResult')).toBe('CD');
  });

  it('converts 900 to CM', () => {
    const r = config.calculate({ mode: 'toRoman', number: '900' });
    expect(getValue(r, 'romanResult')).toBe('CM');
  });

  it('converts 1994 to MCMXCIV', () => {
    const r = config.calculate({ mode: 'toRoman', number: '1994' });
    expect(getValue(r, 'romanResult')).toBe('MCMXCIV');
  });

  it('converts 3999 to MMMCMXCIX', () => {
    const r = config.calculate({ mode: 'toRoman', number: '3999' });
    expect(getValue(r, 'romanResult')).toBe('MMMCMXCIX');
  });

  it('converts IV back to 4', () => {
    const r = config.calculate({ mode: 'fromRoman', romanInput: 'IV' });
    expect(getValue(r, 'arabicResult')).toBe('4');
  });

  it('converts MCMXCIV back to 1994', () => {
    const r = config.calculate({ mode: 'fromRoman', romanInput: 'MCMXCIV' });
    expect(getValue(r, 'arabicResult')).toBe('1994');
  });

  it('converts date to Roman format (MDY)', () => {
    const r = config.calculate({ mode: 'date', dateYear: '2024', dateMonth: '4', dateDay: '4', dateFormat: 'mdy' });
    expect(getValue(r, 'romanDate')).toBe('IV.IV.MMXXIV');
  });

  it('converts date to Roman format (DMY)', () => {
    const r = config.calculate({ mode: 'date', dateYear: '2024', dateMonth: '12', dateDay: '25', dateFormat: 'dmy' });
    expect(getValue(r, 'romanDate')).toBe('XXV.XII.MMXXIV');
  });

  it('returns warning for non-standard Roman numeral', () => {
    const r = config.calculate({ mode: 'fromRoman', romanInput: 'XXXX' });
    expect(r.length).toBeGreaterThan(0);
    expect(getValue(r, 'validationNote')).toContain('Not a valid');
  });

  it('returns empty for non-Roman characters', () => {
    const r = config.calculate({ mode: 'fromRoman', romanInput: 'ABC' });
    expect(r).toEqual([]);
  });

  it('returns empty for number > 3999', () => {
    const r = config.calculate({ mode: 'toRoman', number: '4000' });
    expect(r).toEqual([]);
  });

  it('returns empty for number 0', () => {
    const r = config.calculate({ mode: 'toRoman', number: '0' });
    expect(r).toEqual([]);
  });

  it('returns breakdown for Roman numeral', () => {
    const r = config.calculate({ mode: 'toRoman', number: '1994' });
    expect(getValue(r, 'breakdown')).toContain('M (1000)');
    expect(getValue(r, 'breakdown')).toContain('CM');
    expect(getValue(r, 'breakdown')).toContain('1994');
  });

  it('shows valid Roman numeral message', () => {
    const r = config.calculate({ mode: 'fromRoman', romanInput: 'VII' });
    expect(getValue(r, 'validationNote')).toBe('Yes');
  });

  it('extraPanel returns element when results exist', () => {
    const r = config.calculate({ mode: 'toRoman', number: '42' });
    const panel = config.extraPanel({ mode: 'toRoman', number: '42' }, r);
    expect(panel).not.toBeNull();
  });

  it('extraPanel returns null when results empty', () => {
    const r = config.calculate({ mode: 'toRoman', number: '0' });
    const panel = config.extraPanel({ mode: 'toRoman', number: '0' }, r);
    expect(panel).toBeNull();
  });
});
