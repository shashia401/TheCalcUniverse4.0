import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/mutual-fund/index';
import { getValue, parseMoney } from '../../helpers';

describe('mutual fund calculator', () => {
  it('projects growth with fees', () => {
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

  it('shows fees cost money', () => {
    const r = config.calculate({
      initialInvestment: '10000',
      monthlyContribution: '500',
      expectedReturn: '8',
      expenseRatio: '1.5',
      investmentYears: '30',
    });
    // feeImpact is "$232K (27.1% of balance)" — check it exists and is positive
    const feeImpactStr = getValue(r, 'feeImpact');
    expect(feeImpactStr).toContain('K');
    expect(feeImpactStr).toContain('%');
    // withoutFees > withFees confirms fees are costly
    const withoutFees = parseMoney(getValue(r, 'withoutFees'));
    const withFees = parseMoney(getValue(r, 'withFees'));
    expect(withoutFees).toBeGreaterThan(withFees);
  });

  it('returns empty for invalid inputs', () => {
    const r = config.calculate({
      initialInvestment: '',
      monthlyContribution: '500',
      expectedReturn: '8',
      expenseRatio: '0.75',
      investmentYears: '20',
    });
    expect(r).toEqual([]);
  });

  it('handles zero expense ratio', () => {
    const r = config.calculate({
      initialInvestment: '10000',
      monthlyContribution: '0',
      expectedReturn: '7',
      expenseRatio: '0',
      investmentYears: '10',
    });
    const withFees = parseMoney(getValue(r, 'withFees'));
    const withoutFees = parseMoney(getValue(r, 'withoutFees'));
    expect(withFees).toBeCloseTo(withoutFees, 0);
  });
});
