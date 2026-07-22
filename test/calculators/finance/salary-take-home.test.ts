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

    // Federal tax on $60K taxable (after $15K std deduction):
    //   10% on $0–$11,925 = $1,192.50
    //   12% on $11,925–$48,475 = $4,386.00
    //   22% on $48,475–$60,000 = $2,535.50
    //   Total federal = $8,114.00
    const federalTax = parseMoney(getValue(r, 'totalFederalTax'));
    near(federalTax, 8114.00);

    // FICA: $75K × 7.65% = $5,737.50
    const fica = parseMoney(getValue(r, 'totalFICA'));
    near(fica, 5737.50);

    // State tax: none → $0
    expect(getValue(r, 'totalStateTax')).toBe('$0.00 (No state tax)');

    // Total tax: $8,114 + $5,737.50 = $13,851.50
    const totalTax = parseMoney(getValue(r, 'totalTax'));
    near(totalTax, 13851.50);

    // Net annual: $75,000 – $13,851.50 = $61,148.50
    const netAnnual = parseMoney(getValue(r, 'netAnnual'));
    near(netAnnual, 61148.50);

    // Per paycheck (monthly): $61,148.50 / 12 ≈ $5,095.71
    const perPaycheck = parseMoney(getValue(r, 'perPaycheck'));
    near(perPaycheck, 61148.50 / 12, 0.02);
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

    // State tax should be ~$13,950 ($150K × 9.3%)
    near(stateTax, 13950.00);

    // Federal tax on $120K taxable (MFJ, $30K std deduction):
    //   10% on $0–$23,850 = $2,385
    //   12% on $23,850–$96,950 = $8,772
    //   22% on $96,950–$120,000 = $5,071
    //   Total = $16,228
    const federalTax = parseMoney(getValue(r, 'totalFederalTax'));
    near(federalTax, 16228.00);

    // Total tax should be higher than the single/no-state case (~$13,851)
    const totalTax = parseMoney(getValue(r, 'totalTax'));
    expect(totalTax).toBeGreaterThan(13851.50);

    // FICA: $150K (SS capped at $176,100, no cap on Medicare)
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

    // Taxable income: $75K – $7,500 – $15,000 = $52,500
    const taxable = parseMoney(getValue(r, 'taxableIncome'));
    near(taxable, 52500.00);

    // Federal tax on $52,500 taxable:
    //   10% on $0–$11,925 = $1,192.50
    //   12% on $11,925–$48,475 = $4,386.00
    //   22% on $48,475–$52,500 = $885.50
    //   Total = $6,464.00
    const federalTax = parseMoney(getValue(r, 'totalFederalTax'));
    near(federalTax, 6464.00);

    // FICA is still on full $75K (pre-tax 401k does NOT reduce FICA)
    const fica = parseMoney(getValue(r, 'totalFICA'));
    near(fica, 5737.50);

    // Net annual: $75K – $7,500 – $6,464 – $5,737.50 = $55,298.50
    const netAnnual = parseMoney(getValue(r, 'netAnnual'));
    near(netAnnual, 55298.50);

    // Net should be lower than the no-deduction case ($61,148.50)
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
    // SS: $176,100 × 6.2% = $10,918.20 (capped)
    // Medicare: $300K × 1.45% = $4,350
    // Additional: ($300K - $250K) × 0.9% = $450
    // Total: $10,918.20 + $4,350 + $450 = $15,718.20
    const fica = parseMoney(getValue(r, 'totalFICA'));
    near(fica, 15718.20);

    // CA state tax: $300K × 9.3% = $27,900
    const stateTax = parseMoney(getValue(r, 'totalStateTax'));
    near(stateTax, 27900);
  });

  it('$225K single — additional Medicare surtax on income over $200K', () => {
    const r = config.calculate({
      annualSalary: '225000',
      filingStatus: 'single',
      state: 'none',
      payFrequency: 'monthly',
      preTaxDeductions: '0',
    });

    // FICA: SS capped at $176,100
    // SS: $176,100 × 6.2% = $10,918.20
    // Medicare: $225K × 1.45% = $3,262.50
    // Additional: ($225K - $200K) × 0.9% = $225
    // Total: $10,918.20 + $3,262.50 + $225 = $14,405.70
    const fica = parseMoney(getValue(r, 'totalFICA'));
    near(fica, 14405.70);
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

    // Net annual for $100K single no state:
    //   Taxable: $100K – $15K = $85K
    //   Fed tax: $1,192.50 + $4,386 + $8,035.50 = $13,614
    //   FICA: $6,200 + $1,450 = $7,650
    //   Total tax: $21,264
    //   Net: $78,736
    near(netAnnualMonthly, 78736);

    // Per-paycheck differs by frequency
    const perPayMonthly = parseMoney(getValue(rMonthly, 'perPaycheck'));
    const perPayBiweekly = parseMoney(getValue(rBiweekly, 'perPaycheck'));

    near(perPayMonthly, 78736 / 12, 0.02);
    near(perPayBiweekly, 78736 / 26, 0.02);

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
    // Effective rate = $13,851.50 / $75,000 * 100 ≈ 18.5%
    near(effRate, 18.5, 0.1);
  });
});
