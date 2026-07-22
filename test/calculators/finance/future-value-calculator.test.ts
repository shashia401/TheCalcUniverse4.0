import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/future-value/index';
import { getValue, parseMoney, parseNumber } from '../../helpers';

describe('future value calculator', () => {
  it('calculates FV with annual compounding', () => {
    const r = config.calculate({
      presentValue: '10000',
      annualRate: '7',
      years: '10',
      compounding: '1',
      monthlyContribution: '0',
    });
    const fv = parseMoney(getValue(r, 'futureValue'));
    // 10000 * (1.07)^10 ≈ 19671.5
    expect(fv).toBeGreaterThan(19000);
    expect(fv).toBeLessThan(21000);
  });

  it('includes monthly contributions', () => {
    const r = config.calculate({
      presentValue: '10000',
      annualRate: '7',
      years: '10',
      compounding: '12',
      monthlyContribution: '500',
    });
    const fv = parseMoney(getValue(r, 'futureValue'));
    const principal = parseMoney(getValue(r, 'totalPrincipal'));
    expect(fv).toBeGreaterThan(principal);
  });

  it('shows EAR greater than nominal rate with monthly compounding', () => {
    const r = config.calculate({
      presentValue: '10000',
      annualRate: '7',
      years: '5',
      compounding: '12',
      monthlyContribution: '0',
    });
    const ear = parseNumber(getValue(r, 'effectiveAnnualRate'));
    expect(ear).toBeGreaterThan(7);
    expect(ear).toBeLessThan(8);
  });

  it('returns empty for invalid inputs', () => {
    const r = config.calculate({
      presentValue: '',
      annualRate: '7',
      years: '10',
      compounding: '12',
      monthlyContribution: '0',
    });
    expect(r).toEqual([]);
  });

  it('handles missing annual rate', () => {
    const r = config.calculate({
      presentValue: '5000',
      annualRate: '',
      years: '5',
      compounding: '12',
      monthlyContribution: '0',
    });
    expect(r).toEqual([]);
  });

  it('handles negative present value', () => {
    const r = config.calculate({
      presentValue: '-1000',
      annualRate: '7',
      years: '5',
      compounding: '12',
      monthlyContribution: '0',
    });
    expect(r).toEqual([]);
  });

  it('handles zero year period', () => {
    const r = config.calculate({
      presentValue: '5000',
      annualRate: '7',
      years: '0',
      compounding: '12',
      monthlyContribution: '0',
    });
    expect(r).toEqual([]);
  });

  it('shows total interest earned', () => {
    const r = config.calculate({
      presentValue: '10000',
      annualRate: '10',
      years: '10',
      compounding: '1',
      monthlyContribution: '0',
    });
    const interest = parseMoney(getValue(r, 'totalInterest'));
    // 10000 * 1.1^10 - 10000 ≈ 15937.42
    expect(interest).toBeGreaterThan(15000);
    expect(interest).toBeLessThan(17000);
  });

  it('correctly calculates with quarterly compounding', () => {
    const r = config.calculate({
      presentValue: '5000',
      annualRate: '8',
      years: '5',
      compounding: '4',
      monthlyContribution: '0',
    });
    const fv = parseMoney(getValue(r, 'futureValue'));
    // 5000 * (1 + 0.08/4)^(5*4) = 5000 * 1.02^20 ≈ 7429.74
    expect(fv).toBeGreaterThan(7300);
    expect(fv).toBeLessThan(7600);
  });

  it('daily compounding produces highest FV for same rate', () => {
    const rAnnual = config.calculate({
      presentValue: '10000',
      annualRate: '7',
      years: '10',
      compounding: '1',
      monthlyContribution: '0',
    });
    const rDaily = config.calculate({
      presentValue: '10000',
      annualRate: '7',
      years: '10',
      compounding: '365',
      monthlyContribution: '0',
    });
    const fvAnnual = parseMoney(getValue(rAnnual, 'futureValue'));
    const fvDaily = parseMoney(getValue(rDaily, 'futureValue'));
    expect(fvDaily).toBeGreaterThan(fvAnnual);
  });
});
