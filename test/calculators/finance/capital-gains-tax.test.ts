import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/capital-gains-tax';
import { getValue, parseNumber, near } from '../../helpers';

describe('capital-gains-tax', () => {
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

  it('applies 0% LTCG rate for low-income bracket', () => {
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
  });

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
    const niitValue = parseNumber(getValue(r, 'niitTax'));
    expect(niitValue).toBeGreaterThan(0);
  });

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
    const stateTax = parseNumber(getValue(r, 'stateTax'));
    // Gain = 20000, state tax = 20000 * 5% = 1000
    near(stateTax, 1000, 0.01);
  });

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
    expect(getValue(r, 'gainLoss')).toContain('-5,000');
    expect(getValue(r, 'gainLoss')).toContain('-');
  });

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
    // Gain = 50000, Income + Gain = 130000, which is within MFJ 0% bracket (94050) and crosses into 15%
    // Total income 130k > 94050, so at least 15% rate
    expect(getValue(r, 'gainLoss')).toContain('50,000');
    expect(getValue(r, 'federalTax')).toBeTruthy();
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
});
