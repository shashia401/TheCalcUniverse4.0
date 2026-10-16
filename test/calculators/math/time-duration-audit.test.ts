import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/time-duration/index';
import { getValue } from '../../helpers';

// Expected values derived independently with Python's datetime (wall-clock arithmetic, no time zone).
const run = (startDate: string, startTime: string, endDate: string, endTime: string, businessDays = 'no') =>
  config.calculate({ startDate, startTime, endDate, endTime, businessDays });

describe('time-duration audit', () => {
  it('worked example 1: Fri 2026-06-05 10:00 PM -> Sat 4:30 AM = 6.50 h, 390 min, 23400 s, 0d 6h 30m', () => {
    const r = run('2026-06-05', '10:00 PM', '2026-06-06', '4:30 AM');
    expect(getValue(r, 'totalHours')).toBe('6.50');
    expect(getValue(r, 'totalMinutes')).toBe('390');
    expect(getValue(r, 'totalSeconds')).toBe('23400');
    expect(getValue(r, 'daysHoursMinutes')).toBe('0d 6h 30m');
  });

  it('worked example 2: Mon 2026-03-09 9:00 AM -> Fri 03-13 5:00 PM = 104.00 h, 4d 8h 0m, 5 business days', () => {
    const r = run('2026-03-09', '9:00 AM', '2026-03-13', '5:00 PM', 'yes');
    expect(getValue(r, 'totalHours')).toBe('104.00');
    expect(getValue(r, 'daysHoursMinutes')).toBe('4d 8h 0m');
    expect(getValue(r, 'weeksDaysHours')).toBe('0w 4d 8h');
    expect(getValue(r, 'businessDays')).toBe('5');
  });

  it('worked example 3: 2:15 AM -> 5:45 AM = 3.50 h, 210 min, 12600 s', () => {
    const r = run('2026-05-15', '2:15 AM', '2026-05-15', '5:45 AM');
    expect(getValue(r, 'totalHours')).toBe('3.50');
    expect(getValue(r, 'totalMinutes')).toBe('210');
    expect(getValue(r, 'totalSeconds')).toBe('12600');
  });

  it('DST never changes the answer (wall-clock arithmetic): spring-forward and fall-back days are plain 3 h gaps', () => {
    // 2026-03-08 is the US spring-forward day, 2026-11-01 the fall-back day. Local-time Date maths gave 2 h / 4 h
    // in US time zones; the result must be identical wherever the browser runs.
    expect(getValue(run('2026-03-08', '1:00 AM', '2026-03-08', '4:00 AM'), 'totalHours')).toBe('3.00');
    expect(getValue(run('2026-11-01', '12:30 AM', '2026-11-01', '3:30 AM'), 'totalHours')).toBe('3.00');
  });

  it('leap years: Feb 28 noon -> Mar 1 noon is 2 days in 2024 and 1 day in 2025', () => {
    expect(getValue(run('2024-02-28', '12:00', '2024-03-01', '12:00'), 'daysHoursMinutes')).toBe('2d 0h 0m');
    expect(getValue(run('2025-02-28', '12:00', '2025-03-01', '12:00'), 'daysHoursMinutes')).toBe('1d 0h 0m');
  });

  it('end before start gives an explanation instead of an empty result', () => {
    const r = run('2026-06-05', '11:00 PM', '2026-06-05', '7:00 AM');
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe('error');
    expect(r[0].value).toContain('next calendar day');
  });

  it('impossible calendar dates are rejected (they used to roll over: 2025-02-31 became March 3)', () => {
    expect(run('2025-02-31', '9:00 AM', '2025-03-05', '9:00 AM')).toEqual([]);
    expect(run('2025-02-28', '9:00 AM', '2025-02-30', '9:00 AM')).toEqual([]);
    expect(run('2025-13-01', '9:00 AM', '2025-12-31', '9:00 AM')).toEqual([]);
    expect(run('2025-2-1', '9:00 AM', '2025-03-01', '9:00 AM')).toEqual([]);
  });

  it('time parsing: 12 AM is midnight, 12 PM is noon, "9:00AM" works, 24:00 and seconds are rejected', () => {
    expect(getValue(run('2026-01-01', '12:00 AM', '2026-01-01', '12:00 PM'), 'totalHours')).toBe('12.00');
    expect(getValue(run('2026-01-01', '9:00AM', '2026-01-01', '5:30 PM'), 'totalMinutes')).toBe('510');
    expect(getValue(run('2026-01-01', '14:30', '2026-01-01', '23:59'), 'totalMinutes')).toBe('569'); // 9 h 29 min
    expect(run('2026-01-01', '24:00', '2026-01-02', '1:00')).toEqual([]);
    expect(run('2026-01-01', '9:00:30 AM', '2026-01-01', '5:00 PM')).toEqual([]);
    expect(run('2026-01-01', '13:00 PM', '2026-01-02', '1:00')).toEqual([]);
    expect(run('2026-01-01', '', '2026-01-02', '1:00')).toEqual([]);
  });

  it('business days count both end dates: Fri->Mon = 2, Sat->Sun = 0, Mon->Mon = 1, all of 2026 = 261', () => {
    expect(getValue(run('2026-06-05', '9:00', '2026-06-08', '17:00', 'yes'), 'businessDays')).toBe('2');
    expect(getValue(run('2026-06-06', '9:00', '2026-06-07', '17:00', 'yes'), 'businessDays')).toBe('0');
    expect(getValue(run('2026-06-08', '9:00', '2026-06-08', '17:00', 'yes'), 'businessDays')).toBe('1');
    expect(getValue(run('2026-01-01', '0:00', '2026-12-31', '23:59', 'yes'), 'businessDays')).toBe('261');
    expect(getValue(run('2026-03-04', '9:00', '2026-03-26', '17:00', 'yes'), 'businessDays')).toBe('17');
  });

  it('the full supported range is instant and exact: 0001-01-01 -> 9999-12-31 has 2,608,615 weekdays', () => {
    const r = run('0001-01-01', '00:00', '9999-12-31', '23:59', 'yes');
    expect(getValue(r, 'businessDays')).toBe('2608615');
  });

  it('long spans: 340 hours is 2w 0d 4h (text example)', () => {
    const r = run('2026-01-01', '00:00', '2026-01-15', '04:00');
    expect(getValue(r, 'totalHours')).toBe('340.00');
    expect(getValue(r, 'weeksDaysHours')).toBe('2w 0d 4h');
    expect(getValue(r, 'daysHoursMinutes')).toBe('14d 4h 0m');
  });

  it('hidden _parts carries the numbers the panel needs (no string parsing)', () => {
    const r = run('2026-06-05', '10:00 PM', '2026-06-06', '4:30 AM');
    expect(JSON.parse(getValue(r, '_parts'))).toEqual({ days: 0, hours: 6, minutes: 30, totalHours: 6.5 });
  });

  it('the FAQ no longer promises optional seconds or the "Friday to Monday = 1 business day" example', () => {
    const faqs = JSON.stringify(config.educational.faqs);
    expect(faqs).not.toContain('seconds are optional');
    expect(faqs).not.toContain('only 1 business day');
    expect(faqs).toContain('2 business days');
  });
});
