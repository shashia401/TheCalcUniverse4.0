import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/capital-gains-tax';
import { getValue, parseNumber, parseMoney, near } from '../../helpers';

describe('capital-gains-tax-calculator', () => {
  // === Holding Period Tests ===

  it('returns short-term for 180 day holding period', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2025-01-01',
      saleDate: '2025-06-30',
      costBasis: '10000',
      saleProceeds: '15000',
      annualIncome: '80000',
      filingStatus: 'Single',
      stateTaxRate: '0',
    });
    expect(getValue(r, 'holdingPeriod')).toContain('180');
    expect(getValue(r, 'holdingPeriodType')).toContain('Short-Term');
    expect(getValue(r, 'gainLoss')).toContain('5,000');
  });

  it('returns long-term for 400 day holding period', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2025-01-01',
      saleDate: '2026-02-05',
      costBasis: '10000',
      saleProceeds: '20000',
      annualIncome: '40000',
      filingStatus: 'Single',
      stateTaxRate: '0',
    });
    expect(getValue(r, 'holdingPeriodType')).toContain('Long-Term');
    expect(getValue(r, 'holdingPeriod')).toContain('400');
  });

  it('classifies exactly 365 days as short-term', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2025-01-01',
      saleDate: '2026-01-01',
      costBasis: '5000',
      saleProceeds: '10000',
      annualIncome: '50000',
      filingStatus: 'Single',
      stateTaxRate: '0',
    });
    expect(getValue(r, 'holdingPeriodType')).toContain('Short-Term');
  });

  it('classifies exactly 366 days as long-term', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2025-01-01',
      saleDate: '2026-01-02',
      costBasis: '5000',
      saleProceeds: '10000',
      annualIncome: '50000',
      filingStatus: 'Single',
      stateTaxRate: '0',
    });
    expect(getValue(r, 'holdingPeriodType')).toContain('Long-Term');
  });

  // === LTCG Rate Tests ===

  it('applies 0% LTCG rate for low-income bracket single filer', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2024-01-01',
      saleDate: '2026-01-01',
      costBasis: '10000',
      saleProceeds: '15000',
      annualIncome: '30000',
      filingStatus: 'Single',
      stateTaxRate: '0',
    });
    // Income 30000 + gain 5000 = 35000, which is below the 0% bracket max of 47025
    expect(getValue(r, 'federalTax')).toContain('$0.00');
    expect(getValue(r, 'gainLoss')).toContain('5,000');
    expect(getValue(r, 'effectiveRate')).toContain('0.00%');
  });

  it('applies 15% LTCG for mid-income single filer', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2024-01-01',
      saleDate: '2026-01-01',
      costBasis: '10000',
      saleProceeds: '30000',
      annualIncome: '80000',
      filingStatus: 'Single',
      stateTaxRate: '0',
    });
    // 80000 + 20000 = 100000, which is in 15% bracket
    const federalTax = parseMoney(getValue(r, 'federalTax'));
    // Federal tax should be ~15% of 20000 = 3000
    near(federalTax, 3000, 1);
  });

  it('applies 20% LTCG for high-income single filer', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2024-01-01',
      saleDate: '2026-01-01',
      costBasis: '50000',
      saleProceeds: '150000',
      annualIncome: '500000',
      filingStatus: 'Single',
      stateTaxRate: '0',
    });
    // 500000 + 100000 = 600000, which is > 518900 = 20% bracket
    const federalTax = parseMoney(getValue(r, 'federalTax'));
    near(federalTax, 20000, 1); // 20% of 100000
  });

  it('applies 0% LTCG for married filing jointly under threshold', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2024-01-01',
      saleDate: '2026-01-01',
      costBasis: '20000',
      saleProceeds: '50000',
      annualIncome: '50000',
      filingStatus: 'Married Filing Jointly',
      stateTaxRate: '0',
    });
    // 50000 + 30000 = 80000, which is below 94050 MFJ 0% threshold
    expect(getValue(r, 'federalTax')).toContain('$0.00');
  });

  it('applies 15% LTCG for head of household mid-range', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2024-01-01',
      saleDate: '2026-01-01',
      costBasis: '10000',
      saleProceeds: '40000',
      annualIncome: '80000',
      filingStatus: 'Head of Household',
      stateTaxRate: '0',
    });
    // 80000 + 30000 = 110000, which is in 15% bracket for HoH (63001-551350)
    const federalTax = parseMoney(getValue(r, 'federalTax'));
    near(federalTax, 4500, 1); // 15% of 30000
  });

  // === Short-Term Gains Tests ===

  it('taxes short-term gains at ordinary income rate (12% bracket)', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2025-06-01',
      saleDate: '2025-12-01',
      costBasis: '5000',
      saleProceeds: '10000',
      annualIncome: '30000',
      filingStatus: 'Single',
      stateTaxRate: '0',
    });
    // Short term, 30000 income = 12% marginal bracket
    const federalTax = parseMoney(getValue(r, 'federalTax'));
    near(federalTax, 600, 0.5); // 12% of 5000
  });

  it('taxes short-term gains at ordinary income rate (24% bracket)', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2025-06-01',
      saleDate: '2025-12-01',
      costBasis: '10000',
      saleProceeds: '30000',
      annualIncome: '120000',
      filingStatus: 'Single',
      stateTaxRate: '0',
    });
    // Short term, 120000 income = 24% marginal bracket
    const federalTax = parseMoney(getValue(r, 'federalTax'));
    near(federalTax, 4800, 0.5); // 24% of 20000
  });

  // === NIIT Tests ===

  it('triggers NIIT for high-income single filer', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2024-01-01',
      saleDate: '2026-01-01',
      costBasis: '10000',
      saleProceeds: '25000',
      annualIncome: '190000',
      filingStatus: 'Single',
      stateTaxRate: '0',
    });
    // AGI = 190000 + 15000 = 205000. NIIT threshold = 200000.
    // NIIT = min(15000, 5000) * 3.8% = 190
    expect(getValue(r, 'niitTax')).toBeTruthy();
    const niitValue = parseMoney(getValue(r, 'niitTax'));
    expect(niitValue).toBeGreaterThan(0);
    near(niitValue, 190, 5); // 3.8% of 5000 excess
  });

  it('does NOT trigger NIIT when AGI is below threshold', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2024-01-01',
      saleDate: '2026-01-01',
      costBasis: '4000',
      saleProceeds: '7000',
      annualIncome: '80000',
      filingStatus: 'Single',
      stateTaxRate: '0',
    });
    // AGI = 83000. Well below 200000 threshold. No NIIT.
    const niitResult = r.find((x) => x.id === 'niitTax');
    expect(niitResult).toBeUndefined();
  });

  it('triggers NIIT for married filing jointly above 250000', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2024-01-01',
      saleDate: '2026-01-01',
      costBasis: '20000',
      saleProceeds: '80000',
      annualIncome: '240000',
      filingStatus: 'Married Filing Jointly',
      stateTaxRate: '0',
    });
    // AGI = 300000. NIIT threshold MFJ = 250000. Excess = 50000.
    // Gain = 60000. NIIT = min(60000, 50000) * 3.8% = 1900
    expect(getValue(r, 'niitTax')).toBeTruthy();
    const niitValue = parseMoney(getValue(r, 'niitTax'));
    near(niitValue, 1900, 5);
  });

  // === State Tax Tests ===

  it('includes state tax when rate is provided', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2024-01-01',
      saleDate: '2026-01-01',
      costBasis: '10000',
      saleProceeds: '30000',
      annualIncome: '100000',
      filingStatus: 'Single',
      stateTaxRate: '5',
    });
    expect(getValue(r, 'stateTax')).toBeTruthy();
    const stateTax = parseMoney(getValue(r, 'stateTax'));
    // Gain = 20000, state tax = 20000 * 5% = 1000
    near(stateTax, 1000, 0.01);
  });

  it('does not show state tax row when rate results in zero', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2024-01-01',
      saleDate: '2026-01-01',
      costBasis: '10000',
      saleProceeds: '20000',
      annualIncome: '50000',
      filingStatus: 'Single',
      stateTaxRate: '0',
    });
    const stateTaxResult = r.find((x) => x.id === 'stateTax');
    if (stateTaxResult) {
      const stateTax = parseMoney(stateTaxResult.value);
      expect(stateTax).toBe(0);
    }
  });

  // === Capital Loss Tests ===

  it('reports capital loss correctly', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2025-01-01',
      saleDate: '2026-01-01',
      costBasis: '20000',
      saleProceeds: '15000',
      annualIncome: '80000',
      filingStatus: 'Single',
      stateTaxRate: '0',
    });
    expect(getValue(r, 'gainLoss')).toContain('-');
    const gain = parseMoney(getValue(r, 'gainLoss'));
    near(gain, -5000, 0.01);
    // Loss note should be present when there is a loss
    expect(r.find((x) => x.id === 'lossNote')).toBeTruthy();
  });

  // === Edge Case / Validation Tests ===

  it('returns empty when required fields are missing', () => {
    const r = config.calculate({
      purchaseDate: '',
      saleDate: '',
      costBasis: '',
      saleProceeds: '',
      annualIncome: '',
      filingStatus: 'Single',
      stateTaxRate: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty when cost basis is 0', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2024-01-01',
      saleDate: '2026-01-01',
      costBasis: '0',
      saleProceeds: '15000',
      annualIncome: '80000',
      filingStatus: 'Single',
      stateTaxRate: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty when sale proceeds is 0', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2024-01-01',
      saleDate: '2026-01-01',
      costBasis: '10000',
      saleProceeds: '0',
      annualIncome: '80000',
      filingStatus: 'Single',
      stateTaxRate: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for sale date before purchase date', () => {
    const r = config.calculate({
      purchaseDate: '2026-01-01',
      saleDate: '2025-01-01',
      costBasis: '10000',
      saleProceeds: '15000',
      annualIncome: '80000',
      filingStatus: 'Single',
      stateTaxRate: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for same purchase and sale date', () => {
    const r = config.calculate({
      purchaseDate: '2026-01-01',
      saleDate: '2026-01-01',
      costBasis: '10000',
      saleProceeds: '15000',
      annualIncome: '80000',
      filingStatus: 'Single',
      stateTaxRate: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid purchase date', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: 'not-a-date',
      saleDate: '2025-01-01',
      costBasis: '10000',
      saleProceeds: '15000',
      annualIncome: '80000',
      filingStatus: 'Single',
      stateTaxRate: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid sale date', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2024-01-01',
      saleDate: 'invalid',
      costBasis: '10000',
      saleProceeds: '15000',
      annualIncome: '80000',
      filingStatus: 'Single',
      stateTaxRate: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for non-numeric cost basis', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2024-01-01',
      saleDate: '2026-01-01',
      costBasis: 'abc',
      saleProceeds: '15000',
      annualIncome: '80000',
      filingStatus: 'Single',
      stateTaxRate: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for negative cost basis', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2024-01-01',
      saleDate: '2026-01-01',
      costBasis: '-1000',
      saleProceeds: '15000',
      annualIncome: '80000',
      filingStatus: 'Single',
      stateTaxRate: '0',
    });
    expect(r).toEqual([]);
  });

  // === Filing Status Tests ===

  it('handles married filing jointly status', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2024-01-01',
      saleDate: '2026-01-01',
      costBasis: '50000',
      saleProceeds: '100000',
      annualIncome: '80000',
      filingStatus: 'Married Filing Jointly',
      stateTaxRate: '0',
    });
    // Gain = 50000, Income + Gain = 130000, which is > 94050 MFJ 0% threshold => 15%
    expect(getValue(r, 'gainLoss')).toContain('50,000');
    const federalTax = parseMoney(getValue(r, 'federalTax'));
    expect(federalTax).toBeGreaterThan(0);
    near(federalTax, 7500, 1); // 15% of 50000
  });

  it('handles married filing separately status', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2024-01-01',
      saleDate: '2026-01-01',
      costBasis: '5000',
      saleProceeds: '15000',
      annualIncome: '60000',
      filingStatus: 'Married Filing Separately',
      stateTaxRate: '0',
    });
    expect(r.length).toBeGreaterThan(0);
    expect(getValue(r, 'gainLoss')).toContain('10,000');
  });

  it('handles head of household status', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2024-01-01',
      saleDate: '2026-01-01',
      costBasis: '10000',
      saleProceeds: '25000',
      annualIncome: '45000',
      filingStatus: 'Head of Household',
      stateTaxRate: '0',
    });
    expect(r.length).toBeGreaterThan(0);
    // Income 45000 + gain 15000 = 60000, which is below HoH 0% bracket max of 63000
    expect(getValue(r, 'federalTax')).toContain('$0.00');
  });

  // === Decimal.js Precision Tests ===

  it('handles fractional dollar amounts precisely with Decimal.js', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2024-01-01',
      saleDate: '2026-01-01',
      costBasis: '147.89',
      saleProceeds: '523.47',
      annualIncome: '45000',
      filingStatus: 'Single',
      stateTaxRate: '3.07',
    });
    const gain = parseMoney(getValue(r, 'gainLoss'));
    // 523.47 - 147.89 = 375.58
    near(gain, 375.58, 0.01);
    // State tax: 375.58 * 3.07% = 11.53
    const stateTax = parseMoney(getValue(r, 'stateTax'));
    near(stateTax, 11.53, 0.02);
  });

  it('handles large dollar amounts with Decimal.js', () => {
    const r = config.calculate({
      assetType: 'Real Estate',
      purchaseDate: '2010-01-01',
      saleDate: '2026-01-01',
      costBasis: '847362.15',
      saleProceeds: '1524031.89',
      annualIncome: '300000',
      filingStatus: 'Married Filing Jointly',
      stateTaxRate: '8.97',
    });
    const gain = parseMoney(getValue(r, 'gainLoss'));
    // 1524031.89 - 847362.15 = 676669.74
    near(gain, 676669.74, 0.10);
    expect(gain).toBeGreaterThan(0);
  });

  it('computes total tax as sum of components', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2024-01-01',
      saleDate: '2026-01-01',
      costBasis: '10000',
      saleProceeds: '30000',
      annualIncome: '250000',
      filingStatus: 'Single',
      stateTaxRate: '6',
    });
    const federalTax = parseMoney(getValue(r, 'federalTax'));
    const niitTaxStr = r.find((x) => x.id === 'niitTax');
    const niitTax = niitTaxStr ? parseMoney(niitTaxStr.value) : 0;
    const stateTax = parseMoney(getValue(r, 'stateTax'));
    const totalTax = parseMoney(getValue(r, 'totalTax'));
    // Total tax should equal federal + NIIT + state (within rounding)
    near(totalTax, federalTax + niitTax + stateTax, 0.03);
  });

  it('computes after-tax proceeds as saleProceeds - totalTax', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2024-01-01',
      saleDate: '2026-01-01',
      costBasis: '10000',
      saleProceeds: '25000',
      annualIncome: '100000',
      filingStatus: 'Single',
      stateTaxRate: '0',
    });
    const totalTax = parseMoney(getValue(r, 'totalTax'));
    const afterTax = parseMoney(getValue(r, 'afterTaxProceeds'));
    // afterTax = 25000 - totalTax
    near(afterTax, 25000 - totalTax, 0.02);
  });

  // === Demo values test ===

  it('produces results with default demo values', () => {
    const r = config.calculate({
      assetType: 'Stocks',
      purchaseDate: '2023-06-15',
      saleDate: '2025-06-15',
      costBasis: '10000',
      saleProceeds: '25000',
      annualIncome: '80000',
      filingStatus: 'Single',
      stateTaxRate: '0',
    });
    expect(r.length).toBeGreaterThan(0);
    expect(getValue(r, 'gainLoss')).toContain('15,000');
  });

  // === Empty fields survive Decimal parse ===

  it('returns empty for totally empty string inputs', () => {
    const r = config.calculate({
      purchaseDate: '',
      saleDate: '',
      costBasis: '',
      saleProceeds: '',
      annualIncome: '',
    } as Record<string, string>);
    expect(r).toEqual([]);
  });
});
