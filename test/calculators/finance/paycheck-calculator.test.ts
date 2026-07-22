import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/paycheck-calculator/index';
import { getValue, parseMoney } from '../../helpers';

describe('paycheck calculator', () => {
  it('calculates salary paycheck', () => {
    const r = config.calculate({
      payMode: 'salary',
      annualSalary: '75000',
      hourlyWage: '',
      hoursPerWeek: '40',
      payFrequency: 'biweekly',
      filingStatus: 'single',
      state: 'TX',
      preTaxDeductions: '0',
    });
    const netPaycheck = parseMoney(getValue(r, 'netPaycheck'));
    expect(netPaycheck).toBeGreaterThan(2000);
    expect(netPaycheck).toBeLessThan(3000);
  });

  it('calculates hourly paycheck', () => {
    const r = config.calculate({
      payMode: 'hourly',
      annualSalary: '',
      hourlyWage: '25',
      hoursPerWeek: '40',
      payFrequency: 'weekly',
      filingStatus: 'single',
      state: 'FL',
      preTaxDeductions: '0',
    });
    const netPaycheck = parseMoney(getValue(r, 'netPaycheck'));
    expect(netPaycheck).toBeGreaterThan(600);
    expect(netPaycheck).toBeLessThan(900);
  });

  it('shows federal marg/eff rates', () => {
    const r = config.calculate({
      payMode: 'salary',
      annualSalary: '100000',
      hourlyWage: '',
      hoursPerWeek: '40',
      payFrequency: 'biweekly',
      filingStatus: 'single',
      state: 'NY',
      preTaxDeductions: '0',
    });
    const margRate = getValue(r, 'marginalRate');
    expect(margRate).toBe('22%');
  });

  it('returns empty for zero salary', () => {
    const r = config.calculate({
      payMode: 'salary',
      annualSalary: '0',
      hourlyWage: '',
      hoursPerWeek: '40',
      payFrequency: 'biweekly',
      filingStatus: 'single',
      state: 'TX',
      preTaxDeductions: '0',
    });
    expect(r).toEqual([]);
  });

  it('shows state tax for CA', () => {
    const r = config.calculate({
      payMode: 'salary',
      annualSalary: '100000',
      hourlyWage: '',
      hoursPerWeek: '40',
      payFrequency: 'biweekly',
      filingStatus: 'single',
      state: 'CA',
      preTaxDeductions: '0',
    });
    const statePerPaycheck = parseMoney(getValue(r, 'statePerPaycheck'));
    expect(statePerPaycheck).toBeGreaterThan(0);
  });
});
