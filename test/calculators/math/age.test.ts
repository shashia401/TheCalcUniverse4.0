import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/age';
import { getValue, parseNumber } from '../../helpers';

describe('age calculator', () => {
  it('born Jan 1 2000, target Jan 1 2024 -> age "24 years 0 months 0 days"', () => {
    const r = config.calculate({ birthDate: '2000-01-01', targetDate: '2024-01-01' });
    expect(getValue(r, 'age')).toBe('24 years 0 months 0 days');
  });

  it('born Feb 29 2000 (leap year) is handled', () => {
    const r = config.calculate({ birthDate: '2000-02-29', targetDate: '2024-02-29' });
    expect(getValue(r, 'age')).toBe('24 years 0 months 0 days');
  });

  it('born Feb 29 2000, target Feb 28 2024 (non-leap year) counts correctly', () => {
    const r = config.calculate({ birthDate: '2000-02-29', targetDate: '2024-02-28' });
    // 24 years minus 1 day effectively
    expect(getValue(r, 'age')).toBe('23 years 11 months 30 days');
  });

  it('total months, weeks, days, hours are correct', () => {
    const r = config.calculate({ birthDate: '2000-01-01', targetDate: '2024-01-01' });
    const totalDays = parseInt(getValue(r, 'totalDays'));
    const totalWeeks = parseInt(getValue(r, 'totalWeeks'));
    const totalHours = parseInt(getValue(r, 'totalHours'));
    const totalMonths = parseInt(getValue(r, 'totalMonths'));

    // Jan 1 2000 to Jan 1 2024 = 24 years
    // 2000 is a leap year (366), 2001-2003 (365 each), ...
    // Let's just verify the math is consistent
    expect(totalDays).toBe(24 * 365 + 6); // 6 leap days in 2000-2024
    expect(totalWeeks).toBe(Math.floor(totalDays / 7));
    expect(totalHours).toBe(totalDays * 24);
    expect(totalMonths).toBe(24 * 12);
  });

  it('missing birth date returns empty array', () => {
    const r = config.calculate({ birthDate: '', targetDate: '2024-01-01' });
    expect(r).toEqual([]);
  });

  it('invalid birth date returns empty array', () => {
    const r = config.calculate({ birthDate: 'not-a-date', targetDate: '2024-01-01' });
    expect(r).toEqual([]);
  });

  it('daysUntilBirthday for a date after the birthday this year', () => {
    // Born Jan 1, target Feb 1 (birthday already passed this year)
    const r = config.calculate({ birthDate: '2000-01-01', targetDate: '2024-02-01' });
    const days = parseInt(getValue(r, 'daysUntilBirthday'));
    // Next birthday is Jan 1 2025, so ~335 days from Feb 1 2024
    // (2024 is leap year, so 366 - 31(Jan) = 335)
    expect(days).toBe(335);
  });

  it('daysUntilBirthday when birthday is yet to come this year', () => {
    // Born Dec 31, target Nov 1 (birthday hasn't passed yet)
    const r = config.calculate({ birthDate: '2000-12-31', targetDate: '2024-11-01' });
    const days = parseInt(getValue(r, 'daysUntilBirthday'));
    // Next birthday is Dec 31 2024
    // Nov 1 to Dec 31 = 30 (Nov) + 31 (Dec) = 60 days
    expect(days).toBe(60);
  });

  it('birthday countdown on the birthday itself', () => {
    // Born Jan 1, target Jan 1 (birthday is today)
    const r = config.calculate({ birthDate: '2000-01-01', targetDate: '2024-01-01' });
    const days = parseInt(getValue(r, 'daysUntilBirthday'));
    // Next birthday is Jan 1 2025 (1 year later)
    expect(days).toBe(366); // 2024 is a leap year
  });

  it('returns correct birthDate and targetDate display values', () => {
    const r = config.calculate({ birthDate: '2000-06-15', targetDate: '2024-09-20' });
    expect(getValue(r, 'birthDate')).toBe('Jun 15, 2000');
    expect(getValue(r, 'targetDate')).toBe('Sep 20, 2024');
  });
});
