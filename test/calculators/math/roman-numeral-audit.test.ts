// Oracle: independent greedy Roman encoder in Python and calendar.isleap.
import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/roman-numeral/index';
import { getValue, getResult } from '../../helpers';

const toR = (number: string) => config.calculate({ mode: 'toRoman', number });
const fromR = (romanInput: string) => config.calculate({ mode: 'fromRoman', romanInput });
const date = (dateYear: string, dateMonth: string, dateDay: string, dateFormat = 'mdy') =>
  config.calculate({ mode: 'date', dateYear, dateMonth, dateDay, dateFormat });

describe('roman numeral audit', () => {
  it('encodes the boundary values', () => {
    expect(getValue(toR('1994'), 'romanResult')).toBe('MCMXCIV');
    expect(getValue(toR('3999'), 'romanResult')).toBe('MMMCMXCIX');
    expect(getValue(toR('4'), 'romanResult')).toBe('IV');
    expect(getValue(toR('1'), 'romanResult')).toBe('I');
    expect(toR('4000')).toEqual([]);
    expect(toR('0')).toEqual([]);
    expect(toR('12.5')).toEqual([]);
  });
  it('every number 1..3999 round-trips and decodes strictly', () => {
    for (let n = 1; n <= 3999; n++) {
      const roman = getValue(toR(String(n)), 'romanResult');
      const back = fromR(roman);
      expect(getValue(back, 'arabicResult')).toBe(String(n));
      expect(getValue(back, 'validationNote')).toBe('Yes');
    }
  });
  it('rejects non-standard forms but still shows the value with the standard spelling', () => {
    for (const [bad, value, standard] of [['IIII', '4', 'IV'], ['IC', '99', 'XCIX'], ['VX', '5', 'V'], ['IIX', '10', 'X'], ['VV', '10', 'X'], ['XM', '990', 'CMXC'], ['LXXXX', '90', 'XC']]) {
      const r = fromR(bad);
      expect(getValue(r, 'arabicResult')).toBe(value);
      expect(getValue(r, 'validationNote')).toBe(`Not a valid Roman numeral (standard form: ${standard})`);
      expect(getResult(r, 'validationNote').label).toBe('Warning');
    }
  });
  it('MMMM (4000) is flagged as outside the standard range instead of "standard form: "', () => {
    const r = fromR('MMMM');
    expect(getValue(r, 'arabicResult')).toBe('4000');
    expect(getValue(r, 'validationNote')).toContain('1 to 3999');
    expect(getValue(r, 'validationNote')).not.toContain('standard form: )');
  });
  it('case-insensitive and whitespace-trimmed; non-letters are empty', () => {
    expect(getValue(fromR(' mcmxciv '), 'arabicResult')).toBe('1994');
    expect(fromR('MCM XCIV')).toEqual([]);
    expect(fromR('ABC')).toEqual([]);
    expect(fromR('')).toEqual([]);
  });
  it('dates are validated against the calendar (leap years, 30-day months)', () => {
    expect(getValue(date('2024', '2', '29'), 'romanDate')).toBe('II.XXIX.MMXXIV'); // 2024 is a leap year
    expect(date('2023', '2', '29')[0].id).toBe('error');
    expect(date('1900', '2', '29')[0].id).toBe('error'); // divisible by 100, not 400
    expect(getValue(date('2000', '2', '29'), 'romanDate')).toBe('II.XXIX.MM');
    expect(date('2024', '4', '31')[0].id).toBe('error');
    expect(date('2024', '4', '31')[0].value).toContain('30 days');
    expect(getValue(date('2024', '12', '31', 'dmy'), 'romanDate')).toBe('XXXI.XII.MMXXIV');
    expect(getValue(date('2024', '12', '31', 'dmy'), 'gregorianDate')).toBe('31/12/2024');
  });
});
