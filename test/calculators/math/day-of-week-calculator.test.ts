import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/day-of-week';
import { getValue } from '../../helpers';

describe('day of week calculator', () => {
  it('2000-01-01 = Saturday', () => {
    const r = config.calculate({ month: '1', day: '1', year: '2000' });
    expect(getValue(r, 'dayOfWeek')).toBe('Saturday');
  });

  it('2024-12-25 = Wednesday', () => {
    const r = config.calculate({ month: '12', day: '25', year: '2024' });
    expect(getValue(r, 'dayOfWeek')).toBe('Wednesday');
  });

  it('1969-07-20 = Sunday (Apollo 11 moon landing)', () => {
    const r = config.calculate({ month: '7', day: '20', year: '1969' });
    expect(getValue(r, 'dayOfWeek')).toBe('Sunday');
  });

  it('2020-02-29 = Saturday (leap year Feb 29)', () => {
    const r = config.calculate({ month: '2', day: '29', year: '2020' });
    expect(getValue(r, 'dayOfWeek')).toBe('Saturday');
  });

  it('2024-01-01 = Monday (New Years Day 2024)', () => {
    const r = config.calculate({ month: '1', day: '1', year: '2024' });
    expect(getValue(r, 'dayOfWeek')).toBe('Monday');
  });

  it('1900-01-01 = Monday', () => {
    const r = config.calculate({ month: '1', day: '1', year: '1900' });
    expect(getValue(r, 'dayOfWeek')).toBe('Monday');
  });

  it('invalid month (13) returns empty array', () => {
    const r = config.calculate({ month: '13', day: '1', year: '2024' });
    expect(r).toEqual([]);
  });

  it('invalid day (32) returns empty array', () => {
    const r = config.calculate({ month: '1', day: '32', year: '2024' });
    expect(r).toEqual([]);
  });

  it('invalid date (Feb 30) returns empty array', () => {
    const r = config.calculate({ month: '2', day: '30', year: '2024' });
    expect(r).toEqual([]);
  });

  it('invalid date (April 31) returns empty array', () => {
    const r = config.calculate({ month: '4', day: '31', year: '2024' });
    expect(r).toEqual([]);
  });

  it('missing fields returns empty array', () => {
    const r = config.calculate({ month: '', day: '1', year: '2024' });
    expect(r).toEqual([]);
  });

  it('negative year returns empty array', () => {
    const r = config.calculate({ month: '1', day: '1', year: '-500' });
    expect(r).toEqual([]);
  });

  it('January 2000 boundary: 2000-01-01 to 2000-01-31', () => {
    // Saturday Jan 1
    const r1 = config.calculate({ month: '1', day: '1', year: '2000' });
    expect(getValue(r1, 'dayOfWeek')).toBe('Saturday');
    // Monday Jan 31
    const r2 = config.calculate({ month: '1', day: '31', year: '2000' });
    expect(getValue(r2, 'dayOfWeek')).toBe('Monday');
  });

  it('February leap year boundaries', () => {
    // 2000-02-28 = Monday
    const r1 = config.calculate({ month: '2', day: '28', year: '2000' });
    expect(getValue(r1, 'dayOfWeek')).toBe('Monday');
    // 2000-02-29 = Tuesday (leap day)
    const r2 = config.calculate({ month: '2', day: '29', year: '2000' });
    expect(getValue(r2, 'dayOfWeek')).toBe('Tuesday');
    // 2001-02-28 = Wednesday (non-leap year)
    const r3 = config.calculate({ month: '2', day: '28', year: '2001' });
    expect(getValue(r3, 'dayOfWeek')).toBe('Wednesday');
  });

  it('day 0 returns empty array', () => {
    const r = config.calculate({ month: '1', day: '0', year: '2024' });
    expect(r).toEqual([]);
  });

  it('formatted date is readable', () => {
    const r = config.calculate({ month: '7', day: '4', year: '1776' });
    expect(getValue(r, 'formattedDate')).toBe('Thursday, July 4, 1776');
  });

  it('Zeller breakdown contains expected terms', () => {
    const r = config.calculate({ month: '3', day: '14', year: '2024' });
    const breakdown = getValue(r, 'zellersBreakdown');
    expect(breakdown).toContain('q=');
    expect(breakdown).toContain('m=');
    expect(breakdown).toContain('K=');
    expect(breakdown).toContain('J=');
  });

  it('first day of month is correct', () => {
    const r = config.calculate({ month: '12', day: '25', year: '2024' });
    // Dec 1 2024 = Sunday
    expect(getValue(r, 'firstDayOfMonth')).toBe('Sunday');
  });
});
