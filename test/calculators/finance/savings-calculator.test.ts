import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/savings';
import { getValue, parseMoney, near, fvLump, fvMonthlyContrib } from '../../helpers';

describe('savings (balance mode)', () => {
  it('lump only: $5,000 @ 4.5% for 10 years monthly compounding', () => {
    const r = config.calculate({
      solveFor: 'balance',
      initialDeposit: '5000',
      monthlyContribution: '0',
      savingsGoal: '0',
      timePeriod: '10',
      timeUnit: 'years',
      apy: '4.5',
    });
    const expected = fvLump(5000, 0.045, 10, 12);
    near(parseMoney(getValue(r, 'finalBalance')), expected, 1);
    near(parseMoney(getValue(r, 'totalPrincipal')), 5000);
  });

  it('lump + monthly contributions: $1,000 + $200/mo @ 5% for 5 years', () => {
    const r = config.calculate({
      solveFor: 'balance',
      initialDeposit: '1000',
      monthlyContribution: '200',
      savingsGoal: '0',
      timePeriod: '5',
      timeUnit: 'years',
      apy: '5',
    });
    const expected = fvLump(1000, 0.05, 5, 12) + fvMonthlyContrib(200, 0.05, 5);
    near(parseMoney(getValue(r, 'finalBalance')), expected, 1);
    near(parseMoney(getValue(r, 'totalPrincipal')), 1000 + 200 * 60);
  });

  it('zero-rate: balance = principal + monthly × months', () => {
    const r = config.calculate({
      solveFor: 'balance',
      initialDeposit: '500',
      monthlyContribution: '50',
      savingsGoal: '0',
      timePeriod: '24',
      timeUnit: 'months',
      apy: '0',
    });
    near(parseMoney(getValue(r, 'finalBalance')), 500 + 50 * 24);
    near(parseMoney(getValue(r, 'totalInterest')), 0);
  });

  it('returns empty when timePeriod is missing', () => {
    const r = config.calculate({
      solveFor: 'balance',
      initialDeposit: '1000',
      monthlyContribution: '0',
      savingsGoal: '0',
      timePeriod: '',
      timeUnit: 'years',
      apy: '5',
    });
    expect(r).toEqual([]);
  });

  it('returns empty when APY is NaN', () => {
    const r = config.calculate({
      solveFor: 'balance',
      initialDeposit: '5000',
      monthlyContribution: '200',
      savingsGoal: '0',
      timePeriod: '5',
      timeUnit: 'years',
      apy: 'abc',
    });
    expect(r).toEqual([]);
  });

  it('returns empty when timePeriod is zero', () => {
    const r = config.calculate({
      solveFor: 'balance',
      initialDeposit: '1000',
      monthlyContribution: '100',
      savingsGoal: '0',
      timePeriod: '0',
      timeUnit: 'years',
      apy: '5',
    });
    expect(r).toEqual([]);
  });

  it('handles large balances ($1M+) — summary values are consistent', () => {
    const r = config.calculate({
      solveFor: 'balance',
      initialDeposit: '1000000',
      monthlyContribution: '5000',
      savingsGoal: '0',
      timePeriod: '10',
      timeUnit: 'years',
      apy: '5',
    });
    // Verify principal is correct (whole-dollar precision)
    const principal = parseMoney(getValue(r, 'totalPrincipal'));
    near(principal, 1_000_000 + 5_000 * 120); // $1M + $600K = $1.6M
    // Verify final balance exceeds principal (interest earned)
    const finalBalance = parseMoney(getValue(r, 'finalBalance'));
    expect(finalBalance).toBeGreaterThan(principal);
    // Verify interest is positive
    const interest = parseMoney(getValue(r, 'totalInterest'));
    expect(interest).toBeGreaterThan(0);
  });

  it('interest% result is present and positive', () => {
    const r = config.calculate({
      solveFor: 'balance',
      initialDeposit: '0',
      monthlyContribution: '200',
      savingsGoal: '0',
      timePeriod: '5',
      timeUnit: 'years',
      apy: '5',
    });
    const interestPct = getValue(r, 'interestPct');
    expect(interestPct).toBeTruthy();
    expect(interestPct).toContain('%');
  });
});

describe('savings (goal mode)', () => {
  it('returns "already there" when initial deposit alone hits the goal', () => {
    const r = config.calculate({
      solveFor: 'goal',
      initialDeposit: '100000',
      monthlyContribution: '0',
      savingsGoal: '50000',
      timePeriod: '5',
      timeUnit: 'years',
      apy: '5',
    });
    expect(r.find((x) => x.id === 'alreadyThere')).toBeDefined();
  });

  it('required monthly contribution makes future-value math balance', () => {
    const r = config.calculate({
      solveFor: 'goal',
      initialDeposit: '0',
      monthlyContribution: '0',
      savingsGoal: '100000',
      timePeriod: '10',
      timeUnit: 'years',
      apy: '6',
    });
    const required = parseMoney(getValue(r, 'requiredMonthly').replace('/mo', ''));
    // FV of that monthly contribution over 10 years at 6% should be ≈ 100,000
    const fv = fvMonthlyContrib(required, 0.06, 10);
    near(fv, 100000, 1);
  });

  it('returns empty when goal is zero in goal mode', () => {
    const r = config.calculate({
      solveFor: 'goal',
      initialDeposit: '1000',
      monthlyContribution: '0',
      savingsGoal: '0',
      timePeriod: '5',
      timeUnit: 'years',
      apy: '5',
    });
    expect(r).toEqual([]);
  });

  it('weekly equivalent is roughly monthly / 4.333', () => {
    const r = config.calculate({
      solveFor: 'goal',
      initialDeposit: '0',
      monthlyContribution: '0',
      savingsGoal: '50000',
      timePeriod: '5',
      timeUnit: 'years',
      apy: '5',
    });
    const monthly = parseMoney(getValue(r, 'requiredMonthly').replace('/mo', ''));
    const weekly = parseMoney(getValue(r, 'weeklyEquiv').replace('/wk', ''));
    near(monthly / 4.333, weekly, 0.05);
  });

  it('goal mode with zero APY gives principal-only result', () => {
    const r = config.calculate({
      solveFor: 'goal',
      initialDeposit: '0',
      monthlyContribution: '0',
      savingsGoal: '12000',
      timePeriod: '12',
      timeUnit: 'months',
      apy: '0',
    });
    const required = parseMoney(getValue(r, 'requiredMonthly').replace('/mo', ''));
    near(required, 1000); // $12000 / 12 months = $1000
  });
});
