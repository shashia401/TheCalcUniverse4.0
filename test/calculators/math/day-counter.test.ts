import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/day-counter';
import { getValue, parseNumber } from '../../helpers';

describe('day counter calculator', () => {
  it('simple date range: Jan 1 to Jan 15 = 14 days', () => {
    const r = config.calculate({
      startDate: '2024-01-01',
      endDate: '2024-01-15',
      includeEndDate: 'no',
      countBusinessDays: 'no',
    });
    expect(parseNumber(getValue(r, 'totalDays'))).toBe(14);
  });

  it('include end date: Jan 1 to Jan 15 = 15 days', () => {
    const r = config.calculate({
      startDate: '2024-01-01',
      endDate: '2024-01-15',
      includeEndDate: 'yes',
      countBusinessDays: 'no',
    });
    expect(parseNumber(getValue(r, 'totalDays'))).toBe(15);
  });

  it('same day, exclude end date = 0 days', () => {
    const r = config.calculate({
      startDate: '2024-01-15',
      endDate: '2024-01-15',
      includeEndDate: 'no',
      countBusinessDays: 'no',
    });
    expect(parseNumber(getValue(r, 'totalDays'))).toBe(0);
  });

  it('same day, include end date = 1 day', () => {
    const r = config.calculate({
      startDate: '2024-01-15',
      endDate: '2024-01-15',
      includeEndDate: 'yes',
      countBusinessDays: 'no',
    });
    expect(parseNumber(getValue(r, 'totalDays'))).toBe(1);
  });

  it('business days only: Mon-Fri week = 5 business days', () => {
    const r = config.calculate({
      startDate: '2024-01-22',
      endDate: '2024-01-26',
      includeEndDate: 'no',
      countBusinessDays: 'yes',
    });
    expect(parseNumber(getValue(r, 'businessDaysCount'))).toBe(5);
  });

  it('business days: Fri to Mon = 2 business days', () => {
    const r = config.calculate({
      startDate: '2024-01-19',
      endDate: '2024-01-22',
      includeEndDate: 'no',
      countBusinessDays: 'yes',
    });
    expect(parseNumber(getValue(r, 'businessDaysCount'))).toBe(2);
  });

  it('business days: 2 weeks = 10 business days', () => {
    const r = config.calculate({
      startDate: '2024-01-22',
      endDate: '2024-02-02',
      includeEndDate: 'no',
      countBusinessDays: 'yes',
    });
    expect(parseNumber(getValue(r, 'businessDaysCount'))).toBe(10);
  });

  it('full year 2024 (leap year) = 366 days (exclude end)', () => {
    const r = config.calculate({
      startDate: '2024-01-01',
      endDate: '2025-01-01',
      includeEndDate: 'no',
      countBusinessDays: 'no',
    });
    expect(parseNumber(getValue(r, 'totalDays'))).toBe(366);
  });

  it('full year 2024 includes end = 367 days', () => {
    const r = config.calculate({
      startDate: '2024-01-01',
      endDate: '2025-01-01',
      includeEndDate: 'yes',
      countBusinessDays: 'no',
    });
    expect(parseNumber(getValue(r, 'totalDays'))).toBe(367);
  });

  it('total weeks and hours are consistent', () => {
    const r = config.calculate({
      startDate: '2024-01-01',
      endDate: '2024-01-29',
      includeEndDate: 'no',
      countBusinessDays: 'no',
    });
    const days = parseNumber(getValue(r, 'totalDays'));
    expect(parseNumber(getValue(r, 'totalWeeks'))).toBe(Math.floor(days / 7));
    expect(parseNumber(getValue(r, 'totalHours'))).toBe(days * 24);
  });

  it('missing start date returns empty array', () => {
    const r = config.calculate({
      startDate: '',
      endDate: '2024-01-15',
      includeEndDate: 'no',
      countBusinessDays: 'no',
    });
    expect(r).toEqual([]);
  });

  it('invalid date returns empty array', () => {
    const r = config.calculate({
      startDate: 'not-a-date',
      endDate: '2024-01-15',
      includeEndDate: 'no',
      countBusinessDays: 'no',
    });
    expect(r).toEqual([]);
  });

  it('end date before start date returns empty array', () => {
    const r = config.calculate({
      startDate: '2024-06-01',
      endDate: '2024-01-01',
      includeEndDate: 'no',
      countBusinessDays: 'no',
    });
    expect(r).toEqual([]);
  });

  it('formatted breakdown is present', () => {
    const r = config.calculate({
      startDate: '2020-01-01',
      endDate: '2024-01-01',
      includeEndDate: 'no',
      countBusinessDays: 'no',
    });
    const breakdown = getValue(r, 'formattedBreakdown');
    expect(breakdown).toMatch(/\d+ years,/);
  });
});
