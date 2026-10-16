import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/time/index';
import { getValue } from '../../helpers';

// Expected values derived independently in Python (minutes arithmetic; Decimal with ROUND_HALF_UP for money).
const run = (startTime: string, endTime: string, breakMinutes = '', hourlyRate = '') =>
  config.calculate({ startTime, endTime, breakMinutes, hourlyRate });

describe('time audit', () => {
  it('worked example 1 (Carlos): 7:00 AM - 3:30 PM, 30 min break, $18.50 -> 8 hours 0 minutes, 8.00 h, $148.00', () => {
    const r = run('7:00 AM', '3:30 PM', '30', '18.50');
    expect(getValue(r, 'standardTime')).toBe('8 hours 0 minutes');
    expect(getValue(r, 'decimalTime')).toBe('8.00');
    expect(getValue(r, 'grossPay')).toBe('$148.00');
  });

  it('worked example 2 (Maria, overnight): 10:00 PM - 6:00 AM, 45 min break, $22 -> 7 h 15 min, 7.25 h, $159.50', () => {
    const r = run('10:00 PM', '6:00 AM', '45', '22.00');
    expect(getValue(r, 'standardTime')).toBe('7 hours 15 minutes');
    expect(getValue(r, 'decimalTime')).toBe('7.25');
    expect(getValue(r, 'grossPay')).toBe('$159.50');
    expect(JSON.parse(getValue(r, '_parts')).overnight).toBe(true);
  });

  it('worked example 3 (David): 9:15 AM - 4:45 PM, $75 -> 7 h 30 min, $562.50', () => {
    const r = run('9:15 AM', '4:45 PM', '0', '75');
    expect(getValue(r, 'standardTime')).toBe('7 hours 30 minutes');
    expect(getValue(r, 'grossPay')).toBe('$562.50');
  });

  it('pay is exact: 0.75 h x $10.10 = $7.575 -> $7.58; a three-decimal rate is kept ($18.505 x 8 h = $148.04)', () => {
    expect(getValue(run('9:00', '9:45', '', '10.10'), 'grossPay')).toBe('$7.58');
    const r = run('9:00', '17:00', '', '18.505');
    expect(getValue(r, 'grossPay')).toBe('$148.04');
    expect(getValue(r, 'hourlyRate')).toBe('$18.505/hr');
    expect(getValue(run('9:00', '17:00', '', '25'), 'hourlyRate')).toBe('$25.00/hr');
  });

  it('large pay has thousands separators: 23 h 59 min at $1,000/h', () => {
    expect(getValue(run('12:00 AM', '11:59 PM', '', '1000'), 'grossPay')).toBe('$23,983.33');
  });

  it('decimal hours round correctly: 7 h 20 min = 7.33', () => {
    expect(getValue(run('9:00', '16:20'), 'decimalTime')).toBe('7.33');
  });

  it('identical start and end is a zero-length shift (not 24 h)', () => {
    const r = run('9:00 AM', '9:00 AM');
    expect(getValue(r, 'standardTime')).toBe('0 hours 0 minutes');
    expect(getValue(r, 'totalMinutes')).toBe('0');
  });

  it('a break equal to the shift leaves no paid time; a longer one is explained', () => {
    expect(getValue(run('9:00', '10:00', '60'), 'standardTime')).toBe('0 hours 0 minutes');
    const r = run('9:00', '10:00', '61');
    expect(r.map((x) => x.id)).toEqual(['error']);
    expect(r[0].value).toContain('longer than the 60-minute shift');
  });

  it('the break must be whole minutes, 0 or more: 7.5 used to become 7 and -30 was accepted', () => {
    for (const bad of ['7.5', '-30', 'abc', '30min']) {
      const r = run('9:00', '17:00', bad);
      expect(r.map((x) => x.id), bad).toEqual(['error']);
    }
    expect(getValue(run('9:00', '17:00', ''), 'breakTime')).toBe('None');
    expect(getValue(run('9:00', '17:00', '0'), 'breakTime')).toBe('None');
  });

  it('a malformed or non-positive rate means no pay lines (it is not read as 25 from "25abc")', () => {
    for (const bad of ['25abc', '0', '-5', '']) {
      expect(run('9:00', '17:00', '', bad).some((x) => x.id === 'grossPay'), bad).toBe(false);
    }
  });

  it('times that are not real times are rejected, not guessed', () => {
    for (const bad of ['24:00', '13:00 PM', '9:75', '9:00:30 AM', '9', 'abc', '']) {
      expect(run(bad, '17:00'), bad).toEqual([]);
      expect(run('9:00', bad), bad).toEqual([]);
    }
  });

  it('hidden _parts carries what the panel needs (so it never re-parses the inputs)', () => {
    const r = run('7:00 AM', '3:30 PM', '30', '18.50');
    expect(JSON.parse(getValue(r, '_parts'))).toEqual({
      startMinutes: 420,
      endMinutes: 930,
      breakMinutes: 30,
      workingMinutes: 480,
      overnight: false,
      decimalHours: 8,
    });
  });

  it('the FAQ no longer promises optional seconds, and the "browser time parsing" limitation is gone', () => {
    const text = JSON.stringify(config.educational);
    expect(text).not.toContain('seconds are optional');
    expect(text).not.toContain('browser time parsing');
  });
});
