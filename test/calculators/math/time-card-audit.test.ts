import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/time-card/index';
import { getValue } from '../../helpers';

// Expected values derived independently in Python (minutes arithmetic; Decimal with ROUND_HALF_UP for money).
const week = (entries: string, extra: Record<string, string> = {}) =>
  config.calculate({ entries, overtimeThreshold: '40', paySettings: 'skip', ...extra });
const paid = (entries: string, rate: string, extra: Record<string, string> = {}) =>
  week(entries, { paySettings: 'enter', regularRate: rate, ...extra });

const FIVE_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d) => `${d}, 9:00, 18:00, 0`).join('\n'); // 5 x 9 h = 45 h

describe('time-card audit', () => {
  it('worked example 1 (Jennifer): 5 x (8:30-17:00, 0:30 break) = 40.00 h, $980.00', () => {
    const entries = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d) => `${d}, 8:30, 17:00, 0:30`).join('\n');
    const r = paid(entries, '24.50');
    expect(getValue(r, 'totalHours')).toBe('40.00 hours');
    expect(getValue(r, 'overtimeHours')).toBe('0.00 hours');
    expect(getValue(r, 'totalPay')).toBe('$980.00');
  });

  it('worked example 2 (Marcus): 54 h = 40 regular + 14 overtime; $720.00 + $378.00 = $1,098.00', () => {
    const entries = [
      ...['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d) => `${d}, 7:00, 17:30, 0:30`),
      'Sat, 8:00, 12:00, 0:00',
    ].join('\n');
    const r = paid(entries, '18.00', { overtimeRate: '1.5' });
    expect(getValue(r, 'totalHours')).toBe('54.00 hours');
    expect(getValue(r, 'regularHours')).toBe('40.00 hours');
    expect(getValue(r, 'overtimeHours')).toBe('14.00 hours');
    expect(getValue(r, 'regularPay')).toBe('$720.00');
    expect(getValue(r, 'overtimePay')).toBe('$378.00');
    expect(getValue(r, 'totalPay')).toBe('$1,098.00');
  });

  it('worked example 3 (cafe): 3 x 4 h = 12.00 h, $198.00', () => {
    const r = paid('Mon, 11:00, 15:00, 0:00\nWed, 11:00, 15:00, 0:00\nFri, 11:00, 15:00, 0:00', '16.50');
    expect(getValue(r, 'totalHours')).toBe('12.00 hours');
    expect(getValue(r, 'totalPay')).toBe('$198.00');
  });

  it('a bare number is minutes ("30" = 30 min). It used to be 30 HOURS, which zeroed the whole day', () => {
    const r = week('Mon, 9:00, 17:00, 30');
    expect(getValue(r, 'totalHours')).toBe('7.50 hours');
    expect(getValue(week('Mon, 9:00, 17:00, 45'), 'totalHours')).toBe('7.25 hours');
    expect(getValue(week('Mon, 9:00, 17:00, 1:15'), 'totalHours')).toBe('6.75 hours');
  });

  it('invalid times are listed and not counted (25:00 used to be 25 hours; "abc" used to be 0)', () => {
    const r = week('Mon, 9:00, 17:00, 0:30\nTue, 25:00, 17:00, 0\nWed, abc, 17:00, 0\nThu, 13:00 PM, 17:00, 0\nFri, 9:75, 17:00, 0');
    expect(getValue(r, 'totalHours')).toBe('7.50 hours'); // only Monday counts
    expect(getValue(r, 'skippedLines')).toContain('line 2');
    expect(getValue(r, 'skippedLines')).toContain('line 5');
    expect(r.find((x) => x.id === 'skippedLines')!.label).toBe('4 lines not counted');
  });

  it('a line with a malformed break or a break longer than the shift is reported, not silently zeroed', () => {
    const r = week('Mon, 9:00, 17:00, 0:30\nTue, 9:00, 10:00, 2:00\nWed, 9:00, 17:00, 0.5');
    expect(getValue(r, 'totalHours')).toBe('7.50 hours');
    expect(getValue(r, 'skippedLines')).toContain('longer than the shift');
    expect(getValue(r, 'skippedLines')).toContain('should be h:mm or minutes');
  });

  it('when nothing can be read the result explains why instead of showing 0 hours', () => {
    const r = week('Mon 9:00\nTue, nine, five');
    expect(r.map((x) => x.id)).toEqual(['skippedLines']);
  });

  it('time formats: bare hour, 12/24-hour, noon/midnight, and 24:00 as end of day', () => {
    expect(getValue(week('Mon, 9, 17, 0'), 'totalHours')).toBe('8.00 hours');
    expect(getValue(week('Mon, 12:00 AM, 12:00 PM, 0'), 'totalHours')).toBe('12.00 hours');
    expect(getValue(week('Mon, 12:00 PM, 11:59 PM, 0'), 'totalHours')).toBe('11.98 hours'); // 719 min
    expect(getValue(week('Mon, 22:00, 24:00, 0'), 'totalHours')).toBe('2.00 hours');
    expect(getValue(week('Sat, 0:00, 0:00, 0:00'), 'totalHours')).toBe('0.00 hours'); // documented "day off" line
  });

  it('shifts that cross midnight: 22:00 -> 06:00 is 8 h', () => {
    expect(getValue(week('Mon, 22:00, 06:00, 0'), 'totalHours')).toBe('8.00 hours');
    expect(getValue(week('Mon, 10:00 PM, 6:00 AM, 0:30'), 'totalHours')).toBe('7.50 hours');
  });

  it('pay is exact to the cent: 0.75 h x $10.10 = $7.575 -> $7.58 (float maths printed $7.57)', () => {
    const r = paid('Mon, 9:00, 9:45, 0', '10.10');
    expect(getValue(r, 'totalHours')).toBe('0.75 hours');
    expect(getValue(r, 'regularPay')).toBe('$7.58');
    expect(getValue(paid('Mon, 9:00, 9:45, 0', '10.42'), 'regularPay')).toBe('$7.82'); // 7.815
    expect(getValue(paid('Mon, 9:00, 16:20, 0', '13.37'), 'totalPay')).toBe('$98.05'); // 7 h 20 min
  });

  it('overtime pay: 45 h at $18.55, 1.5x -> $742.00 + $139.13 = $881.13; 2x -> $185.50 overtime', () => {
    const r = paid(FIVE_DAYS, '18.55');
    expect(getValue(r, 'regularPay')).toBe('$742.00');
    expect(getValue(r, 'overtimePay')).toBe('$139.13'); // 5 x 18.55 x 1.5 = 139.125
    expect(getValue(r, 'totalPay')).toBe('$881.13');
    expect(getValue(paid(FIVE_DAYS, '18.55', { overtimeRate: '2' }), 'overtimePay')).toBe('$185.50');
  });

  it('the total is the sum of the printed pay lines (they always add up)', () => {
    const r = paid(FIVE_DAYS, '18.55');
    const n = (id: string) => parseFloat(getValue(r, id).replace(/[$,]/g, ''));
    expect(n('regularPay') + n('overtimePay')).toBeCloseTo(n('totalPay'), 10);
  });

  it('weekly thresholds: a 54 h week has 14 / 16 / 19 / 10 overtime hours at 40 / 38 / 35 / 44; none at 0', () => {
    const fiftyFour = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d) => `${d}, 7:00, 17:30, 0:30`).join('\n') + '\nSat, 8:00, 12:00, 0';
    const ot = (t: string) => getValue(week(fiftyFour, { overtimeThreshold: t }), 'overtimeHours');
    expect(ot('40')).toBe('14.00 hours');
    expect(ot('38')).toBe('16.00 hours');
    expect(ot('35')).toBe('19.00 hours');
    expect(ot('44')).toBe('10.00 hours');
    expect(ot('0')).toBe('0.00 hours');
  });

  it('daily overtime (8 h/day) replaces the weekly test: days of 10, 9 and 7 h = 23 regular + 3 overtime; $550.00 at $20', () => {
    const r = paid('Mon, 8:00, 18:00, 0\nTue, 8:00, 17:00, 0\nWed, 8:00, 15:00, 0', '20', { overtimeThreshold: '8' });
    expect(getValue(r, 'totalHours')).toBe('26.00 hours');
    expect(getValue(r, 'regularHours')).toBe('23.00 hours');
    expect(getValue(r, 'overtimeHours')).toBe('3.00 hours');
    expect(getValue(r, 'totalPay')).toBe('$550.00');
  });

  it('pay needs a positive, well-formed rate', () => {
    expect(paid('Mon, 9:00, 17:00, 0', '').some((x) => x.id === 'totalPay')).toBe(false);
    expect(paid('Mon, 9:00, 17:00, 0', '0').some((x) => x.id === 'totalPay')).toBe(false);
    expect(paid('Mon, 9:00, 17:00, 0', '25abc').some((x) => x.id === 'totalPay')).toBe(false);
  });

  it('week header: formatted in UTC so the visitor time zone cannot shift the day; impossible dates are ignored', () => {
    expect(getValue(week('Mon, 9:00, 17:00, 0', { weekStart: '2026-03-09' }), 'weekNumber')).toBe('Week of Mar 9, 2026');
    expect(getValue(week('Mon, 9:00, 17:00, 0', { weekStart: '2026-02-31' }), 'weekNumber')).toBe('');
  });

  it('the education text matches the behaviour', () => {
    const text = JSON.stringify(config.educational);
    expect(text).not.toContain('reasonable defaults');
    expect(text).not.toContain('tracks alongside weekly overtime');
    expect(text).not.toContain('daily breakdown JSON');
    expect(text).toContain('plain number of minutes');
  });
});
