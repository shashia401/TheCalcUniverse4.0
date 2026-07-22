import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/working-days/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Working Days Calculator', () => {
  it('counts 5 working days in a Mon-Fri work week', () => {
    const results = config.calculate({
      startDate: '2024-04-01', // Monday
      endDate: '2024-04-05',   // Friday
      includeStart: 'both',
      holidays: 'no',
    });
    const working = parseNumber(getValue(results, 'workingDays'));
    near(working, 5);
    const calendar = parseNumber(getValue(results, 'calendarDays'));
    near(calendar, 5);
    const weekends = parseNumber(getValue(results, 'weekends'));
    near(weekends, 0);
  });

  it('counts weekends in a full week', () => {
    const results = config.calculate({
      startDate: '2024-04-01', // Monday
      endDate: '2024-04-07',   // Sunday
      includeStart: 'both',
      holidays: 'no',
    });
    const working = parseNumber(getValue(results, 'workingDays'));
    near(working, 5);
    const weekends = parseNumber(getValue(results, 'weekends'));
    near(weekends, 2);
    const calendar = parseNumber(getValue(results, 'calendarDays'));
    near(calendar, 7);
  });

  it('counts New Years Day as a holiday', () => {
    const results = config.calculate({
      startDate: '2024-01-01', // Monday (New Year's Day)
      endDate: '2024-01-05',   // Friday
      includeStart: 'both',
      holidays: 'yes',
    });
    // Jan 1 is a holiday, Jan 2-5 are working days
    const working = parseNumber(getValue(results, 'workingDays'));
    near(working, 4);
    expect(getValue(results, 'holidays')).toBe('1');
  });

  it('excludes start date when count method is "end"', () => {
    const results = config.calculate({
      startDate: '2024-04-01', // Monday
      endDate: '2024-04-05',   // Friday
      includeStart: 'end',
      holidays: 'no',
    });
    // Excludes Monday Apr 1, includes Apr 2-5 = 4 working days
    const working = parseNumber(getValue(results, 'workingDays'));
    near(working, 4);
  });

  it('returns empty for missing dates', () => {
    const results = config.calculate({
      startDate: '',
      endDate: '',
      includeStart: 'both',
      holidays: 'no',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for invalid date format', () => {
    const results = config.calculate({
      startDate: '01-01-2024',
      endDate: '01-05-2024',
      includeStart: 'both',
      holidays: 'no',
    });
    expect(results).toEqual([]);
  });

  it('returns empty when end date is before start date', () => {
    const results = config.calculate({
      startDate: '2024-04-10',
      endDate: '2024-04-05',
      includeStart: 'both',
      holidays: 'no',
    });
    expect(results).toEqual([]);
  });

  it('counts Juneteenth as a holiday', () => {
    const results = config.calculate({
      startDate: '2024-06-17', // Monday
      endDate: '2024-06-21',   // Friday
      includeStart: 'both',
      holidays: 'yes',
    });
    // Jun 19 (Wednesday) is Juneteenth — a holiday
    // Mon, Tue, Thu, Fri = 4 working days
    const working = parseNumber(getValue(results, 'workingDays'));
    near(working, 4);
    expect(getValue(results, 'holidays')).toBe('1');
  });

  it('counts Christmas Day as a holiday', () => {
    const results = config.calculate({
      startDate: '2024-12-23', // Monday
      endDate: '2024-12-27',   // Friday
      includeStart: 'both',
      holidays: 'yes',
    });
    // Dec 25 (Wednesday) is Christmas — a holiday
    // Mon, Tue, Thu, Fri = 4 working days
    const working = parseNumber(getValue(results, 'workingDays'));
    near(working, 4);
    expect(getValue(results, 'holidays')).toBe('1');
  });

  it('excludes both start and end dates when count method is "neither"', () => {
    const results = config.calculate({
      startDate: '2024-04-01', // Monday
      endDate: '2024-04-05',   // Friday
      includeStart: 'neither',
      holidays: 'no',
    });
    // Excludes Mon Apr 1 and Fri Apr 5, includes Apr 2-4 = 3 working days
    const working = parseNumber(getValue(results, 'workingDays'));
    near(working, 3);
  });

  it('holidays show as "Not counted" when holiday exclusion is disabled', () => {
    const results = config.calculate({
      startDate: '2024-07-01', // Monday
      endDate: '2024-07-05',   // Friday
      includeStart: 'both',
      holidays: 'no',
    });
    // Jul 4 is Independence Day, but holidays disabled
    const working = parseNumber(getValue(results, 'workingDays'));
    near(working, 5); // All 5 days are counted as working
    expect(getValue(results, 'holidays')).toBe('Not counted');
  });
});
