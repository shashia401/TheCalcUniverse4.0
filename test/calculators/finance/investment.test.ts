import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/investment/index';
import { getValue, getResult, parseMoney, near } from '../../helpers';

describe('investment', () => {
  it('calculates future investment value with monthly contributions', () => {
    const r = config.calculate({
      startingAmount: '10000',
      contribution: '500',
      contributionFrequency: 'monthly',
      years: '20',
      returnRate: '8',
      returnVariance: '2',
    });
    expect(r).toHaveLength(7);
    expect(parseMoney(getValue(r, 'expected'))).toBeGreaterThan(0);
    expect(parseMoney(getValue(r, 'totalContributed'))).toBeGreaterThan(0);
    expect(getValue(r, 'growthMultiple')).toBeTruthy();
    // Optimistic > Expected > Pessimistic
    const expected = parseMoney(getValue(r, 'expected'));
    const optimistic = parseMoney(getValue(r, 'optimistic'));
    const pessimistic = parseMoney(getValue(r, 'pessimistic'));
    expect(optimistic).toBeGreaterThan(expected);
    expect(expected).toBeGreaterThan(pessimistic);
  });

  it('returns empty for zero years', () => {
    const r = config.calculate({
      startingAmount: '10000',
      contribution: '500',
      contributionFrequency: 'monthly',
      years: '0',
      returnRate: '8',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for missing required fields', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty for NaN years', () => {
    const r = config.calculate({
      startingAmount: '10000',
      contribution: '500',
      contributionFrequency: 'monthly',
      years: 'abc',
      returnRate: '8',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for NaN return rate', () => {
    const r = config.calculate({
      startingAmount: '10000',
      contribution: '500',
      contributionFrequency: 'monthly',
      years: '20',
      returnRate: 'not-a-number',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for negative years', () => {
    const r = config.calculate({
      startingAmount: '10000',
      contribution: '500',
      contributionFrequency: 'monthly',
      years: '-5',
      returnRate: '8',
    });
    expect(r).toHaveLength(0);
  });

  it('handles zero starting amount with NaN-safe guard', () => {
    const r = config.calculate({
      startingAmount: '0',
      contribution: '500',
      contributionFrequency: 'monthly',
      years: '10',
      returnRate: '7',
      returnVariance: '2',
    });
    expect(r).toHaveLength(7);
    expect(parseMoney(getValue(r, 'totalContributed'))).toBeGreaterThan(0);
    expect(parseMoney(getValue(r, 'expected'))).toBeGreaterThan(0);
  });

  it('handles zero starting amount via empty string (NaN coalesce)', () => {
    const r = config.calculate({
      startingAmount: '',
      contribution: '500',
      contributionFrequency: 'monthly',
      years: '10',
      returnRate: '7',
    });
    expect(r).toHaveLength(7);
    near(parseMoney(getValue(r, 'totalContributed')), 60000, 1);
  });

  it('handles missing variance (NaN → default 0.02)', () => {
    const r = config.calculate({
      startingAmount: '0',
      contribution: '100',
      contributionFrequency: 'monthly',
      years: '5',
      returnRate: '8',
    });
    expect(r).toHaveLength(7);
    // Should produce optimistic/pessimistic with default ±2%
    expect(getValue(r, 'optimistic')).toBeTruthy();
    expect(getValue(r, 'pessimistic')).toBeTruthy();
  });

  it('calculates with annual contributions', () => {
    const r = config.calculate({
      startingAmount: '0',
      contribution: '12000',
      contributionFrequency: 'annually',
      years: '10',
      returnRate: '6',
      returnVariance: '0',
    });
    expect(r).toHaveLength(7);
    // Total contributed = 12000 * 10 = 120000
    near(parseMoney(getValue(r, 'totalContributed')), 120000, 1);
  });

  it('calculates with weekly contributions', () => {
    const r = config.calculate({
      startingAmount: '5000',
      contribution: '100',
      contributionFrequency: 'weekly',
      years: '5',
      returnRate: '10',
      returnVariance: '3',
    });
    expect(r).toHaveLength(7);
    // Weekly contributions: $100/week * 52 weeks/yr * 5 yrs = $26,000
    // Total contributed: $5,000 + $26,000 = $31,000
    near(parseMoney(getValue(r, 'totalContributed')), 31000, 1);
  });

  it('handles zero contribution (starting amount only)', () => {
    const r = config.calculate({
      startingAmount: '50000',
      contribution: '0',
      contributionFrequency: 'monthly',
      years: '10',
      returnRate: '8',
      returnVariance: '1',
    });
    expect(r).toHaveLength(7);
    near(parseMoney(getValue(r, 'totalContributed')), 50000, 1);
  });

  it('shows contribution summary format', () => {
    const r = config.calculate({
      startingAmount: '10000',
      contribution: '500',
      contributionFrequency: 'monthly',
      years: '20',
      returnRate: '8',
      returnVariance: '2',
    });
    // The label contains the contribution summary, value has monthly equivalent
    expect(getResult(r, 'contributionSummary').label).toContain('/mo');
    expect(getResult(r, 'contributionSummary').label).toContain('20 years');
  });

  it('handles 0% return rate (zero growth scenario)', () => {
    const r = config.calculate({
      startingAmount: '10000',
      contribution: '500',
      contributionFrequency: 'monthly',
      years: '10',
      returnRate: '0',
      returnVariance: '0',
    });
    expect(r).toHaveLength(7);
    // With 0% return, expected = totalContributed = 10000 + 500*12*10 = 70000
    near(parseMoney(getValue(r, 'expected')), 70000, 1);
    near(parseMoney(getValue(r, 'totalContributed')), 70000, 1);
    // Total returns should be 0
    near(parseMoney(getValue(r, 'totalReturns')), 0, 1);
  });

  it('growthMultiple shows sensible value', () => {
    const r = config.calculate({
      startingAmount: '10000',
      contribution: '500',
      contributionFrequency: 'monthly',
      years: '30',
      returnRate: '8',
      returnVariance: '2',
    });
    const multiple = getValue(r, 'growthMultiple');
    expect(multiple).toContain('x');
    // After 30 years at 8%, money should be multiplied significantly
    const multVal = parseFloat(multiple.replace('x', ''));
    expect(multVal).toBeGreaterThan(2);
  });

  it('handles large numbers and shows M suffix', () => {
    const r = config.calculate({
      startingAmount: '500000',
      contribution: '5000',
      contributionFrequency: 'monthly',
      years: '40',
      returnRate: '10',
      returnVariance: '2',
    });
    const ev = getValue(r, 'expected');
    // Should be in the millions, formatted with M
    expect(ev).toContain('M');
  });

  it('educational content has required sections', () => {
    const edu = config.educational;
    expect(edu.formula).toBeTruthy();
    expect(edu.variables.length).toBeGreaterThanOrEqual(3);
    expect(edu.faqs.length).toBeGreaterThanOrEqual(7);
    expect(edu.workedExamples).toBeDefined();
    if (edu.workedExamples) {
      expect(edu.workedExamples.length).toBeGreaterThanOrEqual(3);
      edu.workedExamples.forEach((ex) => {
        expect(ex.scenario).toBeTruthy();
        expect(Object.keys(ex.inputs).length).toBeGreaterThan(0);
        expect(ex.result).toBeTruthy();
        expect(ex.insight).toBeTruthy();
      });
    }
    expect(edu.proTips).toBeDefined();
    if (edu.proTips) {
      expect(edu.proTips.length).toBeGreaterThanOrEqual(4);
    }
    expect(edu.limitations).toBeDefined();
    if (edu.limitations) {
      expect(edu.limitations.length).toBeGreaterThanOrEqual(3);
    }
    // Explanation word count ≥ 350
    const wordCount = edu.explanation?.split(/\s+/).filter(Boolean).length || 0;
    expect(wordCount).toBeGreaterThanOrEqual(350);
  });

  it('all inputs have helpText', () => {
    config.inputs.forEach((input) => {
      expect(input.helpText, `Input "${input.id}" is missing helpText`).toBeTruthy();
    });
  });
});
