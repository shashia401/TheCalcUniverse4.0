import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/present-value/index';
import { getValue, parseMoney, parseNumber, near } from '../../helpers';

describe('present-value', () => {
  it('calculates PV with annual compounding', () => {
    const r = config.calculate({
      futureValue: '100000',
      periods: '10',
      discountRate: '7',
      compoundingFrequency: '1',
    });
    // PV = 100000 / (1.07)^10 ≈ 50834.93
    const pv = parseMoney(getValue(r, 'presentValueResult'));
    near(pv, 50834.93, 1);
    // Discount amount = 100000 - 50834.93
    near(parseMoney(getValue(r, 'discountAmountResult')), 49165.07, 1);
  });

  it('calculates PV with monthly compounding', () => {
    const r = config.calculate({
      futureValue: '100000',
      periods: '10',
      discountRate: '7',
      compoundingFrequency: '12',
    });
    // r_per = 0.07/12, n = 120
    // PV = 100000 / (1 + 0.07/12)^120
    const expectedPV = 100000 / Math.pow(1 + 0.07 / 12, 120);
    const pv = parseMoney(getValue(r, 'presentValueResult'));
    near(pv, expectedPV, 1);
    // EAR = (1 + 0.07/12)^12 - 1 ≈ 7.229%
    const ear = parseNumber(getValue(r, 'effectiveAnnualRateResult'));
    near(ear, 7.229, 0.01);
  });

  it('effective annual rate increases with more frequent compounding', () => {
    // Monthly EAR > Annual EAR at same nominal rate
    const rAnnual = config.calculate({
      futureValue: '100000', periods: '5', discountRate: '8', compoundingFrequency: '1',
    });
    const rMonthly = config.calculate({
      futureValue: '100000', periods: '5', discountRate: '8', compoundingFrequency: '12',
    });
    const earAnnual = parseNumber(getValue(rAnnual, 'effectiveAnnualRateResult'));
    const earMonthly = parseNumber(getValue(rMonthly, 'effectiveAnnualRateResult'));
    expect(earMonthly).toBeGreaterThan(earAnnual);
    near(earAnnual, 8);
    near(earMonthly, 8.30, 0.01);
  });

  it('handles daily compounding', () => {
    const r = config.calculate({
      futureValue: '50000',
      periods: '5',
      discountRate: '6',
      compoundingFrequency: '365',
    });
    const pv = parseMoney(getValue(r, 'presentValueResult'));
    // PV = 50000 / (1 + 0.06/365)^(5*365)
    const expectedPV = 50000 / Math.pow(1 + 0.06 / 365, 1825);
    near(pv, expectedPV, 1);
  });

  it('discount factor shows reciprocal correctly', () => {
    const r = config.calculate({
      futureValue: '100000', periods: '10', discountRate: '7', compoundingFrequency: '1',
    });
    const factorStr = getValue(r, 'discountFactorResult');
    // Format: "1 : X.XXXX" where X = FV/PV = 100000/50834.93 ≈ 1.9672
    expect(factorStr).toMatch(/1\s*:\s*1\.96/);
  });

  it('returns empty for invalid future value', () => {
    const r = config.calculate({
      futureValue: '',
      periods: '10',
      discountRate: '7',
      compoundingFrequency: '1',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for zero future value', () => {
    const r = config.calculate({
      futureValue: '0',
      periods: '10',
      discountRate: '7',
      compoundingFrequency: '1',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for zero periods', () => {
    const r = config.calculate({
      futureValue: '100000',
      periods: '0',
      discountRate: '7',
      compoundingFrequency: '1',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for empty inputs', () => {
    const r = config.calculate({});
    expect(r).toHaveLength(0);
  });
});
