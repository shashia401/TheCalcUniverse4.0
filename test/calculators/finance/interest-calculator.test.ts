import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/interest-calculator';
import { getValue, parseMoney, parsePercent, parseNumber, near } from '../../helpers';

describe('interest-calculator', () => {
  it('simple interest: $10,000 @ 5% for 3 years', () => {
    const r = config.calculate({
      principal: '10000',
      interestRate: '5',
      timeUnit: 'years',
      timePeriod: '3',
      interestType: 'simple',
    });
    // I = 10000 * 0.05 * 3 = 1500
    // A = 10000 + 1500 = 11500
    near(parseMoney(getValue(r, 'totalInterest')), 1500);
    near(parseMoney(getValue(r, 'totalAmount')), 11500);
    near(parseMoney(getValue(r, 'principal')), 10000);
  });

  it('compound interest: $10,000 @ 5% for 3 years monthly compounding', () => {
    const r = config.calculate({
      principal: '10000',
      interestRate: '5',
      timeUnit: 'years',
      timePeriod: '3',
      interestType: 'compound',
      compoundFrequency: '12',
    });
    // A = 10000 * (1 + 0.05/12)^(12*3) = 10000 * (1.004167)^36 ≈ 11614.72
    const expected = 10000 * Math.pow(1 + 0.05 / 12, 12 * 3);
    near(parseMoney(getValue(r, 'totalAmount')), expected, 0.5);
    near(parseMoney(getValue(r, 'totalInterest')), expected - 10000, 0.5);
  });

  it('simple interest in months', () => {
    const r = config.calculate({
      principal: '5000',
      interestRate: '6',
      timeUnit: 'months',
      timePeriod: '18',
      interestType: 'simple',
    });
    // I = 5000 * 0.06 * (18/12) = 5000 * 0.06 * 1.5 = 450
    near(parseMoney(getValue(r, 'totalInterest')), 450);
    near(parseMoney(getValue(r, 'totalAmount')), 5450);
  });

  it('simple interest in days', () => {
    const r = config.calculate({
      principal: '10000',
      interestRate: '10',
      timeUnit: 'days',
      timePeriod: '365',
      interestType: 'simple',
    });
    // I = 10000 * 0.10 * (365/365) = 1000
    near(parseMoney(getValue(r, 'totalInterest')), 1000);
    near(parseMoney(getValue(r, 'totalAmount')), 11000);
  });

  it('zero principal returns empty', () => {
    const r = config.calculate({
      principal: '0',
      interestRate: '5',
      timeUnit: 'years',
      timePeriod: '3',
      interestType: 'simple',
    });
    expect(r).toEqual([]);
  });

  it('empty principal returns empty', () => {
    const r = config.calculate({
      principal: '',
      interestRate: '5',
      timeUnit: 'years',
      timePeriod: '3',
      interestType: 'simple',
    });
    expect(r).toEqual([]);
  });

  it('compound interest shows compound bonus', () => {
    const r = config.calculate({
      principal: '10000',
      interestRate: '8',
      timeUnit: 'years',
      timePeriod: '10',
      interestType: 'compound',
      compoundFrequency: '12',
    });
    // Should show compound bonus for a significant amount
    expect(getValue(r, 'compoundBonus')).toContain('more than simple interest');
    // Should show effective annual rate
    const ear = parsePercent(getValue(r, 'effectiveRate'));
    const expectedEAR = (Math.pow(1 + 0.08 / 12, 12) - 1) * 100;
    near(ear, expectedEAR, 0.001);
  });

  it('growth multiple displayed correctly', () => {
    const r = config.calculate({
      principal: '5000',
      interestRate: '10',
      timeUnit: 'years',
      timePeriod: '5',
      interestType: 'simple',
    });
    // A = 5000 * (1 + 0.10 * 5) = 7500
    // Growth multiple = 7500 / 5000 = 1.5
    expect(getValue(r, 'growthMultiple')).toContain('1.500');
  });
});
