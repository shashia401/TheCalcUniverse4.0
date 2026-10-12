import { describe, it, expect } from 'vitest';
import hourly from '../../../src/calculators/finance/salary-hourly/index';
import toHourly from '../../../src/calculators/finance/salary-to-hourly/index';
import calc from '../../../src/calculators/finance/salary-calculator/index';
import { payRates, trueHourly } from '../../../src/calculators/finance/salary-hourly/salaryHourlyMath';
import { annualFromRate, estimateTakeHome } from '../../../src/calculators/finance/salary-calculator/salaryCalcMath';
import { getValue, parseMoney, near } from '../../helpers';

describe('salary-hourly vs salary-to-hourly (twins): same inputs, same answers', () => {
  for (const [salary, hrs] of [[65000, 40], [80000, 45], [52000, 37.5], [120000, 50]]) {
    it(`salary ${salary}, ${hrs} h/week, 52 weeks`, () => {
      const a = hourly.calculate({ annualSalary: String(salary), hoursPerWeek: String(hrs), trueHourlyToggle: 'no' });
      const b = toHourly.calculate({ salary: String(salary), hoursPerWeek: String(hrs), weeksPerYear: '52' });
      const expectedHourly = salary / (hrs * 52); // independent hand formula
      near(parseMoney(getValue(a, 'standardHourly')), expectedHourly, 0.005);
      near(parseMoney(getValue(b, 'hourlyRate')), expectedHourly, 0.005);
      expect(getValue(a, 'weeklyPay')).toBe(getValue(b, 'weeklyRate'));
      expect(getValue(a, 'monthlyPay')).toBe(getValue(b, 'monthlyRate'));
    });
  }

  it('fewer weeks worked raises the hourly rate; daily rate uses a 5-day week (not "8 hr")', () => {
    // Maria: 52,000 over 40 hrs x 40 weeks = 1,600 h -> 32.50/h, 260/day, 1,300 per week worked, 4,333.33/month
    const b = toHourly.calculate({ salary: '52000', hoursPerWeek: '40', weeksPerYear: '40' });
    expect(getValue(b, 'hourlyRate')).toBe('$32.50');
    expect(getValue(b, 'dailyRate')).toBe('$260.00');
    expect(getValue(b, 'weeklyRate')).toBe('$1,300.00');
    expect(getValue(b, 'monthlyRate')).toBe('$4,333.33');
    expect(b.find((r) => r.id === 'dailyRate')!.label).toBe('Daily Rate (5-day week)');
    // a 50-hour week has a 10-hour day: 65,000 / (50 x 52) = 25.00/h -> 250.00/day
    const c = toHourly.calculate({ salary: '65000', hoursPerWeek: '50', weeksPerYear: '52' });
    expect(getValue(c, 'dailyRate')).toBe('$250.00');
  });

  it('worked examples (David/Tom numbers): $65,000 -> 31.25/h, 250/day, 1,250/week, 5,416.67/month', () => {
    const r = payRates(65000, 40);
    near(r.hourly, 31.25, 1e-9);
    near(r.daily, 250, 1e-9);
    near(r.weekly, 1250, 1e-9);
    near(r.monthly, 5416.6667, 1e-3);
  });

  it('true hourly worked examples (Jessica and Marcus), derived by hand', () => {
    // Jessica: weeks 52-15/5=49; hrs 40+5+5=50 -> 2450; commute 10x5x49=2450; (80000-2450)/2450
    const j = trueHourly({ salary: 80000, hoursPerWeek: 40, commuteHoursPerDay: 1, commuteCostPerDay: 10, unpaidOvertimeHours: 5, ptoDays: 15 });
    near(j.trueHourly, 31.653, 0.001);
    expect(j.effectiveAnnualHours).toBe(2450);
    expect(j.commuteCostsAnnual).toBe(2450);
    // remote comparison from the text: 70,000 / (40 x 49) = 35.71
    near(trueHourly({ salary: 70000, hoursPerWeek: 40, commuteHoursPerDay: 0, commuteCostPerDay: 0, unpaidOvertimeHours: 0, ptoDays: 15 }).trueHourly, 35.714, 0.001);
    // Marcus: weeks 48; hrs 45+10+5=60 -> 2880; commute 14x5x48=3360; (120000-3360)/2880
    const m = trueHourly({ salary: 120000, hoursPerWeek: 45, commuteHoursPerDay: 2, commuteCostPerDay: 14, unpaidOvertimeHours: 5, ptoDays: 20 });
    near(m.trueHourly, 40.5, 0.001);
    expect(m.commuteCostsAnnual).toBe(3360);
    near(trueHourly({ salary: 100000, hoursPerWeek: 45, commuteHoursPerDay: 0, commuteCostPerDay: 0, unpaidOvertimeHours: 0, ptoDays: 20 }).trueHourly, 46.296, 0.001);
  });

  it('FAQ commute comparison: 90K/30min vs 100K/90min each way = 38.46 vs 34.97 per hour of life', () => {
    near(trueHourly({ salary: 90000, hoursPerWeek: 40, commuteHoursPerDay: 1, commuteCostPerDay: 0, unpaidOvertimeHours: 0, ptoDays: 0 }).trueHourly, 38.4615, 0.001);
    near(trueHourly({ salary: 100000, hoursPerWeek: 40, commuteHoursPerDay: 3, commuteCostPerDay: 0, unpaidOvertimeHours: 0, ptoDays: 0 }).trueHourly, 34.965, 0.001);
  });

  it('all PTO (no working weeks) gives no true hourly instead of a negative or infinite rate', () => {
    const r = hourly.calculate({ annualSalary: '80000', hoursPerWeek: '40', trueHourlyToggle: 'yes', paidTimeOff: '260' });
    expect(r.find((x) => x.id === 'trueHourly')).toBeUndefined();
    for (const x of r) expect(x.value).not.toMatch(/NaN|Infinity/);
  });
});

