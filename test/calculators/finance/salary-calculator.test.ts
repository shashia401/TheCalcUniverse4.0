import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/salary-calculator/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('salary-calculator', () => {
  it('hourly to all periods', () => {
    const r = config.calculate({
      salaryAmount: '35',
      payFrequency: 'hourly',
      hoursPerWeek: '40',
      daysPerWeek: '5',
    });
    // Annual = 35 * 40 * 52 = 72800
    near(parseNumber(getValue(r, 'annual')), 72800);
    near(parseNumber(getValue(r, 'monthly')), 72800 / 12, 1);
    near(parseNumber(getValue(r, 'biweekly')), 72800 / 26, 1);
    near(parseNumber(getValue(r, 'weekly')), 72800 / 52, 1);
    near(parseNumber(getValue(r, 'daily')), 72800 / (5 * 52), 1);
    near(parseNumber(getValue(r, 'hourly')), 35);

    // Hero should show annual equivalent
    expect(getValue(r, 'hero')).toContain('/year');
  });

  it('annual salary to hourly', () => {
    const r = config.calculate({
      salaryAmount: '100000',
      payFrequency: 'annually',
      hoursPerWeek: '40',
      daysPerWeek: '5',
    });
    // Hourly = 100000 / (40 * 52)
    near(parseNumber(getValue(r, 'hourly')), 100000 / (40 * 52), 0.01);
    near(parseNumber(getValue(r, 'annual')), 100000);
    // Hero should show hourly equivalent
    expect(getValue(r, 'hero')).toContain('/hr');
  });

  it('monthly salary conversions', () => {
    const r = config.calculate({
      salaryAmount: '6000',
      payFrequency: 'monthly',
      hoursPerWeek: '40',
      daysPerWeek: '5',
    });
    // Annual = 6000 * 12 = 72000
    near(parseNumber(getValue(r, 'annual')), 72000);
    near(parseNumber(getValue(r, 'monthly')), 6000);
    near(parseNumber(getValue(r, 'biweekly')), 72000 / 26, 1);
  });

  it('bi-weekly to annual and hourly', () => {
    const r = config.calculate({
      salaryAmount: '2300',
      payFrequency: 'biweekly',
      hoursPerWeek: '40',
      daysPerWeek: '5',
    });
    // Annual = 2300 * 26 = 59800
    near(parseNumber(getValue(r, 'annual')), 59800);
    near(parseNumber(getValue(r, 'biweekly')), 2300);
    near(parseNumber(getValue(r, 'hourly')), 59800 / (40 * 52), 0.1);
  });

  it('semi-monthly conversions use annual divided by 24', () => {
    const r = config.calculate({
      salaryAmount: '4000',
      payFrequency: 'semimonthly',
      hoursPerWeek: '40',
      daysPerWeek: '5',
    });
    // Annual = 4000 * 24 = 96000
    near(parseNumber(getValue(r, 'annual')), 96000);
    near(parseNumber(getValue(r, 'monthly')), 96000 / 12);
    near(parseNumber(getValue(r, 'biweekly')), 96000 / 26, 1);
  });

  it('daily rate conversions', () => {
    const r = config.calculate({
      salaryAmount: '400',
      payFrequency: 'daily',
      hoursPerWeek: '40',
      daysPerWeek: '5',
    });
    // Annual = 400 * 5 * 52 = 104000
    near(parseNumber(getValue(r, 'annual')), 104000);
    near(parseNumber(getValue(r, 'daily')), 400);
  });

  it('weekly rate conversions', () => {
    const r = config.calculate({
      salaryAmount: '1500',
      payFrequency: 'weekly',
      hoursPerWeek: '40',
      daysPerWeek: '5',
    });
    // Annual = 1500 * 52 = 78000
    near(parseNumber(getValue(r, 'annual')), 78000);
    near(parseNumber(getValue(r, 'weekly')), 1500);
  });

  it('net take-home pay is less than gross annual', () => {
    const r = config.calculate({
      salaryAmount: '75000',
      payFrequency: 'annually',
      hoursPerWeek: '40',
      daysPerWeek: '5',
    });
    const gross = parseNumber(getValue(r, 'annual'));
    const netAnnual = parseNumber(getValue(r, 'netAnnual'));
    expect(netAnnual).toBeLessThan(gross);
    // For $75,000 single filer with 2025 rates + 4.5% state estimate
    // Federal tax on (75000 - 15000) = 60000 taxable ≈ $8,114
    // FICA: SS = 75000*0.062 = 4650, Medicare = 75000*0.0145 = 1087.5
    // State: 75000*0.045 = 3375
    // Net ≈ 75000 - 8114 - 4650 - 1087.5 - 3375 = 57773.5
    near(netAnnual, 57774, 100);
  });

  it('net bi-weekly paycheck equals netAnnual / 26', () => {
    const r = config.calculate({
      salaryAmount: '75000',
      payFrequency: 'annually',
      hoursPerWeek: '40',
      daysPerWeek: '5',
    });
    const netAnnual = parseNumber(getValue(r, 'netAnnual'));
    const netBiweekly = parseNumber(getValue(r, 'netBiweekly'));
    near(netBiweekly * 26, netAnnual, 10);
  });

  it('returns empty for empty inputs', () => {
    const r = config.calculate({});
    expect(r).toHaveLength(0);
  });

  it('returns empty for zero salary', () => {
    const r = config.calculate({
      salaryAmount: '0',
      payFrequency: 'hourly',
    });
    expect(r).toHaveLength(0);
  });
});
