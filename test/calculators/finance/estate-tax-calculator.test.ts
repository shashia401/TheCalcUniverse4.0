import { describe, it, expect } from 'vitest';
import estateTaxConfig from '../../../src/calculators/finance/estate-tax/index';

describe('Estate Tax Calculator', () => {
  // Helper: find result by id
  const find = (results: ReturnType<typeof estateTaxConfig.calculate>, id: string) =>
    results.find((r) => r.id === id)?.value ?? '';

  // Helper: extract numeric dollar value from result string
  const dollars = (val: string): number => {
    // Handle "$2.27M" or "$13.99M" format
    const m = val.match(/([\d.]+)M/);
    if (m) return parseFloat(m[1]) * 1_000_000;
    // Handle plain "$500,000" format
    const cleaned = val.replace(/[^0-9.]/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  };

  it('returns zero federal tax when estate is below exemption', () => {
    const results = estateTaxConfig.calculate({
      totalAssets: '1000000',
      debtsDeductions: '0',
      filingStatus: 'single',
      stateResidence: 'none',
    });

    const fedTax = find(results, 'federalTax');
    expect(fedTax).toContain('$0');
  });

  it('calculates federal tax correctly for a $20M estate (single filer)', () => {
    // $20M gross, $200K debts, single → adjusted $19.8M
    // Exemption $13.99M → taxable $5.81M
    // Graduated brackets 18-40% → est. tax ~$2.29M
    const results = estateTaxConfig.calculate({
      totalAssets: '20000000',
      debtsDeductions: '200000',
      filingStatus: 'single',
      stateResidence: 'none',
    });

    const fedTaxable = find(results, 'federalTaxableEstate');
    expect(fedTaxable).toContain('5.81M');

    const fedTax = find(results, 'federalTax');
    // Expected: ~$2.29M federal tax
    const taxAmount = dollars(fedTax);
    expect(taxAmount).toBeGreaterThan(2_200_000);
    expect(taxAmount).toBeLessThan(2_400_000);
  });

  it('doubles exemption for married filing status', () => {
    const single = estateTaxConfig.calculate({
      totalAssets: '15000000',
      debtsDeductions: '0',
      filingStatus: 'single',
      stateResidence: 'none',
    });

    const married = estateTaxConfig.calculate({
      totalAssets: '15000000',
      debtsDeductions: '0',
      filingStatus: 'married',
      stateResidence: 'none',
    });

    const singleTax = dollars(find(single, 'federalTax'));
    const marriedTax = dollars(find(married, 'federalTax'));

    // Married should pay less (higher exemption)
    // $15M is above single exemption ($13.99M) but below married ($27.98M)
    expect(singleTax).toBeGreaterThan(0);
    expect(marriedTax).toBe(0);
  });

  it('returns empty array for zero or negative total assets', () => {
    expect(estateTaxConfig.calculate({ totalAssets: '0' })).toEqual([]);
    expect(estateTaxConfig.calculate({ totalAssets: '-100' })).toEqual([]);
    expect(estateTaxConfig.calculate({})).toEqual([]);
  });

  it('includes state tax info when a state-with-tax is selected', () => {
    const noState = estateTaxConfig.calculate({
      totalAssets: '20000000',
      debtsDeductions: '0',
      filingStatus: 'single',
      stateResidence: 'none',
    });

    const withOregon = estateTaxConfig.calculate({
      totalAssets: '20000000',
      debtsDeductions: '0',
      filingStatus: 'single',
      stateResidence: 'OR',
    });

    // Oregon has a $1M exemption, so should show state tax
    const stateTaxOR = find(withOregon, 'stateTax');
    const stateTaxNone = find(noState, 'stateTax');

    expect(stateTaxOR).toBeTruthy();
    expect(stateTaxNone).toBeFalsy();
  });

  it('shows effective rate when tax is owed', () => {
    const results = estateTaxConfig.calculate({
      totalAssets: '20000000',
      debtsDeductions: '0',
      filingStatus: 'single',
      stateResidence: 'none',
    });

    const effectiveRate = find(results, 'effectiveRate');
    expect(effectiveRate).toBeTruthy();
    // Effective rate for $20M estate should be ~10-15%
    const rate = parseFloat(effectiveRate);
    expect(rate).toBeGreaterThan(5);
    expect(rate).toBeLessThan(25);
  });
});
