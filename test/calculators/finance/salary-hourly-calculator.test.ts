import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/salary-hourly/index';
import { getValue, parseMoney, near, parseNumber } from '../../helpers';

describe('salary-hourly-calculator (Salary to Hourly Converter)', () => {
  it('$80,000 salary at 40 hrs/week → $38.46/hr standard', () => {
    const r = config.calculate({
      annualSalary: '80000',
      hoursPerWeek: '40',
      trueHourlyToggle: 'no',
    });
    const expectedHourly = 80000 / (40 * 52);
    near(parseMoney(getValue(r, 'standardHourly')), expectedHourly);
    expect(getValue(r, 'weeklyPay')).toBe('$1,538.46');
  });

  it('Weekly, biweekly, and monthly pay are calculated correctly', () => {
    const r = config.calculate({
      annualSalary: '65000',
      hoursPerWeek: '35',
      trueHourlyToggle: 'no',
    });
    near(parseMoney(getValue(r, 'weeklyPay')), 65000 / 52);
    near(parseMoney(getValue(r, 'biweeklyPay')), 65000 / 26);
    near(parseMoney(getValue(r, 'monthlyPay')), 65000 / 12);
  });

  it('True hourly mode: $80K, 40hrs, 1hr commute, $10/day, 5hr unpaid OT, 15 PTO days', () => {
    const r = config.calculate({
      annualSalary: '80000',
      hoursPerWeek: '40',
      trueHourlyToggle: 'yes',
      commuteHoursPerDay: '1',
      commuteCostPerDay: '10',
      unpaidOvertimeHours: '5',
      paidTimeOff: '15',
    });

    const workingWeeks = 52 - 15 / 5; // 49
    const effectiveHoursPerWeek = 40 + 1 * 5 + 5; // 50
    const effectiveAnnualHours = effectiveHoursPerWeek * workingWeeks; // 2450
    const commuteCostsAnnual = 10 * 5 * workingWeeks; // $2,450
    const trueHourly = (80000 - commuteCostsAnnual) / effectiveAnnualHours;

    near(parseMoney(getValue(r, 'trueHourly')), trueHourly);
    near(parseMoney(getValue(r, 'commuteCostsAnnual')), commuteCostsAnnual);
    expect(getValue(r, 'effectiveHoursPerWeek')).toBe('50.0 hrs');
    expect(getValue(r, 'effectiveAnnualHours')).toBe('2450 hrs');
  });

  it('True hourly with no commute/overtime still shows difference from standard', () => {
    const r = config.calculate({
      annualSalary: '80000',
      hoursPerWeek: '40',
      trueHourlyToggle: 'yes',
      paidTimeOff: '25',
    });

    const workingWeeks = 52 - 25 / 5; // 47
    const effectiveHoursPerWeek = 40;
    const effectiveAnnualHours = 40 * workingWeeks; // 1880
    const trueHourly = 80000 / effectiveAnnualHours;

    near(parseMoney(getValue(r, 'trueHourly')), trueHourly);
    expect(getValue(r, 'effectiveAnnualHours')).toBe('1880 hrs');
    // Standard is still $38.46
    near(parseMoney(getValue(r, 'standardHourly')), 80000 / (40 * 52));
  });

  it('Standard hourly is still reported in true hourly mode', () => {
    const r = config.calculate({
      annualSalary: '100000',
      hoursPerWeek: '50',
      trueHourlyToggle: 'yes',
      commuteHoursPerDay: '0.5',
      commuteCostPerDay: '5',
      unpaidOvertimeHours: '2',
      paidTimeOff: '10',
    });
    // Standard hourly should be present
    const standardHourly = parseMoney(getValue(r, 'standardHourly'));
    near(standardHourly, 100000 / (50 * 52));
    // True hourly should also be present
    const trueHourly = parseMoney(getValue(r, 'trueHourly'));
    expect(trueHourly).toBeGreaterThan(0);
    expect(trueHourly).toBeLessThan(standardHourly); // should be less due to extra hours
  });

  it('True hourly mode not toggled — no true hourly results', () => {
    const r = config.calculate({
      annualSalary: '100000',
      hoursPerWeek: '40',
      trueHourlyToggle: 'no',
    });
    const ids = r.map((res) => res.id);
    expect(ids).toContain('standardHourly');
    expect(ids).not.toContain('trueHourly');
    expect(ids).not.toContain('effectiveHoursPerWeek');
    expect(ids).not.toContain('commuteCostsAnnual');
  });

  it('returns empty for invalid salary', () => {
    const r = config.calculate({
      annualSalary: 'abc',
      hoursPerWeek: '40',
      trueHourlyToggle: 'no',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for zero salary', () => {
    const r = config.calculate({
      annualSalary: '0',
      hoursPerWeek: '40',
      trueHourlyToggle: 'no',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for zero hours per week', () => {
    const r = config.calculate({
      annualSalary: '50000',
      hoursPerWeek: '0',
      trueHourlyToggle: 'no',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for negative salary', () => {
    const r = config.calculate({
      annualSalary: '-50000',
      hoursPerWeek: '40',
      trueHourlyToggle: 'no',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN hours', () => {
    const r = config.calculate({
      annualSalary: '50000',
      hoursPerWeek: 'xyz',
      trueHourlyToggle: 'no',
    });
    expect(r).toEqual([]);
  });

  it('$120,000 salary at 40hrs displays salary and hours correctly', () => {
    const r = config.calculate({
      annualSalary: '120000',
      hoursPerWeek: '40',
      trueHourlyToggle: 'no',
    });
    expect(getValue(r, 'salary')).toBe('$120,000.00');
    expect(getValue(r, 'hoursPerWeek')).toBe('40.0');
    near(parseMoney(getValue(r, 'standardHourly')), 120000 / (40 * 52));
  });

  it('$30,000 salary at 40hrs → $14.42/hr', () => {
    const r = config.calculate({
      annualSalary: '30000',
      hoursPerWeek: '40',
      trueHourlyToggle: 'no',
    });
    near(parseMoney(getValue(r, 'standardHourly')), 30000 / (40 * 52));
  });

  it('$150,000 salary at 40hrs → $72.12/hr', () => {
    const r = config.calculate({
      annualSalary: '150000',
      hoursPerWeek: '40',
      trueHourlyToggle: 'no',
    });
    near(parseMoney(getValue(r, 'standardHourly')), 150000 / (40 * 52));
  });

  it('part-time $45,000 at 25hrs/week → correct hourly', () => {
    const r = config.calculate({
      annualSalary: '45000',
      hoursPerWeek: '25',
      trueHourlyToggle: 'no',
    });
    near(parseMoney(getValue(r, 'standardHourly')), 45000 / (25 * 52));
  });

  it('true hourly with high commute costs significantly reduces effective rate', () => {
    const r = config.calculate({
      annualSalary: '90000',
      hoursPerWeek: '40',
      trueHourlyToggle: 'yes',
      commuteHoursPerDay: '2',
      commuteCostPerDay: '25',
      unpaidOvertimeHours: '8',
      paidTimeOff: '10',
    });
    const standard = parseMoney(getValue(r, 'standardHourly'));
    const trueR = parseMoney(getValue(r, 'trueHourly'));
    // True hourly should be significantly lower (at least 30% less)
    expect(trueR).toBeLessThan(standard * 0.7);
  });

  it('minimal commute, no overtime — true hourly close to standard', () => {
    const r = config.calculate({
      annualSalary: '75000',
      hoursPerWeek: '40',
      trueHourlyToggle: 'yes',
      commuteHoursPerDay: '0.25',
      commuteCostPerDay: '2',
      unpaidOvertimeHours: '0',
      paidTimeOff: '20',
    });
    const standard = parseMoney(getValue(r, 'standardHourly'));
    const trueR = parseMoney(getValue(r, 'trueHourly'));
    // True hourly should be within 10% of standard (small commute, low cost)
    near(trueR / standard, 1.0, 0.15);
  });
});
