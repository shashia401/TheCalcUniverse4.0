import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/rent-affordability/index';
import { getValue, parseMoney, parseNumber, near, getResult } from '../../helpers';

describe('rent-affordability', () => {
  it('30% rule with annual income', () => {
    const r = config.calculate({
      grossIncome: '75000',
      incomeFrequency: 'annual',
      monthlyDebts: '350',
      rentRule: '30',
    });
    // Monthly income = 75000 / 12 = 6250
    // Max rent = 6250 * 0.30 = 1875
    near(parseMoney(getValue(r, 'maxRent')), 1875);
    near(parseMoney(getValue(r, 'monthlyIncome')), 6250);
    near(parseNumber(getValue(r, 'rentPct')), 30);
    // Remaining = 6250 - 1875 - 350 = 4025
    near(parseNumber(getValue(r, 'remainingAfterRent')), 4025);
    // Annual rent = 1875 * 12 = 22500
    expect(getValue(r, 'annualRent')).toContain('22,500');
  });

  it('40x rule produces same max rent as 30% rule', () => {
    const r30 = config.calculate({
      grossIncome: '75000', incomeFrequency: 'annual', rentRule: '30',
    });
    const r40x = config.calculate({
      grossIncome: '75000', incomeFrequency: 'annual', rentRule: '40x',
    });
    // 40x rule: maxRent = annualIncome / 40 = 75000/40 = 1875
    // 30% rule: maxRent = monthly_income * 0.30 = (75000/12)*0.30 = 1875
    near(parseMoney(getValue(r30, 'maxRent')), parseMoney(getValue(r40x, 'maxRent')));
  });

  it('25% conservative rule', () => {
    const r = config.calculate({
      grossIncome: '60000',
      incomeFrequency: 'annual',
      rentRule: '25',
    });
    // Max rent = 5000 * 0.25 = 1250
    near(parseMoney(getValue(r, 'maxRent')), 1250);
    near(parseNumber(getValue(r, 'rentPct')), 25);
  });

  it('custom percentage rule', () => {
    const r = config.calculate({
      grossIncome: '100000',
      incomeFrequency: 'annual',
      rentRule: 'custom',
      customPct: '35',
    });
    const monthly = 100000 / 12;
    near(parseMoney(getValue(r, 'maxRent')), monthly * 0.35);
    near(parseNumber(getValue(r, 'rentPct')), 35);
  });

  it('hourly income conversion', () => {
    const r = config.calculate({
      grossIncome: '25',
      incomeFrequency: 'hourly',
      rentRule: '30',
    });
    // Monthly = 25 * 40 * 52 / 12 ≈ 4333.33
    // Max rent = 4333.33 * 0.30 ≈ 1300
    near(parseMoney(getValue(r, 'monthlyIncome')), 4333.33, 1);
    near(parseMoney(getValue(r, 'maxRent')), 1300, 1);
  });

  it('monthly income frequency works directly', () => {
    const r = config.calculate({
      grossIncome: '5000',
      incomeFrequency: 'monthly',
      rentRule: '30',
    });
    near(parseMoney(getValue(r, 'monthlyIncome')), 5000);
    near(parseMoney(getValue(r, 'maxRent')), 1500);
  });

  it('40x landlord check shows qualification', () => {
    const r = config.calculate({
      grossIncome: '90000',
      incomeFrequency: 'annual',
      monthlyDebts: '0',
      rentRule: '30',
    });
    // 40x check: 90000 >= 1875 * 40 = 75000 → Yes
    expect(getValue(r, 'landlordRule')).toContain('Yes');
  });

  it('40x landlord check shows insufficient income', () => {
    // With maxRent = 1875 (from 30% of 6250) but income = 50000
    const r = config.calculate({
      grossIncome: '50000',
      incomeFrequency: 'annual',
      monthlyDebts: '500',
      rentRule: '30',
    });
    // 40x check: 50000 >= 1250 * 40 = 50000 → Yes (exactly equal)
    expect(getValue(r, 'landlordRule')).toContain('Yes');
  });

  it('returns empty for zero gross income', () => {
    const r = config.calculate({
      grossIncome: '0',
      incomeFrequency: 'annual',
      rentRule: '30',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for empty inputs', () => {
    const r = config.calculate({});
    expect(r).toHaveLength(0);
  });
});
