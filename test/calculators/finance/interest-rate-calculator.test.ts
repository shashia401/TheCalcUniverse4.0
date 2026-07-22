import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/interest-rate/index';
import { getValue, getResult, parseNumber, parseMoney, near } from '../../helpers';

describe('interest-rate-calculator', () => {
  it('calculates compound rate with monthly compounding', () => {
    const r = config.calculate({
      principal: '10000',
      finalAmount: '14500',
      timePeriod: '5',
      timeUnit: 'years',
      compoundFrequency: '12',
    });
    expect(r).toHaveLength(6);
    const rate = parseNumber(getValue(r, 'nominalRate'));
    expect(rate).toBeGreaterThan(0);
    expect(getValue(r, 'ear')).toBeTruthy();
    expect(parseNumber(getValue(r, 'growth'))).toBeGreaterThan(0);
    // Total interest = 14500 - 10000 = 4500
    near(parseMoney(getValue(r, 'totalInterest')), 4500);
  });

  it('calculates simple interest when no compounding', () => {
    const r = config.calculate({
      principal: '10000',
      finalAmount: '15000',
      timePeriod: '5',
      timeUnit: 'years',
      compoundFrequency: '0',
    });
    expect(r).toHaveLength(6);
    // Simple interest: r = (A - P) / (P * t) = 5000 / (10000 * 5) = 0.10 = 10%
    near(parseNumber(getValue(r, 'nominalRate')), 10);
    expect(getResult(r, 'nominalRate').label).toContain('Simple Interest');
  });

  it('returns empty for zero principal', () => {
    const r = config.calculate({
      principal: '0',
      finalAmount: '10000',
      timePeriod: '5',
      timeUnit: 'years',
      compoundFrequency: '12',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for missing required fields', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns error when final amount does not exceed principal', () => {
    const r = config.calculate({
      principal: '10000',
      finalAmount: '5000',
      timePeriod: '5',
      timeUnit: 'years',
      compoundFrequency: '12',
    });
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe('error');
  });

  it('handles daily compounding and reports EAR higher than nominal', () => {
    const r = config.calculate({
      principal: '10000',
      finalAmount: '15000',
      timePeriod: '3',
      timeUnit: 'years',
      compoundFrequency: '365',
    });
    expect(r).toHaveLength(6);
    const nominal = parseNumber(getValue(r, 'nominalRate'));
    const ear = parseNumber(getValue(r, 'ear'));
    expect(ear).toBeGreaterThan(nominal);
  });

  it('handles quarterly compounding', () => {
    const r = config.calculate({
      principal: '8000',
      finalAmount: '11200',
      timePeriod: '2.5',
      timeUnit: 'years',
      compoundFrequency: '4',
    });
    const nominal = parseNumber(getValue(r, 'nominalRate'));
    expect(nominal).toBeGreaterThan(0);
    expect(nominal).toBeLessThan(20);
    expect(parseNumber(getValue(r, 'ear'))).toBeGreaterThan(nominal);
  });

  it('converts months to years correctly', () => {
    const r = config.calculate({
      principal: '5000',
      finalAmount: '6000',
      timePeriod: '24',
      timeUnit: 'months',
      compoundFrequency: '12',
    });
    expect(r).toHaveLength(6);
    expect(parseNumber(getValue(r, 'nominalRate'))).toBeGreaterThan(0);
  });

  it('handles semi-annual compounding', () => {
    const r = config.calculate({
      principal: '20000',
      finalAmount: '28000',
      timePeriod: '4',
      timeUnit: 'years',
      compoundFrequency: '2',
    });
    const nominal = parseNumber(getValue(r, 'nominalRate'));
    expect(nominal).toBeGreaterThan(0);
    expect(parseNumber(getValue(r, 'ear'))).toBeGreaterThan(nominal);
  });

  it('includes formulaUsed in results', () => {
    const r = config.calculate({
      principal: '10000',
      finalAmount: '14500',
      timePeriod: '5',
      timeUnit: 'years',
      compoundFrequency: '12',
    });
    const formula = getValue(r, 'formulaUsed');
    expect(formula).toBeTruthy();
    expect(formula.length).toBeGreaterThan(5);
  });
});
