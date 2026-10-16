import { describe, it, expect } from 'vitest';
import { minutesBetween, parseClockTime } from '../../../src/utils/clockTime';

// The one clock-time parser shared by the time, time-duration and time-card calculators.
describe('parseClockTime', () => {
  it('12-hour times, with or without minutes, spaces and case', () => {
    expect(parseClockTime('9:00 AM')).toBe(540);
    expect(parseClockTime('9 am')).toBe(540);
    expect(parseClockTime('9:00AM')).toBe(540);
    expect(parseClockTime('1:30 PM')).toBe(810);
    expect(parseClockTime('11:59 pm')).toBe(1439);
  });

  it('noon and midnight: 12:00 PM is 720, 12:00 AM is 0, 12:30 AM is 30', () => {
    expect(parseClockTime('12:00 PM')).toBe(720);
    expect(parseClockTime('12:00 AM')).toBe(0);
    expect(parseClockTime('12:30 AM')).toBe(30);
  });

  it('24-hour times', () => {
    expect(parseClockTime('00:00')).toBe(0);
    expect(parseClockTime('09:05')).toBe(545);
    expect(parseClockTime('17:30')).toBe(1050);
    expect(parseClockTime('23:59')).toBe(1439);
  });

  it('things that are not times of day are null', () => {
    for (const bad of ['', '   ', 'abc', '24:00', '25:00', '13:00 PM', '0:30 AM', '9:60', '9:75', '9:00:30', '9:00:30 AM', '9.5', '-1:00']) {
      expect(parseClockTime(bad), JSON.stringify(bad)).toBeNull();
    }
  });

  it('a bare hour is a time only where the caller allows it', () => {
    expect(parseClockTime('9')).toBeNull();
    expect(parseClockTime('9', { bareHour: true })).toBe(540);
    expect(parseClockTime('17', { bareHour: true })).toBe(1020);
    expect(parseClockTime('24', { bareHour: true })).toBeNull();
    expect(parseClockTime('9 PM')).toBe(1260); // with AM/PM no option is needed
  });

  it('24:00 is the end of the day only where the caller allows it', () => {
    expect(parseClockTime('24:00')).toBeNull();
    expect(parseClockTime('24:00', { endOfDay: true })).toBe(1440);
    expect(parseClockTime('24:01', { endOfDay: true })).toBeNull();
  });

  it('minutesBetween handles midnight crossings and identical times', () => {
    expect(minutesBetween(540, 1020)).toBe(480); // 9:00 -> 17:00
    expect(minutesBetween(22 * 60, 6 * 60)).toBe(480); // 22:00 -> 06:00
    expect(minutesBetween(540, 540)).toBe(0);
  });
});
