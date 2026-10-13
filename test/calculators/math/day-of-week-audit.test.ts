import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/day-of-week/index';
import { getValue } from '../../helpers';

// Reference: Python datetime.date(y, m, d).strftime('%A') (proleptic Gregorian, years 1-9999).
const run = (month: string, day: string, year: string) => config.calculate({ month, day, year });
const dow = (m: string, d: string, y: string) => getValue(run(m, d, y), 'dayOfWeek');

describe('day-of-week: Zeller vs an independent calendar (audit)', () => {
  it('known dates', () => {
    expect(dow('2', '29', '2000')).toBe('Tuesday');
    expect(dow('3', '1', '1900')).toBe('Thursday');
    expect(dow('7', '20', '1969')).toBe('Sunday');
    expect(dow('2', '29', '2024')).toBe('Thursday');
    expect(dow('1', '1', '2025')).toBe('Wednesday');
    expect(dow('10', '15', '1582')).toBe('Friday');
    expect(dow('12', '31', '9999')).toBe('Friday');
  });
  it('years 1-99 work (the Date-based validity check read them as 1901-1999 and returned nothing)', () => {
    expect(dow('1', '1', '1')).toBe('Monday');
    expect(dow('3', '3', '33')).toBe('Thursday');
    expect(getValue(run('3', '3', '33'), 'formattedDate')).toBe('Thursday, March 3, 33');
  });
  it('leap-year rules: 1900 and 2100 are common years, 2000 and 2024 leap', () => {
    expect(run('2', '29', '1900')).toEqual([]);
    expect(run('2', '29', '2100')).toEqual([]);
    expect(dow('2', '29', '2000')).toBe('Tuesday');
    expect(getValue(run('2', '1', '1900'), 'daysInMonth')).toBe('28');
    expect(getValue(run('2', '1', '2000'), 'daysInMonth')).toBe('29');
    expect(getValue(run('2', '1', '1'), 'daysInMonth')).toBe('28'); // year 1 is not a leap year
    expect(getValue(run('2', '1', '4'), 'daysInMonth')).toBe('29'); // year 4 is (proleptic Gregorian)
  });
  it('invalid dates return nothing', () => {
    for (const [m, d, y] of [['2', '30', '2024'], ['4', '31', '2025'], ['13', '1', '2025'], ['0', '1', '2025'], ['1', '0', '2025'], ['1', '1', '0'], ['1', '1', '10000'], ['1.5', '1', '2025'], ['1', '1', '20e2'], ['x', '1', '2025']]) {
      expect(run(m, d, y)).toEqual([]);
    }
  });
  it('agrees with the calendar for every day of 400 years (the full Gregorian cycle)', () => {
    const NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    // Independent: UTC day numbers (Date.UTC) give the weekday through the 1970-01-01 = Thursday anchor.
    for (let y = 1600; y < 2000; y += 1) {
      for (const [m, d] of [[1, 1], [2, 28], [3, 1], [6, 15], [12, 31]]) {
        const want = NAMES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
        expect(dow(String(m), String(d), String(y))).toBe(want);
      }
    }
  });
  it('first weekday of the month and the formula breakdown are consistent', () => {
    const r = run('3', '15', '2025'); // Saturday; March 1, 2025 was a Saturday too
    expect(getValue(r, 'firstDayOfMonth')).toBe('Saturday');
    expect(getValue(r, 'dayOfWeek')).toBe('Saturday');
    // q=15, m=3, K=25, J=20: floor(13*4/5)=10, floor(25/4)=6, floor(20/4)=5, 2J=40 -> 15+10+25+6+5-40 = 21 = 0 mod 7 (Saturday)
    expect(getValue(r, 'zellersBreakdown')).toBe('q=15, m=3, K=25, J=20 → h = (15 + 10 + 25 + 6 + 5 − 40) mod 7 = 21 mod 7 = 0');
  });
  it('dates before the Gregorian reform carry a calendar note', () => {
    expect(getValue(run('10', '4', '1582'), 'calendarNote')).toMatch(/proleptic/);
    expect(run('10', '15', '1582').find((x) => x.id === 'calendarNote')).toBeUndefined();
    expect(run('3', '1', '2025').find((x) => x.id === 'calendarNote')).toBeUndefined();
  });
});
