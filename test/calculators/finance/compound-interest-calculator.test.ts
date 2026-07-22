import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/compound-interest';
import { getValue, parseMoney, parsePercent, near, fvLump, fvMonthlyContrib } from '../../helpers';

describe('compound-interest', () => {
  it('lump sum only: $10,000 @ 7% for 10 years monthly compounding', () => {
    const r = config.calculate({
      principal: '10000',
      monthlyContribution: '0',
      rate: '7',
      rateVariance: '0',
      years: '10',
      compoundFrequency: '12',
    });
    const expectedFV = fvLump(10000, 0.07, 10, 12);
    near(parseMoney(getValue(r, 'futureValue')), expectedFV, 0.5);
    near(parseMoney(getValue(r, 'totalPrincipal')), 10000);
  });

  it('monthly contributions only: $500/mo @ 7% for 30 years', () => {
    const r = config.calculate({
      principal: '0',
      monthlyContribution: '500',
      rate: '7',
      rateVariance: '0',
      years: '30',
      compoundFrequency: '12',
    });
    const expectedFV = fvMonthlyContrib(500, 0.07, 30);
    near(parseMoney(getValue(r, 'futureValue')), expectedFV, 1);
    near(parseMoney(getValue(r, 'totalPrincipal')), 500 * 12 * 30);
    near(parseMoney(getValue(r, 'totalInterest')), expectedFV - 500 * 12 * 30, 1);
  });

  it('lump + contributions: $10,000 + $500/mo @ 7% for 30 years', () => {
    const r = config.calculate({
      principal: '10000',
      monthlyContribution: '500',
      rate: '7',
      rateVariance: '0',
      years: '30',
      compoundFrequency: '12',
    });
    const expectedFV = fvLump(10000, 0.07, 30, 12) + fvMonthlyContrib(500, 0.07, 30);
    near(parseMoney(getValue(r, 'futureValue')), expectedFV, 2);
  });

  it('zero rate: balance = principal + monthly × months', () => {
    const r = config.calculate({
      principal: '1000',
      monthlyContribution: '100',
      rate: '0',
      rateVariance: '0',
      years: '5',
      compoundFrequency: '12',
    });
    near(parseMoney(getValue(r, 'futureValue')), 1000 + 100 * 12 * 5);
    near(parseMoney(getValue(r, 'totalInterest')), 0);
  });

  it('annual compounding (n=1): $10k @ 5% for 10 yr = $16,288.95', () => {
    const r = config.calculate({
      principal: '10000',
      monthlyContribution: '0',
      rate: '5',
      rateVariance: '0',
      years: '10',
      compoundFrequency: '1',
    });
    // 10000 × 1.05^10 = 16288.946...
    near(parseMoney(getValue(r, 'futureValue')), 10000 * Math.pow(1.05, 10), 0.5);
  });

  it('totalGrowth percentage matches (FV - principal) / principal × 100', () => {
    const r = config.calculate({
      principal: '1000',
      monthlyContribution: '0',
      rate: '10',
      rateVariance: '0',
      years: '10',
      compoundFrequency: '12',
    });
    const fv = parseMoney(getValue(r, 'futureValue'));
    const expected = ((fv - 1000) / 1000) * 100;
    near(parsePercent(getValue(r, 'totalGrowth')), expected, 0.05);
  });

  it('returns empty when years is missing', () => {
    const r = config.calculate({
      principal: '1000',
      monthlyContribution: '0',
      rate: '7',
      rateVariance: '0',
      years: '',
      compoundFrequency: '12',
    });
    expect(r).toEqual([]);
  });

  it('known answer: $10k @ 7% compounded annually for 10yr = $19,671.51', () => {
    const r = config.calculate({
      principal: '10000',
      monthlyContribution: '0',
      rate: '7',
      rateVariance: '0',
      years: '10',
      compoundFrequency: '1',
    });
    near(parseMoney(getValue(r, 'futureValue')), 19671.51, 0.5);
  });

  it('known answer: $10k + $200/mo @ 7% for 10yr = $54,713.58', () => {
    const r = config.calculate({
      principal: '10000',
      monthlyContribution: '200',
      rate: '7',
      rateVariance: '0',
      years: '10',
      compoundFrequency: '12',
    });
    near(parseMoney(getValue(r, 'futureValue')), 54713.58, 1);
    near(parseMoney(getValue(r, 'totalPrincipal')), 34000, 0.5);
  });

  it('known answer: monthly compounding yields higher FV than annual', () => {
    const rAnnual = config.calculate({
      principal: '10000',
      monthlyContribution: '0',
      rate: '7',
      rateVariance: '0',
      years: '10',
      compoundFrequency: '1',
    });
    const rMonthly = config.calculate({
      principal: '10000',
      monthlyContribution: '0',
      rate: '7',
      rateVariance: '0',
      years: '10',
      compoundFrequency: '12',
    });
    const fvAnnual = parseMoney(getValue(rAnnual, 'futureValue'));
    const fvMonthly = parseMoney(getValue(rMonthly, 'futureValue'));
    expect(fvMonthly).toBeGreaterThan(fvAnnual);
    near(fvAnnual, 19671.51, 0.5);
    near(fvMonthly, 20096.61, 0.5);
  });
});
