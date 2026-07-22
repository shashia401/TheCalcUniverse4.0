import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/date';
import { getValue, parseNumber } from '../../helpers';

describe('date calculator', () => {
  it('add 0 days returns same date', () => {
    const r = config.calculate({
      startDate: '2025-01-01',
      action: 'add',
      years: '0',
      months: '0',
      weeks: '0',
      days: '0',
      businessDays: 'all',
    });
    expect(getValue(r, 'resultDate')).toBe('Jan 1, 2025');
  });

  it('add 7 days from Jan 1 2025 -> Jan 8 2025', () => {
    const r = config.calculate({
      startDate: '2025-01-01',
      action: 'add',
      years: '0',
      months: '0',
      weeks: '0',
      days: '7',
      businessDays: 'all',
    });
    expect(getValue(r, 'resultDate')).toBe('Jan 8, 2025');
  });

  it('subtract 7 days from Jan 15 2025 -> Jan 8 2025', () => {
    const r = config.calculate({
      startDate: '2025-01-15',
      action: 'subtract',
      years: '0',
      months: '0',
      weeks: '0',
      days: '7',
      businessDays: 'all',
    });
    expect(getValue(r, 'resultDate')).toBe('Jan 8, 2025');
  });

  it('add 1 month from Jan 15 2025 -> Feb 15 2025', () => {
    const r = config.calculate({
      startDate: '2025-01-15',
      action: 'add',
      years: '0',
      months: '1',
      weeks: '0',
      days: '0',
      businessDays: 'all',
    });
    expect(getValue(r, 'resultDate')).toBe('Feb 15, 2025');
  });

  it('add 5 business days from Monday Jan 6 2025 -> next Monday Jan 13 2025', () => {
    const r = config.calculate({
      startDate: '2025-01-06',
      action: 'add',
      years: '0',
      months: '0',
      weeks: '0',
      days: '5',
      businessDays: 'business',
    });
    expect(getValue(r, 'resultDate')).toBe('Jan 13, 2025');
    expect(getValue(r, 'dayOfWeek')).toBe('Monday');
  });

  it('add 5 business days from Friday -> next Friday (skip weekend)', () => {
    const r = config.calculate({
      startDate: '2025-01-03',
      action: 'add',
      years: '0',
      months: '0',
      weeks: '0',
      days: '5',
      businessDays: 'business',
    });
    expect(getValue(r, 'resultDate')).toBe('Jan 10, 2025');
    expect(getValue(r, 'dayOfWeek')).toBe('Friday');
  });

  it('invalid startDate returns empty', () => {
    const r = config.calculate({
      startDate: '',
      action: 'add',
      years: '0',
      months: '0',
      weeks: '0',
      days: '7',
      businessDays: 'all',
    });
    expect(r).toEqual([]);
  });

  it('malformed startDate returns empty', () => {
    const r = config.calculate({
      startDate: 'not-a-date',
      action: 'add',
      years: '0',
      months: '0',
      weeks: '0',
      days: '7',
      businessDays: 'all',
    });
    expect(r).toEqual([]);
  });

  it('subtract business days correctly', () => {
    const r = config.calculate({
      startDate: '2025-01-13',
      action: 'subtract',
      years: '0',
      months: '0',
      weeks: '0',
      days: '5',
      businessDays: 'business',
    });
    expect(getValue(r, 'resultDate')).toBe('Jan 6, 2025');
    expect(getValue(r, 'dayOfWeek')).toBe('Monday');
  });

  it('returns correct start date display', () => {
    const r = config.calculate({
      startDate: '2025-03-17',
      action: 'add',
      years: '0',
      months: '0',
      weeks: '1',
      days: '0',
      businessDays: 'all',
    });
    expect(getValue(r, 'startDate')).toBe('Mar 17, 2025');
    expect(getValue(r, 'resultDate')).toBe('Mar 24, 2025');
  });

  it('add using weeks field', () => {
    const r = config.calculate({
      startDate: '2025-01-01',
      action: 'add',
      years: '0',
      months: '0',
      weeks: '2',
      days: '0',
      businessDays: 'all',
    });
    expect(getValue(r, 'resultDate')).toBe('Jan 15, 2025');
  });

  it('has day of week in result', () => {
    const r = config.calculate({
      startDate: '2025-01-01',
      action: 'add',
      years: '0',
      months: '0',
      weeks: '0',
      days: '0',
      businessDays: 'all',
    });
    expect(getValue(r, 'dayOfWeek')).toBe('Wednesday');
  });

  // ── New tests ──

  it('handles leap year overflow: Feb 29, 2024 + 1 year = Mar 1, 2025', () => {
    const r = config.calculate({
      startDate: '2024-02-29',
      action: 'add',
      years: '1',
      months: '0',
      weeks: '0',
      days: '0',
      businessDays: 'all',
    });
    expect(getValue(r, 'resultDate')).toBe('Mar 1, 2025');
  });

  it('handles month-end overflow: Jan 31 + 1 month = Mar 3, 2025', () => {
    const r = config.calculate({
      startDate: '2025-01-31',
      action: 'add',
      years: '0',
      months: '1',
      weeks: '0',
      days: '0',
      businessDays: 'all',
    });
    expect(getValue(r, 'resultDate')).toBe('Mar 3, 2025');
  });

  it('cross-year date adds correctly: Dec 25, 2024 + 10 days = Jan 4, 2025', () => {
    const r = config.calculate({
      startDate: '2024-12-25',
      action: 'add',
      years: '0',
      months: '0',
      weeks: '0',
      days: '10',
      businessDays: 'all',
    });
    expect(getValue(r, 'resultDate')).toBe('Jan 4, 2025');
  });

  it('subtract across year boundary: Jan 5, 2025 - 10 days = Dec 26, 2024', () => {
    const r = config.calculate({
      startDate: '2025-01-05',
      action: 'subtract',
      years: '0',
      months: '0',
      weeks: '0',
      days: '10',
      businessDays: 'all',
    });
    expect(getValue(r, 'resultDate')).toBe('Dec 26, 2024');
  });

  it('combines years, months, and days: 2023-01-01 + 2y + 3m + 15d', () => {
    const r = config.calculate({
      startDate: '2023-01-01',
      action: 'add',
      years: '2',
      months: '3',
      weeks: '0',
      days: '15',
      businessDays: 'all',
    });
    expect(getValue(r, 'resultDate')).toBe('Apr 16, 2025');
  });

  it('subtracts years correctly', () => {
    const r = config.calculate({
      startDate: '2025-06-15',
      action: 'subtract',
      years: '3',
      months: '0',
      weeks: '0',
      days: '0',
      businessDays: 'all',
    });
    expect(getValue(r, 'resultDate')).toBe('Jun 15, 2022');
  });

  it('business days mode shows correct mode label', () => {
    const r = config.calculate({
      startDate: '2025-01-15',
      action: 'add',
      years: '0',
      months: '0',
      weeks: '0',
      days: '5',
      businessDays: 'business',
    });
    expect(getValue(r, 'mode')).toContain('Business Days');
  });

  it('all days mode shows correct mode label', () => {
    const r = config.calculate({
      startDate: '2025-01-15',
      action: 'add',
      years: '0',
      months: '0',
      weeks: '0',
      days: '5',
      businessDays: 'all',
    });
    expect(getValue(r, 'mode')).toBe('All Days');
  });

  it('add 40 weeks from a known date', () => {
    const r = config.calculate({
      startDate: '2024-10-15',
      action: 'add',
      years: '0',
      months: '0',
      weeks: '40',
      days: '0',
      businessDays: 'all',
    });
    expect(getValue(r, 'resultDate')).toBe('Jul 22, 2025');
  });

  it('handles future dates beyond current year', () => {
    const r = config.calculate({
      startDate: '2025-12-31',
      action: 'add',
      years: '5',
      months: '0',
      weeks: '0',
      days: '1',
      businessDays: 'all',
    });
    expect(getValue(r, 'resultDate')).toBe('Jan 1, 2031');
  });
});
