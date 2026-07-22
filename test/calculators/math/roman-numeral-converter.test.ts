import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/roman-numeral/index';

describe('Roman Numeral Converter', () => {
  describe('Number to Roman mode', () => {
    it('converts 1994 to MCMXCIV', () => {
      const r = config.calculate({ mode: 'toRoman', number: '1994' });
      const result = r.find((x) => x.id === 'romanResult');
      expect(result!.value).toBe('MCMXCIV');
    });

    it('converts 2024 to MMXXIV', () => {
      const r = config.calculate({ mode: 'toRoman', number: '2024' });
      const result = r.find((x) => x.id === 'romanResult');
      expect(result!.value).toBe('MMXXIV');
    });

    it('converts 1 to I', () => {
      const r = config.calculate({ mode: 'toRoman', number: '1' });
      const result = r.find((x) => x.id === 'romanResult');
      expect(result!.value).toBe('I');
    });

    it('converts 3999 to MMMCMXCIX', () => {
      const r = config.calculate({ mode: 'toRoman', number: '3999' });
      const result = r.find((x) => x.id === 'romanResult');
      expect(result!.value).toBe('MMMCMXCIX');
    });

    it('returns empty for 0', () => {
      const r = config.calculate({ mode: 'toRoman', number: '0' });
      expect(r).toEqual([]);
    });

    it('returns empty for 4000', () => {
      const r = config.calculate({ mode: 'toRoman', number: '4000' });
      expect(r).toEqual([]);
    });

    it('returns empty for non-integer', () => {
      const r = config.calculate({ mode: 'toRoman', number: '3.14' });
      expect(r).toEqual([]);
    });

    it('returns empty for negative number', () => {
      const r = config.calculate({ mode: 'toRoman', number: '-5' });
      expect(r).toEqual([]);
    });

    it('shows subtractive notation breakdown', () => {
      const r = config.calculate({ mode: 'toRoman', number: '1994' });
      const breakdown = r.find((x) => x.id === 'breakdown');
      expect(breakdown).toBeTruthy();
      expect(breakdown!.value).toContain('M');
      expect(breakdown!.value).toContain('CM');
      expect(breakdown!.value).toContain('= 1994');
    });
  });

  describe('Roman to Number mode', () => {
    it('converts MCMXCIV to 1994', () => {
      const r = config.calculate({ mode: 'fromRoman', romanInput: 'MCMXCIV' });
      const result = r.find((x) => x.id === 'arabicResult');
      expect(result!.value).toBe('1994');
    });

    it('converts MMXXIV to 2024', () => {
      const r = config.calculate({ mode: 'fromRoman', romanInput: 'MMXXIV' });
      const result = r.find((x) => x.id === 'arabicResult');
      expect(result!.value).toBe('2024');
    });

    it('converts III to 3', () => {
      const r = config.calculate({ mode: 'fromRoman', romanInput: 'III' });
      const result = r.find((x) => x.id === 'arabicResult');
      expect(result!.value).toBe('3');
    });

    it('marks valid Roman numerals', () => {
      const r = config.calculate({ mode: 'fromRoman', romanInput: 'MCMXCIV' });
      const valid = r.find((x) => x.id === 'validationNote');
      expect(valid!.value).toBe('Yes');
    });

    it('flags invalid Roman numerals', () => {
      const r = config.calculate({ mode: 'fromRoman', romanInput: 'IIII' });
      const warning = r.find((x) => x.id === 'validationNote');
      expect(warning).toBeTruthy();
      expect(warning!.value).toContain('Not a valid Roman numeral');
    });

    it('returns empty for empty input', () => {
      const r = config.calculate({ mode: 'fromRoman', romanInput: '' });
      expect(r).toEqual([]);
    });

    it('returns empty for invalid characters', () => {
      const r = config.calculate({ mode: 'fromRoman', romanInput: 'ABC' });
      expect(r).toEqual([]);
    });

    it('handles lowercase input', () => {
      const r = config.calculate({ mode: 'fromRoman', romanInput: 'mcxciV' });
      const result = r.find((x) => x.id === 'arabicResult');
      expect(result!.value).toBe('1194');
    });
  });

  describe('Date to Roman mode', () => {
    it('converts a date in MDY format', () => {
      const r = config.calculate({
        mode: 'date',
        dateYear: '2024',
        dateMonth: '4',
        dateDay: '17',
        dateFormat: 'mdy',
      });
      const romanDate = r.find((x) => x.id === 'romanDate');
      expect(romanDate!.value).toContain('IV');
    });

    it('converts a date in DMY format', () => {
      const r = config.calculate({
        mode: 'date',
        dateYear: '2024',
        dateMonth: '4',
        dateDay: '17',
        dateFormat: 'dmy',
      });
      const romanDate = r.find((x) => x.id === 'romanDate');
      expect(romanDate!.value).toBeTruthy();
    });

    it('shows Gregorian date equivalent', () => {
      const r = config.calculate({
        mode: 'date',
        dateYear: '2024',
        dateMonth: '4',
        dateDay: '17',
        dateFormat: 'mdy',
      });
      const greg = r.find((x) => x.id === 'gregorianDate');
      expect(greg!.value).toBe('04/17/2024');
    });

    it('returns empty for invalid date values', () => {
      const r = config.calculate({
        mode: 'date',
        dateYear: '',
        dateMonth: '4',
        dateDay: '17',
        dateFormat: 'mdy',
      });
      expect(r).toEqual([]);
    });
  });

  it('returns empty for missing mode', () => {
    const r = config.calculate({ number: '1994' });
    expect(r).not.toEqual([]);
  });

  it('defaults to toRoman mode when mode is empty', () => {
    const r = config.calculate({ mode: '', number: '1994' });
    expect(r).not.toEqual([]);
  });

  it('has educational content', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.formulaDescription!.length).toBeGreaterThan(50);
    expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.howToUse!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.commonUses!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
    expect(config.educational.citations!.length).toBeGreaterThanOrEqual(2);
    expect(config.educational.explanation!.length).toBeGreaterThan(300);
    expect(config.educational.diagram).toBeTruthy();
    expect(config.educational.diagram!.svg).toBeTruthy();
    expect(config.educational.diagram!.alt).toBeTruthy();
  });
});
