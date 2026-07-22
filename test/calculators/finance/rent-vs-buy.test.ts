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
