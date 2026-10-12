import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/savings/index';
import { monthlyRateFromApy, savingsSchedule, finalBalance, monthlyForGoal, wholeMonths } from '../../../src/calculators/finance/savings/savingsMath';
import { getValue, parseMoney, near } from '../../helpers';

describe('savings audit: APY is an effective annual yield', () => {
  it('5,000 at 5% APY for exactly one year is 5,250.00 (regression: APY/12 gave 5,255.81)', () => {
    const r = config.calculate({ solveFor: 'balance', initialDeposit: '5000', monthlyContribution: '0', timePeriod: '1', timeUnit: 'years', apy: '5' });
    expect(getValue(r, 'finalBalance')).toBe('$5,250');
    near(finalBalance(5000, 0, 0.05, 12), 5250, 1e-9);
  });

  it('FAQ: $10,000 at 5% APY for 5 years earns $2,763 of interest', () => {
    const r = config.calculate({ solveFor: 'balance', initialDeposit: '10000', monthlyContribution: '0', timePeriod: '5', timeUnit: 'years', apy: '5' });
    near(parseMoney(getValue(r, 'totalInterest')), 2762.82, 0.01); // 10000 x (1.05^5 - 1)
  });

  it('explanation: $500/month for 5 years, 4.5% APY vs 0.01% APY differ by about $3,500 of interest', () => {
    const hi = finalBalance(0, 500, 0.045, 60) - 30000;
    const lo = finalBalance(0, 500, 0.0001, 60) - 30000;
    expect(Math.round((hi - lo) / 100) * 100).toBe(3500);
  });

  it('schedule recurrence matches the closed form and the goal solver inverts it', () => {
    const s = savingsSchedule(2500, 300, 0.04, 84);
    near(s[84].balance, finalBalance(2500, 300, 0.04, 84), 1e-6);
    const pmt = monthlyForGoal(2500, 50000, 0.04, 84);
    near(finalBalance(2500, pmt, 0.04, 84), 50000, 1e-6);
    expect(monthlyForGoal(100000, 50000, 0.04, 60)).toBe(0); // initial deposit alone beats the goal
  });

  it('goal mode independent check: 100,000 in 10 years at 6% APY needs 100000 x r / (1.06^10 - 1) = 603.97/mo', () => {
    // r = 1.06^(1/12) - 1 = 0.00486755 ; (1.06^10 - 1) = 0.790848
    const r = config.calculate({ solveFor: 'goal', initialDeposit: '0', savingsGoal: '100000', timePeriod: '10', timeUnit: 'years', apy: '6' });
    near(parseMoney(getValue(r, 'requiredMonthly').replace('/mo', '')), 100000 * 0.00486755 / 0.790848, 0.05);
  });

  it('zero APY, months unit and fractional periods', () => {
    expect(monthlyRateFromApy(0)).toBe(0);
    expect(wholeMonths(0.25, 'years')).toBe(3);
    expect(wholeMonths(0.01, 'years')).toBe(1);
    expect(wholeMonths(18, 'months')).toBe(18);
    const r = config.calculate({ solveFor: 'balance', initialDeposit: '1000', monthlyContribution: '100', timePeriod: '0.5', timeUnit: 'years', apy: '0' });
    expect(getValue(r, 'finalBalance')).toBe('$1,600');
  });

  it('all-zero money inputs return no rows instead of NaN%', () => {
    expect(config.calculate({ solveFor: 'balance', initialDeposit: '0', monthlyContribution: '0', timePeriod: '5', timeUnit: 'years', apy: '5' })).toEqual([]);
  });

  it('horizons beyond 100 years carry a warning', () => {
    const r = config.calculate({ solveFor: 'balance', initialDeposit: '100', monthlyContribution: '0', timePeriod: '150', timeUnit: 'years', apy: '3' });
    expect(r[0].warning).toMatch(/100 years/);
    const ok = config.calculate({ solveFor: 'balance', initialDeposit: '100', monthlyContribution: '0', timePeriod: '30', timeUnit: 'years', apy: '3' });
    expect(ok[0].warning).toBeUndefined();
  });
});
