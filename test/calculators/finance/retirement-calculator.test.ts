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

describe('retirement educational numbers match the calculator', () => {
  const base = { retirementAge: '65', currentSavings: '0', annualReturn: '7', inflationRate: '3' };
  const fvOf = (currentAge: string, monthlyContribution: string) =>
    getValue(config.calculate({ ...base, currentAge, monthlyContribution }), 'futureValue');

  it('$400/mo from 25 = $1.05M, $500/mo from 25 = $1.31M, $500/mo from 35 = $609,985 (all 7%, from $0)', () => {
    expect(fvOf('25', '400')).toBe('$1.05M');
    expect(fvOf('25', '500')).toBe('$1.31M');
    expect(fvOf('35', '500')).toBe('$609,985');
  });

  it('a 10-year delay cuts the balance by more than half (609,985 / 1,312,407 = 46.5%)', () => {
    const ratio = parseMoney(fvOf('35', '500')) / (parseFloat(fvOf('25', '500').replace(/[^0-9.]/g, '')) * 1_000_000);
    expect(ratio).toBeGreaterThan(0.45);
    expect(ratio).toBeLessThan(0.5);
  });

  it('educational text quotes those figures', () => {
    const edu = config.educational;
    const tips = edu.proTips!.join(' ');
    expect(tips).toContain('$1.05M');
    expect(tips).toContain('$861/month');
    const ref = edu.quickReference!.map((q) => `${q.label} ${q.value}`).join(' ');
    expect(ref).toContain('$1.31M');
    expect(ref).toContain('$610K');
    expect(ref).not.toContain('HALVES');
  });

  it('Anna worked example: starting at 35 instead of 30 gives about $1,016,000', () => {
    const r = config.calculate({ currentAge: '35', retirementAge: '65', currentSavings: '50000', monthlyContribution: '500', annualReturn: '7', inflationRate: '3' });
    expect(getValue(r, 'futureValue')).toBe('$1.02M');
  });
});
