import { describe, it, expect } from 'vitest';
import { parseIsoDate, toIsoDate } from '../../../src/utils/dates';

describe('parseIsoDate', () => {
  it('accepts real dates, including 29 Feb in a leap year', () => {
    expect(toIsoDate(parseIsoDate('2026-03-15')!)).toBe('2026-03-15');
    expect(toIsoDate(parseIsoDate('2024-02-29')!)).toBe('2024-02-29');
  });
  it('rejects calendar-invalid dates that Date() would roll over', () => {
    expect(parseIsoDate('2025-02-31')).toBeNull(); // would become 3 March
    expect(parseIsoDate('2025-02-29')).toBeNull(); // 2025 is not a leap year
    expect(parseIsoDate('2026-04-31')).toBeNull();
    expect(parseIsoDate('2026-13-01')).toBeNull();
    expect(parseIsoDate('2026-00-10')).toBeNull();
  });
  it('rejects malformed input', () => {
    expect(parseIsoDate('')).toBeNull();
    expect(parseIsoDate(undefined)).toBeNull();
    expect(parseIsoDate('15/03/2026')).toBeNull();
    expect(parseIsoDate('2026-3-5')).toBeNull();
  });
});

import { addDays, calendarDiff, daysBetween, isLeapYear } from '../../../src/utils/dates';

describe('calendar helpers (shared by age, countdown, working-days, schengen)', () => {
  it('daysBetween ignores DST: 2026-03-01 -> 2026-03-30 is 29 days', () => {
    expect(daysBetween(new Date(2026, 2, 1), new Date(2026, 2, 30))).toBe(29);
    expect(daysBetween(new Date(2026, 9, 1), new Date(2026, 10, 2))).toBe(32); // spans the US fall-back
  });
  it('addDays crosses month/year ends without drift', () => {
    expect(addDays(new Date(2026, 11, 31), 1).getFullYear()).toBe(2027);
    expect(addDays(new Date(2024, 1, 28), 2).getDate()).toBe(1); // 28 Feb + 2 = 1 Mar (leap year)
  });
  it('calendarDiff borrows real month lengths (python dateutil: 18 May 2026 -> 1 Mar 2041 = 14y 9m 11d)', () => {
    const d = calendarDiff(new Date(2026, 4, 18), new Date(2041, 2, 1));
    expect([d.years, d.months, d.days, d.totalDays]).toEqual([14, 9, 11, 5401]);
  });
  it('calendarDiff never returns negative days (31 Jan -> 1 Mar 2024 = 1 month 1 day)', () => {
    const d = calendarDiff(new Date(1990, 0, 31), new Date(2024, 2, 1));
    expect([d.years, d.months, d.days]).toEqual([34, 1, 1]);
  });
  it('isLeapYear century rule', () => {
    expect([1900, 2000, 2024, 2100].map(isLeapYear)).toEqual([false, true, true, false]);
  });
});
