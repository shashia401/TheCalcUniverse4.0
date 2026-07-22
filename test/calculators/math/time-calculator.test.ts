import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/time/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Time & Hours calculator', () => {
  it('9 AM to 5 PM = 8 hours', () => {
    const r = config.calculate({ startTime: '9:00 AM', endTime: '5:00 PM' });
    expect(getValue(r, 'standardTime')).toContain('8 hours');
    near(parseNumber(getValue(r, 'decimalTime')), 8);
  });

  it('9 AM to 5 PM with 30 min break = 7.5 hours', () => {
    const r = config.calculate({
      startTime: '9:00 AM',
      endTime: '5:00 PM',
      breakMinutes: '30',
    });
    expect(getValue(r, 'standardTime')).toContain('7 hours 30 minutes');
    near(parseNumber(getValue(r, 'decimalTime')), 7.5);
  });

  it('10 PM to 6 AM (overnight) = 8 hours', () => {
    const r = config.calculate({ startTime: '10:00 PM', endTime: '6:00 AM' });
    expect(getValue(r, 'standardTime')).toContain('8 hours');
    near(parseNumber(getValue(r, 'decimalTime')), 8);
  });

  it('9:00 AM to 12:00 PM = 3 hours', () => {
    const r = config.calculate({ startTime: '9:00 AM', endTime: '12:00 PM' });
    expect(getValue(r, 'standardTime')).toContain('3 hours');
    near(parseNumber(getValue(r, 'decimalTime')), 3);
  });

  it('invalid time returns empty', () => {
    const r = config.calculate({ startTime: 'invalid', endTime: '5:00 PM' });
    expect(r).toEqual([]);

    const r2 = config.calculate({ startTime: '9:00 AM', endTime: 'invalid' });
    expect(r2).toEqual([]);
  });

  it('hourly rate $20 for 8 hours = $160.00', () => {
    const r = config.calculate({
      startTime: '9:00 AM',
      endTime: '5:00 PM',
      hourlyRate: '20',
    });
    expect(getValue(r, 'grossPay')).toBe('$160.00');
    near(parseNumber(getValue(r, 'grossPay')), 160);
  });

  it('decimal time format', () => {
    const r = config.calculate({ startTime: '9:00 AM', endTime: '5:00 PM' });
    const decimalVal = parseFloat(getValue(r, 'decimalTime'));
    expect(decimalVal).toBe(8);
  });

  it('breakMinutes 0 shows "None"', () => {
    const r = config.calculate({
      startTime: '9:00 AM',
      endTime: '5:00 PM',
      breakMinutes: '0',
    });
    expect(getValue(r, 'breakTime')).toBe('None');
  });

  it('times with different AM/PM correctly handled', () => {
    const r = config.calculate({ startTime: '7:30 AM', endTime: '3:45 PM' });
    const decimalVal = parseFloat(getValue(r, 'decimalTime'));
    near(decimalVal, 8.25);
    expect(getValue(r, 'standardTime')).toContain('8 hours 15 minutes');
  });

  it('24-hour format input works', () => {
    const r = config.calculate({ startTime: '9:00', endTime: '17:00' });
    near(parseNumber(getValue(r, 'decimalTime')), 8);
  });

  it('gross pay not shown when no rate', () => {
    const r = config.calculate({ startTime: '9:00 AM', endTime: '5:00 PM' });
    const grossRow = r.find((x) => x.id === 'grossPay');
    expect(grossRow).toBeUndefined();
  });

  it('break deduction larger than shift results in 0', () => {
    const r = config.calculate({
      startTime: '9:00 AM',
      endTime: '10:00 AM',
      breakMinutes: '90',
    });
    expect(getValue(r, 'standardTime')).toContain('0 hours');
    near(parseNumber(getValue(r, 'decimalTime')), 0);
  });

  it('startLabel and endLabel show original input', () => {
    const r = config.calculate({ startTime: '9:00 AM', endTime: '5:00 PM' });
    expect(getValue(r, 'startLabel')).toBe('9:00 AM');
    expect(getValue(r, 'endLabel')).toBe('5:00 PM');
  });
});
