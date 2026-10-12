import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/investment/index';
import { investmentFV, parseVariance } from '../../../src/calculators/finance/investment/investMath';
import { getValue } from '../../helpers';

// Independent Python: lump = P(1+r/12)^(12y); deposits = C*((1+i)^(k*y)-1)/i with i=(1+r/12)^(12/k)-1.
describe('investment audit', () => {
  it('Emma: $10k + $500/mo, 8%, 30 years = $854,537 (contributions $190,000)', () => {
    const r = config.calculate({ startingAmount: '10000', contribution: '500', contributionFrequency: 'monthly', years: '30', returnRate: '8', returnVariance: '2' });
    expect(getValue(r, 'expected')).toBe('$854,537');
    expect(getValue(r, 'totalContributed')).toBe('$190,000');
    expect(getValue(r, 'totalReturns')).toBe('$664,537');
    expect(investmentFV(10000, 500, 'monthly', 0.08, 40)).toBeCloseTo(1_988_237.77, 1); // started 10 years earlier
  });

  it('James: $50k lump sum, 7%, 20 years = $201,937', () => {
    const r = config.calculate({ startingAmount: '50000', contribution: '0', contributionFrequency: 'monthly', years: '20', returnRate: '7', returnVariance: '2' });
    expect(getValue(r, 'expected')).toBe('$201,937');
  });

  it('Maria: $2k + $300/mo, 9%, 35 years = $928,662; 6% pessimistic = $443,660', () => {
    const r = config.calculate({ startingAmount: '2000', contribution: '300', contributionFrequency: 'monthly', years: '35', returnRate: '9', returnVariance: '3' });
    expect(getValue(r, 'expected')).toBe('$928,662');
    expect(getValue(r, 'pessimistic')).toBe('$443,660');
    expect(getValue(r, 'totalContributed')).toBe('$128,000');
  });

  it('weekly deposits arrive weekly: $115.38/week vs $500/month differ by only ~0.2% over 30 years', () => {
    const w = investmentFV(10000, 115.38, 'weekly', 0.08, 30);
    expect(w).toBeCloseTo(856_415.25, -1);
    expect(Math.abs(w / investmentFV(10000, 500, 'monthly', 0.08, 30) - 1)).toBeLessThan(0.0025);
  });

  it('annual contributions land at year end (regression: spread as 1/12 per month)', () => {
    // $6,000 at the end of each year for 10 years at 8% compounded monthly: i = (1+0.08/12)^12 - 1 = 8.3000%
    const i = Math.pow(1 + 0.08 / 12, 12) - 1;
    expect(investmentFV(0, 6000, 'annually', 0.08, 10)).toBeCloseTo(6000 * ((Math.pow(1 + i, 10) - 1) / i), 4);
    expect(investmentFV(0, 6000, 'annually', 0.08, 10)).toBeLessThan(investmentFV(0, 500, 'monthly', 0.08, 10));
  });

  it('variance: blank = 2%, explicit 0 is respected (regression: 0 became 2%)', () => {
    expect(parseVariance('')).toBeCloseTo(0.02, 10);
    expect(parseVariance('0')).toBe(0);
    const r = config.calculate({ startingAmount: '1000', contribution: '0', contributionFrequency: 'monthly', years: '10', returnRate: '5', returnVariance: '0' });
    expect(getValue(r, 'optimistic')).toBe(getValue(r, 'expected'));
    expect(getValue(r, 'pessimistic')).toBe(getValue(r, 'expected'));
  });

  it('pro-tip numbers: $500/mo at 25 vs ~$1,075/mo at 35 (7%); $500k at 7% vs 6% for 30 years differs by ~$934k', () => {
    const a = investmentFV(0, 500, 'monthly', 0.07, 40);
    const b = investmentFV(0, 1075, 'monthly', 0.07, 30);
    expect(Math.abs(a / b - 1)).toBeLessThan(0.01);
    expect(500000 * (1.07 ** 30 - 1.06 ** 30)).toBeCloseTo(934_382, -1);
  });

  it('0% return: FV = start + contributions; invalid input gives []', () => {
    const r = config.calculate({ startingAmount: '1000', contribution: '100', contributionFrequency: 'monthly', years: '5', returnRate: '0' });
    expect(getValue(r, 'expected')).toBe('$7,000');
    expect(config.calculate({ startingAmount: '1000', years: '0', returnRate: '5' })).toEqual([]);
  });
});
