import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/date/index';
import { getValue } from '../../helpers';

// Reference: Python dateutil.relativedelta (month-end clamping) and numpy.busday_offset (business days).
const run = (startDate: string, o: Partial<Record<'action' | 'years' | 'months' | 'weeks' | 'days' | 'businessDays', string>> = {}) =>
  config.calculate({ startDate, action: 'add', years: '0', months: '0', weeks: '0', days: '0', businessDays: 'all', ...o });
const date = (r: ReturnType<typeof run>) => getValue(r, 'resultDate');

describe('date: month-end clamping (audit)', () => {
  it('matches dateutil: Jan 31 + 1 month = Feb 28; + 2 months = Mar 31; Mar 31 2024 - 1 month = Feb 29', () => {
    expect(date(run('2025-01-31', { months: '1' }))).toBe('Feb 28, 2025');
    expect(date(run('2025-01-31', { months: '2' }))).toBe('Mar 31, 2025');
    expect(date(run('2024-03-31', { action: 'subtract', months: '1' }))).toBe('Feb 29, 2024');
  });
  it('Feb 29 + 1 year = Feb 28; + 4 years = Feb 29 2028', () => {
    expect(date(run('2024-02-29', { years: '1' }))).toBe('Feb 28, 2025');
    expect(date(run('2024-02-29', { years: '4' }))).toBe('Feb 29, 2028');
    expect(date(run('1900-02-28', { years: '4' }))).toBe('Feb 28, 1904');
  });
  it('years/months first, then days: 2025-01-31 + 1y 1m 3d = Mar 3, 2026 (dateutil)', () => {
    expect(date(run('2025-01-31', { years: '1', months: '1', days: '3' }))).toBe('Mar 3, 2026');
  });
  it('tells the user when the date was moved, and reports the real elapsed days', () => {
    const r = run('2025-01-31', { months: '1' });
    expect(getValue(r, 'monthEndNote')).toMatch(/Jan 31 does not exist in Feb 2025/);
    expect(getValue(r, 'daysAdded')).toBe('28'); // the old value was the made-up 30 * months
    expect(run('2025-01-15', { months: '1' }).find((x) => x.id === 'monthEndNote')).toBeUndefined();
  });
  it('1900 is not a leap year, 2000 is', () => {
    expect(date(run('1900-01-31', { months: '1' }))).toBe('Feb 28, 1900');
    expect(date(run('2000-01-31', { months: '1' }))).toBe('Feb 29, 2000');
  });
});

describe('date: business days (audit)', () => {
  it('weeks count 5 business days each (the old code added 7 business days per week)', () => {
    // numpy.busday_offset('2025-03-03', 10) = 2025-03-17
    expect(date(run('2025-03-03', { weeks: '2', businessDays: 'business' }))).toBe('Mar 17, 2025');
    expect(date(run('2025-03-03', { days: '10', businessDays: 'business' }))).toBe('Mar 17, 2025');
  });
  it('weekend starts count from the neighbouring weekday', () => {
    expect(date(run('2025-03-08', { days: '1', businessDays: 'business' }))).toBe('Mar 10, 2025'); // Saturday + 1 = Monday
    expect(date(run('2025-03-08', { days: '5', businessDays: 'business' }))).toBe('Mar 14, 2025'); // Saturday + 5 = Friday
    expect(date(run('2025-03-09', { action: 'subtract', days: '1', businessDays: 'business' }))).toBe('Mar 7, 2025'); // Sunday - 1 = Friday
    expect(date(run('2025-03-10', { action: 'subtract', days: '1', businessDays: 'business' }))).toBe('Mar 7, 2025');
    expect(date(run('2025-03-07', { action: 'subtract', days: '5', businessDays: 'business' }))).toBe('Feb 28, 2025');
    expect(date(run('2025-03-08', { days: '0', businessDays: 'business' }))).toBe('Mar 8, 2025');
  });
  it('huge counts return instantly (the old loop was O(n)) and land on a weekday', () => {
    const t = Date.now();
    const r = run('2025-03-04', { days: '1000000', businessDays: 'business' }); // numpy: 5858-03-30
    expect(date(r)).toBe('Mar 30, 5858');
    expect(getValue(r, 'dayOfWeek')).not.toMatch(/Saturday|Sunday/);
    expect(Date.now() - t).toBeLessThan(500);
  });
  it('years and months remain calendar units in business mode', () => {
    expect(date(run('2025-01-31', { months: '1', days: '1', businessDays: 'business' }))).toBe('Mar 3, 2025'); // Fri Feb 28 + 1 business day
  });
});

describe('date: validation and bounds (audit)', () => {
  it('rejects impossible dates and non-integer counts', () => {
    expect(run('2025-02-31')).toEqual([]);
    expect(run('2025-2-3')).toEqual([]);
    expect(run('2025-01-01', { days: '1.5' })[0].id).toBe('error'); // parseInt used to truncate to 1
    expect(run('2025-01-01', { days: '-1' })[0].id).toBe('error');
  });
  it('results outside years 100-9999 are refused instead of printing "Invalid Date"', () => {
    expect(run('9999-12-31', { days: '1' })[0].id).toBe('error');
    expect(run('0100-01-01', { years: '1', action: 'subtract' })[0].id).toBe('error');
    expect(run('2025-01-01', { years: '99999' })[0].id).toBe('error');
    expect(date(run('9999-12-30', { days: '1' }))).toBe('Dec 31, 9999');
  });
  it('is independent of the time zone / DST: days cross the US spring-forward and fall-back', () => {
    expect(date(run('2025-03-08', { days: '1' }))).toBe('Mar 9, 2025');
    expect(date(run('2025-03-09', { days: '1' }))).toBe('Mar 10, 2025');
    expect(date(run('2025-11-01', { days: '1' }))).toBe('Nov 2, 2025');
  });
  it('declares the input limits', () => {
    expect(config.inputs.find((i) => i.id === 'years')!.max).toBe(9999);
    expect(config.inputs.find((i) => i.id === 'days')!.max).toBe(3652425);
  });
});
