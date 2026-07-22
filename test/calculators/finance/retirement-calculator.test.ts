import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/retirement/index';
import { getValue, getResult, parseMoney, parseNumber, near } from '../../helpers';

describe('retirement', () => {
  it('calculates future value with monthly contributions', () => {
    const r = config.calculate({
      currentAge: '30',
      retirementAge: '65',
      currentSavings: '50000',
      monthlyContribution: '500',
      annualReturn: '7',
      inflationRate: '3',
    });
    const years = 35;
    const months = years * 12;
    const monthlyRate = 0.07 / 12;
    // FV = 50000 * (1+0.07/12)^420 + 500 * (((1+0.07/12)^420 - 1) / (0.07/12))
    const expectedFV =
      50000 * Math.pow(1 + monthlyRate, months) +
      500 * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    // The fmt function uses "M" format for values >= $1M, which rounds to $10K
    near(parseMoney(getValue(r, 'futureValue')), expectedFV, 10000);
    // Growth multiple > 1
    const multiple = parseNumber(getValue(r, 'growthMultiple'));
    expect(multiple).toBeGreaterThan(1);
    // Total contributed = 50000 + 500 * 420 = 260000
    near(parseMoney(getValue(r, 'totalContributed')), 260000, 1);
    // Returns 5 base results when no desiredIncome
    expect(r).toHaveLength(5);
  });

  it('shows shortfall when desired income is high', () => {
    const r = config.calculate({
      currentAge: '30',
      retirementAge: '65',
      currentSavings: '50000',
      monthlyContribution: '500',
      annualReturn: '7',
      inflationRate: '3',
      desiredIncome: '120000',
    });
    // The label contains "Shortfall", the value contains "Gap:"
    const goalStatus = getResult(r, 'goalStatus');
    expect(goalStatus.label).toContain('Shortfall');
    expect(goalStatus.value).toContain('Gap:');
    // requiredContribution should exist since there's a shortfall
    expect(r.some((x) => x.id === 'requiredContribution')).toBe(true);
  });

  it('shows on-track when desired income is low enough', () => {
    const r = config.calculate({
      currentAge: '30',
      retirementAge: '65',
      currentSavings: '50000',
      monthlyContribution: '500',
      annualReturn: '7',
      inflationRate: '3',
      desiredIncome: '20000',
    });
    const goalStatus = getResult(r, 'goalStatus');
    expect(goalStatus.label).toContain('on track');
    expect(goalStatus.value).toContain('Surplus:');
    // No required contribution since already on track
    expect(r.some((x) => x.id === 'requiredContribution')).toBe(false);
  });

  it('handles very low inflation rate', () => {
    const r = config.calculate({
      currentAge: '30',
      retirementAge: '65',
      currentSavings: '50000',
      monthlyContribution: '500',
      annualReturn: '7',
      inflationRate: '0.001',
      desiredIncome: '60000',
    });
    // With near-zero inflation, both values should be very close
    const fv = parseMoney(getValue(r, 'futureValue'));
    const adj = parseMoney(getValue(r, 'inflationAdjusted'));
    near(adj, fv, 10000);
  });

  it('inflation reduces purchasing power over time', () => {
    const r = config.calculate({
      currentAge: '30',
      retirementAge: '65',
      currentSavings: '100000',
      monthlyContribution: '1000',
      annualReturn: '7',
      inflationRate: '3',
    });
    const fv = parseMoney(getValue(r, 'futureValue'));
    const adj = parseMoney(getValue(r, 'inflationAdjusted'));
    expect(adj).toBeLessThan(fv);
  });

  it('handles zero monthly contribution', () => {
    const r = config.calculate({
      currentAge: '25',
      retirementAge: '65',
      currentSavings: '100000',
      monthlyContribution: '0',
      annualReturn: '7',
    });
    // 100000 * (1+0.07/12)^(40*12)
    const expectedFV = 100000 * Math.pow(1 + 0.07 / 12, 480);
    near(parseMoney(getValue(r, 'futureValue')), expectedFV, 10000);
    // Total contributed should equal currentSavings
    near(parseMoney(getValue(r, 'totalContributed')), 100000, 1);
  });

  it('returns empty when retirement age <= current age', () => {
    const r = config.calculate({
      currentAge: '65',
      retirementAge: '65',
      currentSavings: '50000',
      monthlyContribution: '500',
      annualReturn: '7',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for invalid inputs', () => {
    const r = config.calculate({
      currentAge: '',
      retirementAge: '65',
      currentSavings: '50000',
      monthlyContribution: '500',
      annualReturn: '7',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for empty inputs', () => {
    const r = config.calculate({});
    expect(r).toHaveLength(0);
  });

  it('handles zero-rate return', () => {
    const r = config.calculate({
      currentAge: '30',
      retirementAge: '65',
      currentSavings: '50000',
      monthlyContribution: '500',
      annualReturn: '0',
    });
    // No growth: FV = 50000 + 500 * 420 = 260000
    near(parseMoney(getValue(r, 'futureValue')), 260000, 1);
    near(parseNumber(getValue(r, 'growthMultiple')), 1);
  });
});
