import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/mutual-fund/index';
import { getValue, parseMoney } from '../../helpers';

describe('mutual fund calculator', () => {
  it('projects growth with fees for typical scenario', () => {
    const r = config.calculate({
      initialInvestment: '10000',
      monthlyContribution: '500',
      expectedReturn: '8',
      expenseRatio: '0.75',
      investmentYears: '20',
    });
    const withFees = parseMoney(getValue(r, 'withFees'));
    const totalContrib = parseMoney(getValue(r, 'totalContributions'));
    expect(withFees).toBeGreaterThan(totalContrib);
    expect(withFees).toBeGreaterThan(200000);
  });

  it('shows fees cost money over long timeframes', () => {
    const r = config.calculate({
      initialInvestment: '10000',
      monthlyContribution: '500',
      expectedReturn: '8',
      expenseRatio: '1.5',
      investmentYears: '30',
    });
    const feeImpactStr = getValue(r, 'feeImpact');
    // feeImpact should contain amount and percentage
    expect(feeImpactStr).toContain('K');
    expect(feeImpactStr).toContain('%');
    // withoutFees > withFees confirms fees reduce returns
    const withoutFees = parseMoney(getValue(r, 'withoutFees'));
    const withFees = parseMoney(getValue(r, 'withFees'));
    expect(withoutFees).toBeGreaterThan(withFees);
  });

  it('returns empty array for invalid inputs (empty initialInvestment)', () => {
    const r = config.calculate({
      initialInvestment: '',
      monthlyContribution: '500',
      expectedReturn: '8',
      expenseRatio: '0.75',
      investmentYears: '20',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for NaN inputs', () => {
    const r = config.calculate({
      initialInvestment: 'abc',
      monthlyContribution: '500',
      expectedReturn: '8',
      expenseRatio: '0.75',
      investmentYears: '20',
    });
    expect(r).toEqual([]);
  });

  it('handles zero expense ratio (fees and without-fees should match)', () => {
    const r = config.calculate({
      initialInvestment: '10000',
      monthlyContribution: '0',
      expectedReturn: '7',
      expenseRatio: '0',
      investmentYears: '10',
    });
    const withFees = parseMoney(getValue(r, 'withFees'));
    const withoutFees = parseMoney(getValue(r, 'withoutFees'));
    // With zero expense ratio, withFees and withoutFees should be very close
    const ratio = withFees / withoutFees;
    expect(ratio).toBeGreaterThan(0.99);
    expect(ratio).toBeLessThan(1.01);
  });

  it('handles zero monthly contribution', () => {
    const r = config.calculate({
      initialInvestment: '50000',
      monthlyContribution: '0',
      expectedReturn: '8',
      expenseRatio: '0.5',
      investmentYears: '15',
    });
    const totalContrib = parseMoney(getValue(r, 'totalContributions'));
    expect(totalContrib).toBe(50000); // only initial
    const withFees = parseMoney(getValue(r, 'withFees'));
    expect(withFees).toBeGreaterThan(50000); // growth happened
  });

  it('handles zero initial investment with monthly contributions only', () => {
    const r = config.calculate({
      initialInvestment: '0',
      monthlyContribution: '1000',
      expectedReturn: '7',
      expenseRatio: '0.2',
      investmentYears: '10',
    });
    const totalContrib = parseMoney(getValue(r, 'totalContributions'));
    expect(totalContrib).toBe(120000); // 1000 * 12 * 10
    const withFees = parseMoney(getValue(r, 'withFees'));
    expect(withFees).toBeGreaterThan(totalContrib);
  });

  it('returns empty for zero years', () => {
    const r = config.calculate({
      initialInvestment: '10000',
      monthlyContribution: '500',
      expectedReturn: '8',
      expenseRatio: '0.75',
      investmentYears: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for negative years', () => {
    const r = config.calculate({
      initialInvestment: '10000',
      monthlyContribution: '500',
      expectedReturn: '8',
      expenseRatio: '0.75',
      investmentYears: '-3',
    });
    expect(r).toEqual([]);
  });

  it('computes and displays net return after fees', () => {
    const r = config.calculate({
      initialInvestment: '10000',
      monthlyContribution: '500',
      expectedReturn: '8',
      expenseRatio: '1',
      investmentYears: '10',
    });
    const netReturn = getValue(r, 'netReturn');
    // 8% - 1% = 7% net
    expect(netReturn).toContain('7.00%');
  });

  it('fee impact increases with higher expense ratio', () => {
    const lowFee = config.calculate({
      initialInvestment: '10000',
      monthlyContribution: '500',
      expectedReturn: '8',
      expenseRatio: '0.1',
      investmentYears: '20',
    });
    const highFee = config.calculate({
      initialInvestment: '10000',
      monthlyContribution: '500',
      expectedReturn: '8',
      expenseRatio: '2',
      investmentYears: '20',
    });
    const lowWith = parseMoney(getValue(lowFee, 'withFees'));
    const highWith = parseMoney(getValue(highFee, 'withFees'));
    // Lower fees = more money
    expect(lowWith).toBeGreaterThan(highWith);
  });

  it('reports contribution percentage correctly', () => {
    const r = config.calculate({
      initialInvestment: '10000',
      monthlyContribution: '500',
      expectedReturn: '8',
      expenseRatio: '0.5',
      investmentYears: '20',
    });
    const contPct = getValue(r, 'contributionPct');
    // Contributions ($130K) should be a fraction of final balance (~$300K+)
    const pct = parseInt(contPct, 10);
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThan(100);
  });
});
