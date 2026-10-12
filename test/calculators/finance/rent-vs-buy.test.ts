import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/rent-vs-buy';
import { getValue, near, parseMoney } from '../../helpers';

describe('rent-vs-buy', () => {
  it('returns break-even and verdict with typical inputs', () => {
    const r = config.calculate({
      monthlyRent: '2200',
      homePrice: '400000',
      mortgageRate: '6.75',
      yearsToStay: '7',
    });
    expect(getValue(r, 'breakEvenResult')).toBeTruthy();
    expect(getValue(r, 'selectedYearVerdict')).toBeTruthy();
    expect(getValue(r, 'buyingTotalCost')).toBeTruthy();
    expect(getValue(r, 'rentingTotalCost')).toBeTruthy();
    expect(getValue(r, 'homeValueAtHorizon')).toBeTruthy();
  });

  it('buying total cost increases with higher home price', () => {
    const r1 = config.calculate({
      monthlyRent: '2000',
      homePrice: '300000',
      mortgageRate: '6',
      yearsToStay: '5',
    });
    const r2 = config.calculate({
      monthlyRent: '2000',
      homePrice: '600000',
      mortgageRate: '6',
      yearsToStay: '5',
    });
    const cost1 = parseMoney(getValue(r1, 'buyingTotalCost'));
    const cost2 = parseMoney(getValue(r2, 'buyingTotalCost'));
    expect(cost2).toBeGreaterThan(cost1);
  });

  it('higher rent makes buying relatively cheaper', () => {
    const r1 = config.calculate({
      monthlyRent: '1000',
      homePrice: '300000',
      mortgageRate: '6',
      yearsToStay: '10',
    });
    const r2 = config.calculate({
      monthlyRent: '4000',
      homePrice: '300000',
      mortgageRate: '6',
      yearsToStay: '10',
    });
    const rentCost1 = parseMoney(getValue(r1, 'rentingTotalCost'));
    const rentCost2 = parseMoney(getValue(r2, 'rentingTotalCost'));
    expect(rentCost2).toBeGreaterThan(rentCost1);
  });

  it('projected home value grows with appreciation', () => {
    const r = config.calculate({
      monthlyRent: '2000',
      homePrice: '400000',
      mortgageRate: '6',
      annualRentIncrease: '3',
      homeAppreciationRate: '4',
      yearsToStay: '10',
    });
    // 400000 * 1.04^10 ≈ 592,097
    const expected = 400000 * Math.pow(1.04, 10);
    near(parseMoney(getValue(r, 'homeValueAtHorizon')), expected, 100);
  });

  it('returns empty when required fields are missing', () => {
    const r = config.calculate({
      monthlyRent: '',
      homePrice: '400000',
      mortgageRate: '6',
      yearsToStay: '7',
    });
    expect(r).toEqual([]);
  });

  it('returns empty when home price is missing', () => {
    const r = config.calculate({
      monthlyRent: '2000',
      homePrice: '',
      mortgageRate: '6',
      yearsToStay: '7',
    });
    expect(r).toEqual([]);
  });

  it('handles minimum yearsToStay clamp', () => {
    const r = config.calculate({
      monthlyRent: '1500',
      homePrice: '250000',
      mortgageRate: '5.5',
      yearsToStay: '0',
    });
    expect(r.length).toBeGreaterThan(0);
    expect(getValue(r, 'breakEvenResult')).toBeTruthy();
  });

  it('includes _rvbData with chart/break-even info', () => {
    const r = config.calculate({
      monthlyRent: '1800',
      homePrice: '350000',
      mortgageRate: '6.5',
      yearsToStay: '5',
    });
    const data = JSON.parse(getValue(r, '_rvbData'));
    expect(data).toHaveProperty('breakEvenYear');
    expect(data).toHaveProperty('chartData');
    expect(data).toHaveProperty('selectedYear', 5);
    expect(data).toHaveProperty('homePrice', 350000);
  });
});

import { getValue as gvRvb } from '../../helpers';
import realEstateRvb from '../../../src/calculators/realestate/rent-vs-buy/index';
import { numOr } from '../../../src/calculators/finance/rent-vs-buy/model';

describe('rent-vs-buy audit (finance + realestate twin)', () => {
  // Independent month-by-month simulation (node): $400k, 20% down, 6.8%, closing 3%, tax 1.2%, maint 1.5%,
  // insurance 0.5%, 3% appreciation, 6% selling, rent $2,000 +3%/yr, renter's ins $200, 7 years, 7% opportunity return:
  // buy net cost 190,457.77 ; rent net cost 129,567.20 (rent 185,299.09 - invested growth 55,731.90)
  const fin = { monthlyRent: '2000', annualRentIncrease: '3', rentersInsurance: '200', homePrice: '400000', downPaymentPct: '20', mortgageRate: '6.8',
    closingCostsPct: '3', propertyTaxRate: '1.2', maintenancePct: '1.5', homeInsurancePct: '0.5', homeAppreciationRate: '3', sellingCostsPct: '6', pmiRate: '0.7', yearsToStay: '7' };
  const re = { homePrice: '400000', downPaymentPct: '20', interestRate: '6.8', closingCostsPct: '3', propertyTaxPct: '1.2', maintenancePct: '1.5',
    homeAppreciation: '3', monthlyRent: '2000', rentIncrease: '3', rentersInsurance: '200', years: '7' };

  it('finance version matches the independent simulation', () => {
    const r = config.calculate(fin);
    expect(gvRvb(r, 'buyingTotalCost')).toBe('$190,458');
    expect(gvRvb(r, 'rentingTotalCost')).toBe('$129,567');
    expect(gvRvb(r, 'selectedYearVerdict')).toBe('$60,891');
  });
  it('real-estate twin gives the same net costs for the same inputs', () => {
    const r = realEstateRvb.calculate(re);
    expect(gvRvb(r, 'netBuyCost')).toBe('$190,458');
    expect(gvRvb(r, 'netRentCost')).toBe('$129,567');
  });
  it('explicit zero inputs are respected (0% appreciation / 0% rent growth used to silently become 3%)', () => {
    const flat = config.calculate({ ...fin, homeAppreciationRate: '0', annualRentIncrease: '0' });
    const dflt = config.calculate(fin);
    expect(gvRvb(flat, 'homeValueAtHorizon')).toBe('$400,000');
    expect(gvRvb(flat, 'buyingTotalCost')).not.toBe(gvRvb(dflt, 'buyingTotalCost'));
    expect(gvRvb(flat, 'rentingTotalCost')).not.toBe(gvRvb(dflt, 'rentingTotalCost'));
  });
  it('blank optional inputs fall back to defaults; numOr keeps 0', () => {
    expect(numOr('', 3)).toBe(3);
    expect(numOr('0', 3)).toBe(0);
  });
  it('homeowner insurance is part of the buying cost', () => {
    const withIns = gvRvb(config.calculate(fin), 'buyingTotalCost');
    const noIns = gvRvb(config.calculate({ ...fin, homeInsurancePct: '0' }), 'buyingTotalCost');
    // 0.5% of a growing home value over 7 years: 2,000 x sum(1.03^(y-1), y=1..7) = 15,3xx
    const diff = Number(withIns.replace(/[$,]/g, '')) - Number(noIns.replace(/[$,]/g, ''));
    expect(diff).toBeCloseTo(2000 * ((1.03 ** 7 - 1) / 0.03), -1);
  });
});
