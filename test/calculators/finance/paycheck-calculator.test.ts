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

describe('paycheck audit (tax year 2026: Rev. Proc. 2025-32, SSA wage base $184,500)', () => {
  const base = { payMode: 'salary', annualSalary: '75000', payFrequency: 'biweekly', filingStatus: 'single', state: 'TX' };
  // Independent hand calc: 401(k) $5,000 -> income-tax wages 70,000 -> taxable 53,900
  // fed = 12,400*10% + 38,000*12% + 3,500*22% = 1,240 + 4,560 + 770 = 6,570; FICA on full 75,000 = 5,737.50
  // net = 75,000 - 6,570 - 5,737.50 - 5,000 = 57,692.50 -> /26 = 2,218.94
  it("Maria: 401(k) deferral cuts income tax but NOT FICA", () => {
    const r = config.calculate({ ...base, retirementContributions: '5000' });
    expect(getValue(r, 'netPaycheck')).toBe('$2,218.94');
    expect(getValue(r, 'fedPerPaycheck')).toBe('$252.69');
    expect(getValue(r, 'ficaPerPaycheck')).toBe('$220.67'); // 5,737.50 / 26
  });
  // HSA/health through a Section 125 plan: FICA wages 70,000 -> FICA 5,355; fed same 6,570 -> net 58,075 -> 2,233.65
  it('Section 125 benefits cut FICA as well', () => {
    const r = config.calculate({ ...base, preTaxDeductions: '5000' });
    expect(getValue(r, 'netPaycheck')).toBe('$2,233.65');
    expect(getValue(r, 'ficaPerPaycheck')).toBe('$205.96'); // 5,355 / 26
  });
  // James: $52,000 CA single. fed taxable 35,900 -> 1,240 + 2,820 = 4,060; FICA 3,978;
  // CA (FTB 2026 Schedule X): taxable 52,000-5,900 = 46,100 -> 1,251.08 (python Decimal, FTB base + rate form) -> net 42,710.92 -> /52 = 821.36
  it("James: California bracketed tax is $1,251.08/yr (about $24.06/week), not a flat 9.3%", () => {
    const r = config.calculate({ payMode: 'hourly', hourlyWage: '25', hoursPerWeek: '40', payFrequency: 'weekly', filingStatus: 'single', state: 'CA' });
    expect(getValue(r, 'statePerPaycheck')).toBe('$24.06');
    expect(getValue(r, 'netPaycheck')).toBe('$821.36');
    expect(getValue(r, 'fedPerPaycheck')).toBe('$78.08');
  });
  // $300,000 single: SS 184,500*6.2% = 11,439; Medicare 4,350; Additional Medicare (300,000-200,000)*0.9% = 900 -> 16,689
  it('FICA caps Social Security at the 2026 wage base and adds 0.9% Medicare over $200,000', () => {
    const r = config.calculate({ ...base, annualSalary: '300000' });
    expect(getValue(r, 'ficaPerPaycheck')).toBe('$641.88'); // 16,689 / 26
    // fed: taxable 283,900 -> 68,134.25 -> 2,620.55/paycheck; marginal 35%
    expect(getValue(r, 'fedPerPaycheck')).toBe('$2,620.55');
    expect(getValue(r, 'marginalRate')).toBe('35%');
  });
  it('married filing jointly uses the $32,200 deduction and MFJ brackets ($75,000 -> taxable 42,800)', () => {
    // 24,800*10% = 2,480; (42,800-24,800)*12% = 2,160 -> 4,640
    const r = config.calculate({ ...base, filingStatus: 'mfj' });
    expect(getValue(r, 'fedPerPaycheck')).toBe('$178.46'); // 4,640 / 26
  });
  it('take-home share counts pre-tax deductions as money not received', () => {
    const r = config.calculate({ ...base, retirementContributions: '5000' });
    // 57,692.50 / 75,000 = 76.9% -> "77%"
    expect(r.find((x) => x.id === 'netPaycheck')!.interpretation).toContain('about 77% of gross');
  });
  it('deductions larger than pay never produce negative or NaN output', () => {
    const r = config.calculate({ ...base, retirementContributions: '90000', preTaxDeductions: '90000' });
    r.forEach((x) => expect(String(x.value)).not.toMatch(/NaN|Infinity/));
  });
});
