import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/time-duration';
import { getValue, parseNumber } from '../../helpers';

describe('time duration calculator', () => {
  // ── Basic same-day calculations ──────────────────────────────────────────
  it('same day: 9 AM to 5 PM = 8 hours', () => {
    const r = config.calculate({
      startDate: '2025-01-15',
      startTime: '9:00 AM',
      endDate: '2025-01-15',
      endTime: '5:00 PM',
      businessDays: 'no',
    });
    expect(parseNumber(getValue(r, 'totalHours'))).toBe(8);
    expect(getValue(r, 'totalMinutes')).toBe('480');
    expect(getValue(r, 'totalSeconds')).toBe('28800');
    expect(getValue(r, 'daysHoursMinutes')).toBe('0d 8h 0m');
  });

  it('same day with minutes: 10:15 AM to 2:45 PM = 4.5h', () => {
    const r = config.calculate({
      startDate: '2025-01-15',
      startTime: '10:15 AM',
      endDate: '2025-01-15',
      endTime: '2:45 PM',
      businessDays: 'no',
    });
    expect(parseNumber(getValue(r, 'totalHours'))).toBe(4.5);
    expect(getValue(r, 'totalMinutes')).toBe('270');
  });

  // ── Overnight / multi-day ────────────────────────────────────────────────
  it('overnight: 11 PM to 7 AM next day = 8h', () => {
    const r = config.calculate({
      startDate: '2025-01-15',
      startTime: '11:00 PM',
      endDate: '2025-01-16',
      endTime: '7:00 AM',
      businessDays: 'no',
    });
    expect(parseNumber(getValue(r, 'totalHours'))).toBe(8);
    expect(getValue(r, 'daysHoursMinutes')).toBe('0d 8h 0m');
  });

  it('multi-day: Jan 1 9AM to Jan 3 5PM = 56h', () => {
    const r = config.calculate({
      startDate: '2025-01-01',
      startTime: '9:00 AM',
      endDate: '2025-01-03',
      endTime: '5:00 PM',
      businessDays: 'no',
    });
    expect(parseNumber(getValue(r, 'totalHours'))).toBe(56);
    expect(getValue(r, 'totalMinutes')).toBe('3360');
    expect(getValue(r, 'daysHoursMinutes')).toBe('2d 8h 0m');
  });

  // ── 24-hour format ───────────────────────────────────────────────────────
  it('24h format: 09:00 to 17:00 = 8h', () => {
    const r = config.calculate({
      startDate: '2025-03-10',
      startTime: '09:00',
      endDate: '2025-03-10',
      endTime: '17:00',
      businessDays: 'no',
    });
    expect(parseNumber(getValue(r, 'totalHours'))).toBe(8);
    expect(getValue(r, 'totalMinutes')).toBe('480');
  });

  it('24h format: 14:30 to 22:45 = 8.25h', () => {
    const r = config.calculate({
      startDate: '2025-01-15',
      startTime: '14:30',
      endDate: '2025-01-15',
      endTime: '22:45',
      businessDays: 'no',
    });
    expect(parseNumber(getValue(r, 'totalHours'))).toBe(8.25);
    expect(getValue(r, 'totalMinutes')).toBe('495');
  });

  // ── 12h format without minutes ──────────────────────────────────────────
  it('12h format without minutes: 9 AM to 5 PM', () => {
    const r = config.calculate({
      startDate: '2025-06-01',
      startTime: '9 AM',
      endDate: '2025-06-01',
      endTime: '5 PM',
      businessDays: 'no',
    });
    expect(parseNumber(getValue(r, 'totalHours'))).toBe(8);
  });

  // ── AM/PM edge cases ────────────────────────────────────────────────────
  it('12 AM (midnight) handled correctly', () => {
    const r = config.calculate({
      startDate: '2025-04-10',
      startTime: '12:00 AM',
      endDate: '2025-04-10',
      endTime: '1:00 AM',
      businessDays: 'no',
    });
    expect(getValue(r, 'totalMinutes')).toBe('60');
  });

  it('12 PM (noon) handled correctly', () => {
    const r = config.calculate({
      startDate: '2025-04-10',
      startTime: '12:00 PM',
      endDate: '2025-04-10',
      endTime: '1:00 PM',
      businessDays: 'no',
    });
    expect(getValue(r, 'totalMinutes')).toBe('60');
  });

  it('1 PM = 13:00 equivalent', () => {
    const r = config.calculate({
      startDate: '2025-04-10',
      startTime: '1:00 PM',
      endDate: '2025-04-10',
      endTime: '2:00 PM',
      businessDays: 'no',
    });
    expect(getValue(r, 'totalMinutes')).toBe('60');
  });

  // ── Business days mode ──────────────────────────────────────────────────
  it('business days mode off shows All Days', () => {
    const r = config.calculate({
      startDate: '2025-01-01',
      startTime: '9:00 AM',
      endDate: '2025-01-03',
      endTime: '5:00 PM',
      businessDays: 'no',
    });
    expect(getValue(r, 'businessMode')).toBe('All Days');
  });

  it('business days: Mon-Fri = 5 business days', () => {
    const r = config.calculate({
      startDate: '2025-01-06',
      startTime: '9:00 AM',
      endDate: '2025-01-10',
      endTime: '5:00 PM',
      businessDays: 'yes',
    });
    expect(getValue(r, 'businessDays')).toBe('5');
    expect(getValue(r, 'businessMode')).toBe('Business Days');
  });

  it('business days: Fri to Mon = 2 (Fri + Mon)', () => {
    const r = config.calculate({
      startDate: '2025-01-10',
      startTime: '9:00 AM',
      endDate: '2025-01-13',
      endTime: '5:00 PM',
      businessDays: 'yes',
    });
    expect(getValue(r, 'businessDays')).toBe('2');
  });

  it('business days: Mon-Fri with times, hours still correct', () => {
    const r = config.calculate({
      startDate: '2025-03-03',
      startTime: '9:00 AM',
      endDate: '2025-03-07',
      endTime: '5:00 PM',
      businessDays: 'yes',
    });
    expect(getValue(r, 'businessDays')).toBe('5');
    expect(parseNumber(getValue(r, 'totalHours'))).toBe(104);
  });

  // ── Weeks format ─────────────────────────────────────────────────────────
  it('weeks format: 7 days = 1w 0d', () => {
    const r = config.calculate({
      startDate: '2025-01-06',
      startTime: '9:00 AM',
      endDate: '2025-01-13',
      endTime: '9:00 AM',
      businessDays: 'no',
    });
    expect(getValue(r, 'weeksDaysHours')).toBe('1w 0d 0h');
  });

  it('weeks format: 10 days = 1w 3d', () => {
    const r = config.calculate({
      startDate: '2025-01-01',
      startTime: '12:00 PM',
      endDate: '2025-01-11',
      endTime: '12:00 PM',
      businessDays: 'no',
    });
    expect(getValue(r, 'weeksDaysHours')).toBe('1w 3d 0h');
  });

  it('weeks format: 14 days = 2w 0d', () => {
    const r = config.calculate({
      startDate: '2025-01-01',
      startTime: '12:00 AM',
      endDate: '2025-01-15',
      endTime: '12:00 AM',
      businessDays: 'no',
    });
    expect(getValue(r, 'weeksDaysHours')).toBe('2w 0d 0h');
  });

  // ── Total seconds ───────────────────────────────────────────────────────
  it('total seconds: 1 hour = 3600s', () => {
    const r = config.calculate({
      startDate: '2025-01-15',
      startTime: '9:00 AM',
      endDate: '2025-01-15',
      endTime: '10:00 AM',
      businessDays: 'no',
    });
    expect(getValue(r, 'totalSeconds')).toBe('3600');
  });

  it('total minutes = seconds / 60 consistency', () => {
    const r = config.calculate({
      startDate: '2025-05-01',
      startTime: '8:30 AM',
      endDate: '2025-05-01',
      endTime: '4:45 PM',
      businessDays: 'no',
    });
    const seconds = parseNumber(getValue(r, 'totalSeconds'));
    const minutes = parseNumber(getValue(r, 'totalMinutes'));
    expect(minutes).toBe(Math.floor(seconds / 60));
  });

  it('total hours = minutes / 60 consistency', () => {
    const r = config.calculate({
      startDate: '2025-05-01',
      startTime: '8:30 AM',
      endDate: '2025-05-01',
      endTime: '4:45 PM',
      businessDays: 'no',
    });
    const minutes = parseNumber(getValue(r, 'totalMinutes'));
    const hours = parseNumber(getValue(r, 'totalHours'));
    expect(hours).toBe(minutes / 60);
  });

  // ── Insufficient / missing inputs → empty array ─────────────────────────
  it('missing startDate returns []', () => {
    expect(config.calculate({
      startDate: '', startTime: '9:00 AM',
      endDate: '2025-01-15', endTime: '5:00 PM', businessDays: 'no',
    })).toEqual([]);
  });

  it('missing endDate returns []', () => {
    expect(config.calculate({
      startDate: '2025-01-01', startTime: '9:00 AM',
      endDate: '', endTime: '5:00 PM', businessDays: 'no',
    })).toEqual([]);
  });

  it('missing startTime returns []', () => {
    expect(config.calculate({
      startDate: '2025-01-01', startTime: '',
      endDate: '2025-01-15', endTime: '5:00 PM', businessDays: 'no',
    })).toEqual([]);
  });

  it('missing endTime returns []', () => {
    expect(config.calculate({
      startDate: '2025-01-01', startTime: '9:00 AM',
      endDate: '2025-01-15', endTime: '', businessDays: 'no',
    })).toEqual([]);
  });

  it('all required fields missing returns []', () => {
    expect(config.calculate({
      startDate: '', startTime: '',
      endDate: '', endTime: '', businessDays: 'no',
    })).toEqual([]);
  });

  // ── Invalid inputs → empty array ────────────────────────────────────────
  it('invalid startDate returns []', () => {
    expect(config.calculate({
      startDate: 'not-a-date', startTime: '9:00 AM',
      endDate: '2025-01-15', endTime: '5:00 PM', businessDays: 'no',
    })).toEqual([]);
  });

  it('invalid endDate returns []', () => {
    expect(config.calculate({
      startDate: '2025-01-01', startTime: '9:00 AM',
      endDate: 'garbage', endTime: '5:00 PM', businessDays: 'no',
    })).toEqual([]);
  });

  it('invalid startTime returns []', () => {
    expect(config.calculate({
      startDate: '2025-01-01', startTime: 'not-a-time',
      endDate: '2025-01-15', endTime: '5:00 PM', businessDays: 'no',
    })).toEqual([]);
  });

  it('invalid endTime returns []', () => {
    expect(config.calculate({
      startDate: '2025-01-01', startTime: '9:00 AM',
      endDate: '2025-01-15', endTime: 'xyz', businessDays: 'no',
    })).toEqual([]);
  });

  it('hours out of range in 24h format returns []', () => {
    expect(config.calculate({
      startDate: '2025-01-01', startTime: '25:00',
      endDate: '2025-01-15', endTime: '5:00 PM', businessDays: 'no',
    })).toEqual([]);
  });

  it('minutes out of range returns []', () => {
    expect(config.calculate({
      startDate: '2025-01-01', startTime: '10:60',
      endDate: '2025-01-15', endTime: '5:00 PM', businessDays: 'no',
    })).toEqual([]);
  });

  // ── Invalid range: end before start ─────────────────────────────────────
  it('end date before start date returns []', () => {
    expect(config.calculate({
      startDate: '2025-06-01', startTime: '9:00 AM',
      endDate: '2025-01-01', endTime: '5:00 PM', businessDays: 'no',
    })).toEqual([]);
  });

  it('same date, end time before start time returns []', () => {
    expect(config.calculate({
      startDate: '2025-01-15', startTime: '5:00 PM',
      endDate: '2025-01-15', endTime: '9:00 AM', businessDays: 'no',
    })).toEqual([]);
  });

  // ── Date-time display ───────────────────────────────────────────────────
  it('startDateTime and endDateTime are displayed', () => {
    const r = config.calculate({
      startDate: '2025-07-04', startTime: '10:00 AM',
      endDate: '2025-07-04', endTime: '2:00 PM', businessDays: 'no',
    });
    expect(getValue(r, 'startDateTime')).toBe('2025-07-04 10:00 AM');
    expect(getValue(r, 'endDateTime')).toBe('2025-07-04 2:00 PM');
  });

  // ── Month boundary crossing ─────────────────────────────────────────────
  it('crosses month boundary correctly', () => {
    const r = config.calculate({
      startDate: '2025-01-30', startTime: '12:00 PM',
      endDate: '2025-02-02', endTime: '12:00 PM', businessDays: 'no',
    });
    expect(parseNumber(getValue(r, 'totalHours'))).toBe(72);
    expect(getValue(r, 'daysHoursMinutes')).toBe('3d 0h 0m');
  });

  // ── Full year ────────────────────────────────────────────────────────────
  it('full year (2025) = 525600 minutes', () => {
    const r = config.calculate({
      startDate: '2025-01-01', startTime: '12:00 AM',
      endDate: '2026-01-01', endTime: '12:00 AM', businessDays: 'no',
    });
    expect(getValue(r, 'totalMinutes')).toBe('525600');
    expect(parseNumber(getValue(r, 'totalHours'))).toBe(8760);
  });

  // ── Zero duration ───────────────────────────────────────────────────────
  it('zero duration (same start and end) returns 0', () => {
    const r = config.calculate({
      startDate: '2025-01-15', startTime: '12:00 PM',
      endDate: '2025-01-15', endTime: '12:00 PM', businessDays: 'no',
    });
    expect(getValue(r, 'totalMinutes')).toBe('0');
    expect(getValue(r, 'totalHours')).toBe('0.00');
    expect(getValue(r, 'daysHoursMinutes')).toBe('0d 0h 0m');
  });

  // ── Full week ───────────────────────────────────────────────────────────
  it('full week: Mon 9AM to next Mon 9AM = 168h', () => {
    const r = config.calculate({
      startDate: '2025-01-06', startTime: '9:00 AM',
      endDate: '2025-01-13', endTime: '9:00 AM', businessDays: 'no',
    });
    expect(parseNumber(getValue(r, 'totalHours'))).toBe(168);
    expect(getValue(r, 'weeksDaysHours')).toBe('1w 0d 0h');
  });

  // ── Business days: zero if range only covers weekend ────────────────────
  it('business days: Sat-Sun only = 0 business days', () => {
    const r = config.calculate({
      startDate: '2025-01-18', startTime: '9:00 AM',
      endDate: '2025-01-19', endTime: '5:00 PM', businessDays: 'yes',
    });
    expect(getValue(r, 'businessDays')).toBe('0');
  });
});
