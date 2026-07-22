import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/realestate/rent-vs-buy/index';
import { getValue, parseMoney, parseNumber } from '../../helpers';

describe('Rent vs Buy Calculator', () => {
  it('returns results for valid inputs', () => {
    const results = config.calculate({
      homePrice: '400000',
      downPaymentPct: '20',
      interestRate: '6.8',
      closingCostsPct: '3',
      propertyTaxPct: '1.2',
      maintenancePct: '1.5',
      homeAppreciation: '3',
      monthlyRent: '2000',
      rentIncrease: '3',
      rentersInsurance: '200',
      years: '7',
    });
    expect(results.length).toBeGreaterThan(0);
    const netBuy = parseMoney(getValue(results, 'netBuyCost'));
    const netRent = parseMoney(getValue(results, 'netRentCost'));
    expect(netBuy).toBeGreaterThan(0);
    expect(netRent).toBeGreaterThan(0);
  });

  it('provides a break-even recommendation', () => {
    const results = config.calculate({
      homePrice: '400000',
      downPaymentPct: '20',
      interestRate: '6.8',
      closingCostsPct: '3',
      propertyTaxPct: '1.2',
      maintenancePct: '1.5',
      homeAppreciation: '3',
      monthlyRent: '2000',
      rentIncrease: '3',
      rentersInsurance: '200',
      years: '3',
    });
    // Short horizon: break-even likely not reached
    expect(getValue(results, 'breakEven')).toBeTruthy();
    const recommendationValue = getValue(results, 'recommendation');
    expect(recommendationValue).toMatch(/^\$/);
  });

  it('has all required result IDs', () => {
    const results = config.calculate({
      homePrice: '400000',
      downPaymentPct: '20',
      interestRate: '6.8',
      closingCostsPct: '3',
      propertyTaxPct: '1.2',
      maintenancePct: '1.5',
      homeAppreciation: '3',
      monthlyRent: '2000',
      rentIncrease: '3',
      rentersInsurance: '200',
      years: '7',
    });
    const ids = results.map((r) => r.id);
    expect(ids).toContain('breakEven');
    expect(ids).toContain('recommendation');
    expect(ids).toContain('netBuyCost');
    expect(ids).toContain('netRentCost');
    expect(ids).toContain('homeEquity');
    expect(ids).toContain('futureHomeValue');
    expect(ids).toContain('totalMonthlyBuy');
    expect(ids).toContain('closingCostsLine');
  });

  it('shows closing costs', () => {
    const results = config.calculate({
      homePrice: '400000',
      downPaymentPct: '20',
      interestRate: '6.8',
      closingCostsPct: '3',
      propertyTaxPct: '1.2',
      maintenancePct: '1.5',
      homeAppreciation: '3',
      monthlyRent: '2000',
      rentIncrease: '3',
      rentersInsurance: '200',
      years: '7',
    });
    const closing = parseMoney(getValue(results, 'closingCostsLine'));
    near(parseFloat(closing.toString()), 12000, 100); // 3% of 400k
  });

  it('returns empty for missing inputs', () => {
    const results = config.calculate({
      homePrice: '',
      downPaymentPct: '',
      interestRate: '',
      closingCostsPct: '',
      propertyTaxPct: '',
      maintenancePct: '',
      homeAppreciation: '',
      monthlyRent: '',
      rentIncrease: '',
      rentersInsurance: '',
      years: '',
    });
    expect(results).toEqual([]);
  });
});

function near(actual: number, expected: number, tolerance = 0.01) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}
