import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/time-card/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Time Card Calculator', () => {
  const standardWeek = [
    'Mon, 9:00, 17:00, 0:30',
    'Tue, 9:00, 17:00, 0:30',
    'Wed, 9:00, 17:00, 0:30',
    'Thu, 9:00, 17:00, 0:30',
    'Fri, 9:00, 17:00, 0:30',
  ].join('\n');

  const weekWithOvertime = [
    'Mon, 8:00, 18:00, 0:30',
    'Tue, 8:00, 18:00, 0:30',
    'Wed, 8:00, 18:00, 0:30',
    'Thu, 8:00, 18:00, 0:30',
    'Fri, 8:00, 18:00, 0:30',
    'Sat, 9:00, 13:00, 0:00',
  ].join('\n');

  describe('Standard 40-hour week', () => {
    it('calculates 37.5 hours for 9-5 with 30min breaks', () => {
      // Each day: (17:00 - 9:00 - 0:30) = 7.5 hours × 5 = 37.5
      const r = config.calculate({ entries: standardWeek, overtimeThreshold: '40' });
      near(parseNumber(getValue(r, 'totalHours')), 37.5);
      near(parseNumber(getValue(r, 'regularHours')), 37.5);
      near(parseNumber(getValue(r, 'overtimeHours')), 0);
    });

    it('all regular hours when below threshold', () => {
      const r = config.calculate({ entries: standardWeek, overtimeThreshold: '40' });
      near(parseNumber(getValue(r, 'regularHours')), 37.5);
      expect(parseNumber(getValue(r, 'overtimeHours'))).toBe(0);
    });
  });

  describe('Week with overtime', () => {
    it('calculates total hours correctly', () => {
      // M-F: (18:00 - 8:00 - 0:30) = 9.5 hours × 5 = 47.5
      // Sat: (13:00 - 9:00 - 0:00) = 4 hours
      // Total: 51.5
      const r = config.calculate({ entries: weekWithOvertime, overtimeThreshold: '40' });
      near(parseNumber(getValue(r, 'totalHours')), 51.5);
    });

    it('separates regular and overtime hours', () => {
      const r = config.calculate({ entries: weekWithOvertime, overtimeThreshold: '40' });
      near(parseNumber(getValue(r, 'regularHours')), 40);
      near(parseNumber(getValue(r, 'overtimeHours')), 11.5);
    });

    it('handles no overtime (straight time)', () => {
      const r = config.calculate({ entries: weekWithOvertime, overtimeThreshold: '0' });
      near(parseNumber(getValue(r, 'regularHours')), 51.5);
      expect(parseNumber(getValue(r, 'overtimeHours'))).toBe(0);
    });
  });

  describe('Overnight shift (crosses midnight)', () => {
    it('calculates overnight shift correctly', () => {
      // 22:00 to 06:00, no break = 8 hours
      const entries = 'Mon, 22:00, 06:00, 0:00';
      const r = config.calculate({ entries, overtimeThreshold: '40' });
      near(parseNumber(getValue(r, 'totalHours')), 8);
    });

    it('overnight shift with break', () => {
      // 22:00 to 08:00, 1:00 break = 9 hours
      const entries = 'Mon, 22:00, 08:00, 1:00';
      const r = config.calculate({ entries, overtimeThreshold: '40' });
      near(parseNumber(getValue(r, 'totalHours')), 9);
    });
  });

  describe('12-hour time parsing', () => {
    it('parses AM/PM times correctly', () => {
      const entries = 'Mon, 9:00 AM, 5:00 PM, 0:30';
      const r = config.calculate({ entries, overtimeThreshold: '40' });
      near(parseNumber(getValue(r, 'totalHours')), 7.5);
    });

    it('parses 12:00 PM as noon', () => {
      const entries = 'Mon, 12:00 PM, 5:00 PM, 0:00';
      const r = config.calculate({ entries, overtimeThreshold: '40' });
      near(parseNumber(getValue(r, 'totalHours')), 5);
    });

    it('parses 12:00 AM as midnight', () => {
      const entries = 'Mon, 12:00 AM, 8:00 AM, 0:00';
      const r = config.calculate({ entries, overtimeThreshold: '40' });
      near(parseNumber(getValue(r, 'totalHours')), 8);
    });

    it('handles lowercase am/pm', () => {
      const entries = 'Mon, 8:30 am, 5:30 pm, 1:00';
      const r = config.calculate({ entries, overtimeThreshold: '40' });
      near(parseNumber(getValue(r, 'totalHours')), 8);
    });

    it('handles 1:30 PM correctly', () => {
      const entries = 'Mon, 1:30 PM, 5:30 PM, 0:00';
      const r = config.calculate({ entries, overtimeThreshold: '40' });
      near(parseNumber(getValue(r, 'totalHours')), 4);
    });
  });

  describe('24-hour time parsing', () => {
    it('parses 24hr times correctly', () => {
      const entries = 'Mon, 08:30, 17:30, 1:00';
      const r = config.calculate({ entries, overtimeThreshold: '40' });
      near(parseNumber(getValue(r, 'totalHours')), 8);
    });

    it('handles evening shift in 24hr', () => {
      const entries = 'Mon, 14:00, 22:00, 0:30';
      const r = config.calculate({ entries, overtimeThreshold: '40' });
      near(parseNumber(getValue(r, 'totalHours')), 7.5);
    });
  });

  describe('Various break lengths', () => {
    it('no break', () => {
      const entries = 'Mon, 9:00, 17:00, 0:00';
      const r = config.calculate({ entries, overtimeThreshold: '40' });
      near(parseNumber(getValue(r, 'totalHours')), 8);
    });

    it('1-hour lunch break', () => {
      const entries = 'Mon, 9:00, 18:00, 1:00';
      const r = config.calculate({ entries, overtimeThreshold: '40' });
      near(parseNumber(getValue(r, 'totalHours')), 8);
    });

    it('short 15-min break', () => {
      const entries = 'Mon, 9:00, 17:00, 0:15';
      const r = config.calculate({ entries, overtimeThreshold: '40' });
      near(parseNumber(getValue(r, 'totalHours')), 7.75);
    });
  });

  describe('Pay calculation', () => {
    it('calculates pay at regular rate', () => {
      const r = config.calculate({
        entries: standardWeek,
        paySettings: 'enter',
        regularRate: '25',
        overtimeRate: '1.5',
        overtimeThreshold: '40',
      });
      // 37.5 hours × $25 = $937.50
      expect(parseNumber(getValue(r, 'totalPay'))).toBeCloseTo(937.5, 1);
    });

    it('calculates overtime pay correctly', () => {
      const r = config.calculate({
        entries: weekWithOvertime,
        paySettings: 'enter',
        regularRate: '20',
        overtimeRate: '1.5',
        overtimeThreshold: '40',
      });
      // 40 hours × $20 = $800
      // 11.5 hours × $20 × 1.5 = $345
      // Total: $1145
      near(parseNumber(getValue(r, 'regularPay')), 800);
      near(parseNumber(getValue(r, 'overtimePay')), 345);
      near(parseNumber(getValue(r, 'totalPay')), 1145);
    });

    it('shows no pay results when paySettings is skip', () => {
      const r = config.calculate({
        entries: standardWeek,
        paySettings: 'skip',
        overtimeThreshold: '40',
      });
      expect(r.find((x) => x.id === 'totalPay')).toBeUndefined();
      expect(r.find((x) => x.id === 'regularPay')).toBeUndefined();
      expect(r.find((x) => x.id === 'overtimePay')).toBeUndefined();
    });
  });

  describe('Week number', () => {
    it('formats week start date', () => {
      const r = config.calculate({ entries: 'Mon, 9:00, 17:00, 0:30', weekStart: '2024-03-04' });
      expect(getValue(r, 'weekNumber')).toContain('2024');
    });

    it('returns empty week number when no date given', () => {
      const r = config.calculate({ entries: 'Mon, 9:00, 17:00, 0:30' });
      expect(getValue(r, 'weekNumber')).toBe('');
    });
  });

  describe('Daily breakdown', () => {
    it('includes daily breakdown JSON', () => {
      const r = config.calculate({ entries: standardWeek, overtimeThreshold: '40' });
      const jsonStr = getValue(r, '_dailyBreakdown');
      const data = JSON.parse(jsonStr);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(5);
      expect(data[0]).toHaveProperty('dayLabel');
      expect(data[0]).toHaveProperty('hours');
    });
  });

  describe('Exactly 40 hours', () => {
    it('no overtime at exactly 40 hours', () => {
      // 5 days × 8 hours = 40 hours, no break
      const entries = [
        'Mon, 9:00, 17:00, 0:00',
        'Tue, 9:00, 17:00, 0:00',
        'Wed, 9:00, 17:00, 0:00',
        'Thu, 9:00, 17:00, 0:00',
        'Fri, 9:00, 17:00, 0:00',
      ].join('\n');
      const r = config.calculate({ entries, overtimeThreshold: '40' });
      near(parseNumber(getValue(r, 'totalHours')), 40);
      near(parseNumber(getValue(r, 'regularHours')), 40);
      expect(parseNumber(getValue(r, 'overtimeHours'))).toBe(0);
    });
  });

  describe('Below 40 hours', () => {
    it('all regular when below 40', () => {
      const entries = [
        'Mon, 10:00, 16:00, 0:30', // 5.5
        'Tue, 10:00, 16:00, 0:30', // 5.5
        'Wed, 10:00, 16:00, 0:30', // 5.5
      ].join('\n');
      const r = config.calculate({ entries, overtimeThreshold: '40' });
      near(parseNumber(getValue(r, 'totalHours')), 16.5);
      near(parseNumber(getValue(r, 'regularHours')), 16.5);
      expect(parseNumber(getValue(r, 'overtimeHours'))).toBe(0);
    });
  });

  describe('Single day entry', () => {
    it('handles single day', () => {
      const r = config.calculate({ entries: 'Mon, 9:00, 17:00, 0:30', overtimeThreshold: '40' });
      near(parseNumber(getValue(r, 'totalHours')), 7.5);
      near(parseNumber(getValue(r, 'regularHours')), 7.5);
    });
  });

  describe('Validation', () => {
    it('returns empty for missing entries', () => {
      const r = config.calculate({ entries: '', overtimeThreshold: '40' });
      expect(r).toEqual([]);
    });

    it('returns empty for whitespace-only entries', () => {
      const r = config.calculate({ entries: '   \n  \n  ', overtimeThreshold: '40' });
      expect(r).toEqual([]);
    });
  });
});
