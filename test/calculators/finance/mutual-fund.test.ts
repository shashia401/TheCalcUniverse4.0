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

import { getValue as gv } from '../../helpers';
import { fundBalance, fundSeries } from '../../../src/calculators/finance/mutual-fund/fundMath';

describe('mutual fund audit', () => {
  // Independent (node): FV = PV(1+i)^n + PMT((1+i)^n-1)/i, i = (r-e)/12, n = 12y, contributions at month end.
  const sarah = { initialInvestment: '10000', monthlyContribution: '500', expectedReturn: '8', expenseRatio: '0.85', investmentYears: '30' };
  it("Sarah's example: $713,229 with 0.85% fee, fee cost $141,308, VTSAX 0.04% saves $133,989", () => {
    const r = config.calculate(sarah);
    expect(gv(r, 'withFees')).toBe('$713K');
    const withFee = fundBalance(10000, 500, 0.08, 0.0085, 360);
    expect(withFee).toBeCloseTo(713229, -1);
    expect(fundBalance(10000, 500, 0.08, 0, 360) - withFee).toBeCloseTo(141308, -1);
    expect(fundBalance(10000, 500, 0.08, 0.0004, 360) - withFee).toBeCloseTo(133989, -1);
  });
  it('educational headline: $854,537 without fees, $691,150 with a 1% fee (not $844K / $678K)', () => {
    expect(fundBalance(10000, 500, 0.08, 0, 360)).toBeCloseTo(854537, -1);
    expect(fundBalance(10000, 500, 0.08, 0.01, 360)).toBeCloseTo(691150, -1);
  });
  it("James's example: $1,153,169 / $746,803 / $1,113,795", () => {
    expect(fundBalance(50000, 0, 0.09, 0, 420)).toBeCloseTo(1153169, -1);
    expect(fundBalance(50000, 0, 0.09, 0.0125, 420)).toBeCloseTo(746803, -1);
    expect(fundBalance(50000, 0, 0.09, 0.001, 420)).toBeCloseTo(1113795, -1);
  });
  it('a fee larger than the return shrinks the balance instead of being clamped to zero growth', () => {
    // 0% return, 1% fee, 10 years, lump sum: 1000*(1-0.01/12)^120 = 886.9 (< 1000)
    expect(fundBalance(1000, 0, 0, 0.01, 120)).toBeCloseTo(1000 * Math.pow(1 - 0.01 / 12, 120), 6);
    expect(fundBalance(1000, 0, 0, 0.01, 120)).toBeLessThan(1000);
  });
  it('series starts at year 0 and ends exactly at the requested (fractional) horizon', () => {
    const s = fundSeries(1000, 100, 0.08, 0.01, 2.5);
    expect(s.map((p) => p.year)).toEqual([0, 1, 2, 2.5]);
    expect(s[3].withFee).toBeCloseTo(fundBalance(1000, 100, 0.08, 0.01, 30), 8);
    expect(fundSeries(1000, 100, 0.08, 0.01, 1)).toHaveLength(2); // year 0 and year 1 (old chart divided by zero here)
  });
  it('contributions share is measured against the headline (after-fee) balance', () => {
    const r = config.calculate(sarah);
    // 190,000 / 713,229 = 26.6% -> 27%
    expect(gv(r, 'contributionPct')).toBe('27%');
  });
});
