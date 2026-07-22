import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/time-card/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Time Card Calculator', () => {
  it('calculates total hours from daily entries', () => {
    const results = config.calculate({
      weekStart: '',
      paySettings: 'skip',
      regularRate: '',
      overtimeRate: '1.5',
      entries: 'Mon, 9:00, 17:00, 0:30\nTue, 9:00, 17:00, 0:30',
      overtimeThreshold: '40',
    });
    const total = parseNumber(getValue(results, 'totalHours'));
    near(total, 15); // 7.5 + 7.5 = 15
    near(parseNumber(getValue(results, 'regularHours')), 15);
    near(parseNumber(getValue(results, 'overtimeHours')), 0);
  });

  it('calculates overtime when hours exceed threshold', () => {
    const results = config.calculate({
      weekStart: '',
      paySettings: 'skip',
      regularRate: '',
      overtimeRate: '1.5',
      entries: 'Mon, 9:00, 18:00, 0:00\nTue, 9:00, 18:00, 0:00\nWed, 9:00, 18:00, 0:00\nThu, 9:00, 18:00, 0:00\nFri, 9:00, 18:00, 0:00',
      overtimeThreshold: '40',
    });
    near(parseNumber(getValue(results, 'totalHours')), 45);
    near(parseNumber(getValue(results, 'regularHours')), 40);
    near(parseNumber(getValue(results, 'overtimeHours')), 5);
  });

  it('handles 12-hour time with AM/PM', () => {
    const results = config.calculate({
      weekStart: '',
      paySettings: 'skip',
      regularRate: '',
      overtimeRate: '1.5',
      entries: 'Mon, 9:00 AM, 5:00 PM, 0:00',
      overtimeThreshold: '40',
    });
    near(parseNumber(getValue(results, 'totalHours')), 8);
  });

  it('handles overnight shifts crossing midnight', () => {
    const results = config.calculate({
      weekStart: '',
      paySettings: 'skip',
      regularRate: '',
      overtimeRate: '1.5',
      entries: 'Mon, 22:00, 06:00, 0:30',
      overtimeThreshold: '40',
    });
    // 22:00 to 06:00 = 8 hours, minus 0:30 break = 7.5 hours
    near(parseNumber(getValue(results, 'totalHours')), 7.5);
  });

  it('calculates gross pay with overtime', () => {
    const results = config.calculate({
      weekStart: '',
      paySettings: 'enter',
      regularRate: '20',
      overtimeRate: '1.5',
      entries: 'Mon, 9:00, 18:00, 0:00\nTue, 9:00, 18:00, 0:00\nWed, 9:00, 18:00, 0:00\nThu, 9:00, 18:00, 0:00\nFri, 9:00, 18:00, 0:00',
      overtimeThreshold: '40',
    });
    // 45 hours total. 40 regular × $20 = $800. 5 overtime × $20 × 1.5 = $150. Total = $950.
    expect(getValue(results, 'totalPay')).toContain('950');
    expect(getValue(results, 'regularPay')).toContain('800');
    expect(getValue(results, 'overtimePay')).toContain('150');
  });

  it('calculates hours only when pay settings is skip', () => {
    const results = config.calculate({
      weekStart: '',
      paySettings: 'skip',
      regularRate: '',
      overtimeRate: '1.5',
      entries: 'Mon, 9:00, 17:00, 0:00',
      overtimeThreshold: '40',
    });
    // Should NOT have pay results
    const payResult = results.find(r => r.id === 'totalPay');
    expect(payResult).toBeUndefined();
    near(parseNumber(getValue(results, 'totalHours')), 8);
  });

  it('returns empty array for no entries', () => {
    const results = config.calculate({
      weekStart: '',
      paySettings: 'skip',
      regularRate: '',
      overtimeRate: '1.5',
      entries: '',
      overtimeThreshold: '40',
    });
    expect(results).toEqual([]);
  });

  it('returns empty array for empty entries with only whitespace', () => {
    const results = config.calculate({
      weekStart: '',
      paySettings: 'skip',
      regularRate: '',
      overtimeRate: '1.5',
      entries: '   \n  ',
      overtimeThreshold: '40',
    });
    expect(results).toEqual([]);
  });

  it('handles 24-hour time format', () => {
    const results = config.calculate({
      weekStart: '',
      paySettings: 'skip',
      regularRate: '',
      overtimeRate: '1.5',
      entries: 'Mon, 09:00, 17:30, 00:30',
      overtimeThreshold: '40',
    });
    near(parseNumber(getValue(results, 'totalHours')), 8);
  });
});