describe('salary-calculator audit', () => {
  it('annualises every frequency', () => {
    expect(annualFromRate(45, 'hourly', 40, 5)).toBe(93600);
    expect(annualFromRate(600, 'daily', 40, 5)).toBe(156000);
    expect(annualFromRate(5500, 'monthly', 40, 5)).toBe(66000);
    expect(annualFromRate(2300, 'biweekly', 40, 5)).toBe(59800);
    expect(annualFromRate(3000, 'semimonthly', 40, 5)).toBe(72000);
    expect(annualFromRate(1500, 'weekly', 40, 5)).toBe(78000);
  });

  it('worked examples: 5,500/month -> 31.73/hr and 2,538 bi-weekly; 2 extra checks = 5,076', () => {
    const r = calc.calculate({ salaryAmount: '5500', payFrequency: 'monthly', hoursPerWeek: '40', daysPerWeek: '5' });
    expect(getValue(r, 'hourly')).toBe('$31.73/hr');
    expect(getValue(r, 'biweekly')).toBe('$2,538/paycheck');
    expect(Math.round(66000 / 26) * 2).toBe(5076);
  });

  it('take-home includes the 0.9% additional Medicare above 200,000 (regression: it was dropped)', () => {
    // 250,000 single: taxable 233,900. tax = 1,240 + 4,560 + 12,166 (22% x 55,300) + 23,058 (24% x 96,075)
    //   + 32% x (233,900-201,775) 10,280 = 51,304. FICA = 11,439 + 3,625 + 0.9% x 50,000 (450) = 15,514.
    const t = estimateTakeHome(250000);
    near(t.federalTax, 51304, 0.01);
    near(t.fica, 15514, 0.01);
    near(t.net, 250000 - 51304 - 15514, 0.01);
  });

  it('take-home for 75,000 single is 61,592.50 (7,670 federal + 5,737.50 FICA, no state)', () => {
    near(estimateTakeHome(75000).net, 61592.5, 0.01);
  });
});
