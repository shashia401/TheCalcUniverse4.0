import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/salary-to-hourly';
import { getValue, near, parseMoney } from '../../helpers';

describe('salary-to-hourly', () => {
  it('$65,000 salary at 40hr/52wk = $31.25/hr', () => {
    const r = config.calculate({
      salary: '65000',
      hoursPerWeek: '40',
      weeksPerYear: '52',
    });
    near(parseMoney(getValue(r, 'hourlyRate')), 31.25);
    near(parseMoney(getValue(r, 'dailyRate')), 250);
    near(parseMoney(getValue(r, 'weeklyRate')), 1250);
    near(parseMoney(getValue(r, 'monthlyRate')), 5416.67, 0.5);
  });

  it('$100,000 salary at 50hr/52wk = lower hourly rate', () => {
    const r = config.calculate({
      salary: '100000',
      hoursPerWeek: '50',
      weeksPerYear: '52',
    });
    // 100000 / (50 * 52) = 100000 / 2600 ≈ 38.46
    near(parseMoney(getValue(r, 'hourlyRate')), 38.46, 0.01);
  });

  it('part-time: $30,000 salary at 20hr/50wk', () => {
    const r = config.calculate({
      salary: '30000',
      hoursPerWeek: '20',
      weeksPerYear: '50',
    });
    // 30000 / (20 * 50) = 30000 / 1000 = 30.00
    near(parseMoney(getValue(r, 'hourlyRate')), 30);
    near(parseMoney(getValue(r, 'weeklyRate')), 600);
  });

  it('seasonal: $40,000 salary at 40hr/40wk', () => {
    const r = config.calculate({
      salary: '40000',
      hoursPerWeek: '40',
      weeksPerYear: '40',
    });
    // 40000 / (40 * 40) = 40000 / 1600 = 25
    near(parseMoney(getValue(r, 'hourlyRate')), 25);
  });

  it('returns empty when salary is missing', () => {
    const r = config.calculate({
      salary: '',
      hoursPerWeek: '40',
      weeksPerYear: '52',
    });
    expect(r).toEqual([]);
  });

  it('returns empty when hoursPerWeek is missing', () => {
    const r = config.calculate({
      salary: '65000',
      hoursPerWeek: '',
      weeksPerYear: '52',
    });
    expect(r).toEqual([]);
  });

  it('zero hours returns empty', () => {
    const r = config.calculate({
      salary: '65000',
      hoursPerWeek: '0',
      weeksPerYear: '52',
    });
    expect(r).toEqual([]);
  });
});
