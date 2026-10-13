import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/day-counter/index';
import { getValue } from '../../helpers';

// Reference: Python datetime / dateutil.relativedelta / numpy.busday_count (which counts the half-open range [start, end)).
const run = (startDate: string, endDate: string, includeEndDate = 'no', countBusinessDays = 'no') =>
  config.calculate({ startDate, endDate, includeEndDate, countBusinessDays });

describe('day-counter (audit)', () => {
  it('is DST-proof: 2026-03-01 to 2026-03-30 is 29 days (a local-midnight difference across spring-forward floored to 28)', () => {
    expect(getValue(run('2026-03-01', '2026-03-30'), 'totalDays')).toBe('29');
    expect(getValue(run('2026-10-01', '2026-11-02'), 'totalDays')).toBe('32'); // spans the US fall-back
    expect(getValue(run('2024-03-01', '2024-04-01'), 'totalDays')).toBe('31');
  });
  it('breakdown uses real months: 2024-01-01 -> 2025-01-01 is exactly 1 year (the 365/30 approximation said 1 year, 0 months, 1 day)', () => {
    expect(getValue(run('2024-01-01', '2025-01-01'), 'formattedBreakdown')).toBe('1 year, 0 months, 0 days');
    // dateutil: relativedelta(2026-10-15, 2026-05-18) = 4 months, 27 days; (2024-03-01, 2024-01-31) = 1 month, 1 day
    expect(getValue(run('2026-05-18', '2026-10-15'), 'formattedBreakdown')).toBe('0 years, 4 months, 27 days');
    expect(getValue(run('2024-01-31', '2024-03-01'), 'formattedBreakdown')).toBe('0 years, 1 month, 1 day');
    expect(getValue(run('2020-01-01', '2024-01-01'), 'formattedBreakdown')).toBe('4 years, 0 months, 0 days');
  });
  it('include-end shifts the breakdown too: 2025-01-01 .. 2025-01-31 inclusive is 31 days = 1 month, 0 days', () => {
    const r = run('2025-01-01', '2025-01-31', 'yes');
    expect(getValue(r, 'totalDays')).toBe('31');
    expect(getValue(r, 'formattedBreakdown')).toBe('0 years, 1 month, 0 days');
  });
  it('business days follow the same range as the day total (numpy.busday_count is half-open)', () => {
    // Mon 2024-01-22 .. Fri 2024-01-26: 4 weekdays before the end date, 5 with the end date included
    expect(getValue(run('2024-01-22', '2024-01-26', 'no', 'yes'), 'businessDaysCount')).toBe('4');
    expect(getValue(run('2024-01-22', '2024-01-26', 'yes', 'yes'), 'businessDaysCount')).toBe('5');
    expect(getValue(run('2024-01-19', '2024-01-22', 'no', 'yes'), 'businessDaysCount')).toBe('1'); // Fri only
    expect(getValue(run('2024-04-01', '2024-04-30', 'no', 'yes'), 'businessDaysCount')).toBe('21');
    expect(getValue(run('2026-03-02', '2026-03-27', 'yes', 'yes'), 'businessDaysCount')).toBe('20'); // worked example: 4 work weeks
  });
  it('business days on weekend-only ranges and one-day ranges', () => {
    expect(getValue(run('2025-03-08', '2025-03-10', 'no', 'yes'), 'businessDaysCount')).toBe('0'); // Sat, Sun
    expect(getValue(run('2025-03-10', '2025-03-10', 'yes', 'yes'), 'businessDaysCount')).toBe('1');
    expect(getValue(run('2025-03-10', '2025-03-10', 'no', 'yes'), 'businessDaysCount')).toBe('0');
  });
  it('closed-form business days agree with a day-by-day count over ten years of start/end pairs', () => {
    const isWeekday = (d: Date) => d.getDay() !== 0 && d.getDay() !== 6;
    let seed = 7;
    const rnd = (n: number) => (seed = (seed * 1103515245 + 12345) % 2147483648) % n;
    for (let i = 0; i < 200; i++) {
      const a = new Date(2020, 0, 1 + rnd(3650));
      const b = new Date(a.getFullYear(), a.getMonth(), a.getDate() + rnd(900));
      let brute = 0;
      for (let d = new Date(a); d < b; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) if (isWeekday(d)) brute++;
      const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      expect(getValue(run(iso(a), iso(b), 'no', 'yes'), 'businessDaysCount')).toBe(String(brute));
    }
  });
  it('rejects impossible calendar dates instead of rolling over (new Date("2025-02-30") became 2 March)', () => {
    expect(run('2025-02-30', '2025-03-05')).toEqual([]);
    expect(run('2025-02-01', '2025-04-31')).toEqual([]);
  });
  it('end before start is explained', () => {
    const r = run('2025-03-05', '2025-03-01');
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe('error');
  });
  it('weeks, hours and minutes are exact multiples of the day total', () => {
    const r = run('2024-01-01', '2024-01-30'); // 29 days
    expect(getValue(r, 'totalWeeks')).toBe('4');
    expect(getValue(r, 'totalHours')).toBe(String(29 * 24));
    expect(getValue(r, 'totalMinutes')).toBe(String(29 * 1440));
  });
});
