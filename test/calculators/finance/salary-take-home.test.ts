import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/salary-take-home';
import { getValue, parseMoney, parseNumber, near } from '../../helpers';

describe('salary-take-home (Salary Take-Home Pay Calculator)', () => {
  it('$75K single, no state tax — federal + FICA deducted, net is reasonable', () => {
    const r = config.calculate({
      annualSalary: '75000',
      filingStatus: 'single',
      state: 'none',
      payFrequency: 'monthly',
      preTaxDeductions: '0',
    });

    // Gross: $75,000
    const gross = parseMoney(getValue(r, 'grossAnnual'));
    near(gross, 75000);

    // Federal tax on $58,900 taxable (after $16,100 std deduction, 2026):
    //   10% on $0–$12,400 = $1,240.00
    //   12% on $12,400–$50,400 = $4,560.00
    //   22% on $50,400–$58,900 = $1,870.00
    //   Total federal = $7,670.00
    const federalTax = parseMoney(getValue(r, 'totalFederalTax'));
    near(federalTax, 7670.00);

    // FICA: $75K × 7.65% = $5,737.50
    const fica = parseMoney(getValue(r, 'totalFICA'));
    near(fica, 5737.50);

    // State tax: none → $0
    expect(getValue(r, 'totalStateTax')).toBe('$0.00 (No state tax)');

    // Total tax: $7,670 + $5,737.50 = $13,407.50
    const totalTax = parseMoney(getValue(r, 'totalTax'));
    near(totalTax, 13407.50);

    // Net annual: $75,000 – $13,407.50 = $61,592.50
    const netAnnual = parseMoney(getValue(r, 'netAnnual'));
    near(netAnnual, 61592.50);

    // Per paycheck (monthly): $61,592.50 / 12 ≈ $5,132.71
    const perPaycheck = parseMoney(getValue(r, 'perPaycheck'));
    near(perPaycheck, 61592.50 / 12, 0.02);
  });

  it('$150K married, CA — higher total tax than test 1 due to state tax', () => {
    const r = config.calculate({
      annualSalary: '150000',
      filingStatus: 'mfj',
      state: 'CA',
      payFrequency: 'monthly',
      preTaxDeductions: '0',
    });

    // State tax should be > 0 for CA
    const stateTax = parseMoney(getValue(r, 'totalStateTax'));
    expect(stateTax).toBeGreaterThan(0);

    // CA 2026 Schedule Y (FTB), taxable = 150,000 - 11,800 std = 138,200: 4,109.92 + 8% x (138,200 - 118,996) = 5,646.24 (python Decimal)
    near(stateTax, 5646.24);

    // Federal tax on $117,800 taxable (MFJ, $32,200 std deduction, 2026):
    //   10% on $0–$24,800 = $2,480
    //   12% on $24,800–$100,800 = $9,120
    //   22% on $100,800–$117,800 = $3,740
    //   Total = $15,340
    const federalTax = parseMoney(getValue(r, 'totalFederalTax'));
    near(federalTax, 15340.00);

    // Total tax should be higher than the single/no-state case (~$13,407.50)
    const totalTax = parseMoney(getValue(r, 'totalTax'));
    expect(totalTax).toBeGreaterThan(13407.50);

    // FICA: $150K (SS capped at $184,500, no cap on Medicare)
    //   SS: $150K × 6.2% = $9,300
    //   Medicare: $150K × 1.45% = $2,175
    //   Total = $11,475
    const fica = parseMoney(getValue(r, 'totalFICA'));
    near(fica, 11475.00);
  });

  it('Zero salary returns empty array', () => {
    const r = config.calculate({
      annualSalary: '0',
      filingStatus: 'single',
      state: 'none',
      payFrequency: 'monthly',
      preTaxDeductions: '0',
    });
    expect(r).toEqual([]);
  });

  it('Empty salary returns empty array', () => {
    const r = config.calculate({
      annualSalary: '',
      filingStatus: 'single',
      state: 'none',
      payFrequency: 'monthly',
      preTaxDeductions: '0',
    });
    expect(r).toEqual([]);
  });

  it('With 10% 401k deduction — lower net and lower taxable income', () => {
    const r = config.calculate({
      annualSalary: '75000',
      filingStatus: 'single',
      state: 'none',
      payFrequency: 'monthly',
      preTaxDeductions: '10',
    });

    // 10% of $75K = $7,500 pre-tax deduction
    const deductions = parseMoney(getValue(r, 'preTaxDeductions'));
    near(deductions, 7500.00);

    // Taxable income: $75K – $7,500 – $16,100 = $51,400
    const taxable = parseMoney(getValue(r, 'taxableIncome'));
    near(taxable, 51400.00);

    // Federal tax on $51,400 taxable (2026 brackets):
    //   10% on $0–$12,400 = $1,240.00
    //   12% on $12,400–$50,400 = $4,560.00
    //   22% on $50,400–$51,400 = $220.00
    //   Total = $6,020.00
    const federalTax = parseMoney(getValue(r, 'totalFederalTax'));
    near(federalTax, 6020.00);

    // FICA is still on full $75K (pre-tax 401k does NOT reduce FICA)
    const fica = parseMoney(getValue(r, 'totalFICA'));
    near(fica, 5737.50);

    // Net annual: $75K – $7,500 – $6,020 – $5,737.50 = $55,742.50
    const netAnnual = parseMoney(getValue(r, 'netAnnual'));
    near(netAnnual, 55742.50);

    // Net should be lower than the no-deduction case ($61,592.50)
    const rNoDed = config.calculate({
      annualSalary: '75000',
      filingStatus: 'single',
      state: 'none',
      payFrequency: 'monthly',
      preTaxDeductions: '0',
    });
    const netAnnualNoDed = parseMoney(getValue(rNoDed, 'netAnnual'));
    expect(netAnnual).toBeLessThan(netAnnualNoDed);
  });

  it('$300K MFJ in CA — additional Medicare surtax triggered', () => {
    const r = config.calculate({
      annualSalary: '300000',
      filingStatus: 'mfj',
      state: 'CA',
      payFrequency: 'monthly',
      preTaxDeductions: '0',
    });

    // FICA should include additional Medicare (0.9% on wages over $250K for MFJ)
    // SS: $184,500 × 6.2% = $11,439.00 (capped, 2026 wage base)
    // Medicare: $300K × 1.45% = $4,350
    // Additional: ($300K - $250K) × 0.9% = $450
    // Total: $11,439.00 + $4,350 + $450 = $16,239.00
    const fica = parseMoney(getValue(r, 'totalFICA'));
    near(fica, 16239.00);

    // CA MFJ 2026 Schedule Y (FTB), taxable = 300,000 - 11,800 = 288,200: 6,621.76 + 9.3% x (288,200 - 150,394) = 19,437.72 (python Decimal)
    const stateTax = parseMoney(getValue(r, 'totalStateTax'));
    near(stateTax, 19437.72);
  });

  it('$225K single — additional Medicare surtax on income over $200K', () => {
    const r = config.calculate({
      annualSalary: '225000',
      filingStatus: 'single',
      state: 'none',
      payFrequency: 'monthly',
      preTaxDeductions: '0',
    });

    // FICA: SS capped at $184,500 (2026 wage base)
    // SS: $184,500 × 6.2% = $11,439.00
    // Medicare: $225K × 1.45% = $3,262.50
    // Additional: ($225K - $200K) × 0.9% = $225
    // Total: $11,439.00 + $3,262.50 + $225 = $14,926.50
    const fica = parseMoney(getValue(r, 'totalFICA'));
    near(fica, 14926.50);
  });

  it('Bi-weekly vs monthly frequency — same net annual, different per-paycheck', () => {
    const rMonthly = config.calculate({
      annualSalary: '100000',
      filingStatus: 'single',
      state: 'none',
      payFrequency: 'monthly',
      preTaxDeductions: '0',
    });

    const rBiweekly = config.calculate({
      annualSalary: '100000',
      filingStatus: 'single',
      state: 'none',
      payFrequency: 'bi-weekly',
      preTaxDeductions: '0',
    });

    // Same net annual regardless of frequency
    const netAnnualMonthly = parseMoney(getValue(rMonthly, 'netAnnual'));
    const netAnnualBiweekly = parseMoney(getValue(rBiweekly, 'netAnnual'));
    near(netAnnualMonthly, netAnnualBiweekly);

    // Net annual for $100K single no state (2026 brackets):
    //   Taxable: $100K – $16.1K = $83.9K
    //   Fed tax: $1,240 + $4,560 + $7,370 = $13,170
    //   FICA: $6,200 + $1,450 = $7,650
    //   Total tax: $20,820
    //   Net: $79,180
    near(netAnnualMonthly, 79180);

    // Per-paycheck differs by frequency
    const perPayMonthly = parseMoney(getValue(rMonthly, 'perPaycheck'));
    const perPayBiweekly = parseMoney(getValue(rBiweekly, 'perPaycheck'));

    near(perPayMonthly, 79180 / 12, 0.02);
    near(perPayBiweekly, 79180 / 26, 0.02);

    // Per-paycheck amounts should be different
    expect(perPayMonthly).not.toBeCloseTo(perPayBiweekly, 1);
  });

  it('Negative salary returns empty array', () => {
    const r = config.calculate({
      annualSalary: '-50000',
      filingStatus: 'single',
      state: 'none',
      payFrequency: 'monthly',
      preTaxDeductions: '0',
    });
    expect(r).toEqual([]);
  });

  it('Shows effective tax rate', () => {
    const r = config.calculate({
      annualSalary: '75000',
      filingStatus: 'single',
      state: 'none',
      payFrequency: 'monthly',
      preTaxDeductions: '0',
    });

    const effRate = parseNumber(getValue(r, 'effectiveTaxRate'));
    // Effective rate = $13,407.50 / $75,000 * 100 ≈ 17.9%
    near(effRate, 17.9, 0.1);
  });
});
