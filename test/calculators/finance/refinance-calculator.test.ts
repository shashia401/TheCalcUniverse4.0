import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/refinance/index';
import { getValue, parseMoney, parseNumber, near } from '../../helpers';

describe('refinance calculator', () => {
  it('recommends Yes when break-even is within planned stay', () => {
    const r = config.calculate({
      currentBalance: '250000',
      currentRate: '7.5',
      currentTerm: '300',
      newRate: '6.0',
      newTerm: '360',
      closingCosts: '6000',
      plannedStay: '60',
    });
    expect(getValue(r, 'recommendation')).toContain('Yes');
    const savings = parseMoney(getValue(r, 'monthlySavings'));
    expect(savings).toBeGreaterThan(0);
    // Break-even should be around 25 months with these numbers
    const breakEven = parseNumber(getValue(r, 'breakEven'));
    expect(breakEven).toBeGreaterThan(0);
    expect(breakEven).toBeLessThan(100);
  });

  it('recommends Wait when break-even exceeds planned stay', () => {
    const r = config.calculate({
      currentBalance: '250000',
      currentRate: '7.5',
      currentTerm: '300',
      newRate: '6.0',
      newTerm: '360',
      closingCosts: '15000',
      plannedStay: '12',
    });
    expect(getValue(r, 'recommendation')).toContain('Wait');
  });

  it('shows negative savings when new rate is not lower', () => {
    const r = config.calculate({
      currentBalance: '250000',
      currentRate: '6.0',
      currentTerm: '300',
      newRate: '7.5',
      newTerm: '360',
      closingCosts: '6000',
      plannedStay: '60',
    });
    expect(getValue(r, 'recommendation')).toContain('not lower');
  });

  it('returns empty array for missing inputs', () => {
    const r = config.calculate({
      currentBalance: '',
      currentRate: '7.5',
      currentTerm: '300',
      newRate: '6.0',
      newTerm: '360',
      closingCosts: '6000',
      plannedStay: '60',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for NaN input values', () => {
    const r = config.calculate({
      currentBalance: 'abc',
      currentRate: '7.5',
      currentTerm: '300',
      newRate: '6.0',
      newTerm: '360',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for zero or negative balance', () => {
    const r = config.calculate({
      currentBalance: '0',
      currentRate: '7.5',
      currentTerm: '300',
      newRate: '6.0',
      newTerm: '360',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array when all inputs are empty', () => {
    const r = config.calculate({
      currentBalance: '',
      currentRate: '',
      currentTerm: '',
      newRate: '',
      newTerm: '',
      closingCosts: '',
      plannedStay: '',
    });
    expect(r).toEqual([]);
  });

  it('computes correct monthly payment reduction with rate drop', () => {
    const r = config.calculate({
      currentBalance: '250000',
      currentRate: '7.5',
      currentTerm: '300',
      newRate: '6.0',
      newTerm: '300',
      closingCosts: '6000',
      plannedStay: '60',
    });
    const savings = parseMoney(getValue(r, 'monthlySavings'));
    // A 1.5% drop on $250k should save roughly $200-$300/month
    expect(savings).toBeGreaterThan(150);
    expect(savings).toBeLessThan(400);
  });

  it('calculates total interest saved when refinancing at lower rate', () => {
    const r = config.calculate({
      currentBalance: '250000',
      currentRate: '7.5',
      currentTerm: '300',
      newRate: '6.0',
      newTerm: '300',
      closingCosts: '6000',
      plannedStay: '60',
    });
    const interestSaved = parseMoney(getValue(r, 'totalInterestSaved'));
    // Lower rate should save substantial interest
    expect(interestSaved).toBeGreaterThan(0);
  });

  it('handles same-rate refinance with term extension', () => {
    const r = config.calculate({
      currentBalance: '250000',
      currentRate: '7.5',
      currentTerm: '300',
      newRate: '7.5',
      newTerm: '360',
      closingCosts: '6000',
      plannedStay: '60',
    });
    // Same rate, longer term = lower monthly payment but rate is not better
    // Break-even should be calculated since there IS a payment reduction
    expect(getValue(r, 'recommendation')).toContain('Wait');
  });

  it('shows net benefit when staying beyond break-even', () => {
    const r = config.calculate({
      currentBalance: '250000',
      currentRate: '7.5',
      currentTerm: '300',
      newRate: '6.0',
      newTerm: '360',
      closingCosts: '6000',
      plannedStay: '120',
    });
    const netBenefit = parseMoney(getValue(r, 'netBenefit'));
    // Staying 10 years (120mo) well beyond ~25mo break-even should yield positive net benefit
    expect(netBenefit).toBeGreaterThan(0);
  });

  it('shows old and new payments correctly', () => {
    const r = config.calculate({
      currentBalance: '250000',
      currentRate: '7.5',
      currentTerm: '300',
      newRate: '6.0',
      newTerm: '360',
      closingCosts: '6000',
      plannedStay: '60',
    });
    const oldPmt = parseMoney(getValue(r, 'oldPayment'));
    const newPmt = parseMoney(getValue(r, 'newPayment'));
    // Old payment at 7.5% for 25yr on $250k should be about $1,800-$1,900
    expect(oldPmt).toBeGreaterThan(1700);
    expect(oldPmt).toBeLessThan(2000);
    // New payment at 6.0% should be lower
    expect(newPmt).toBeLessThan(oldPmt);
  });
});

import { computeRefi } from '../../../src/calculators/finance/refinance/refinanceMath';
describe('refinance audit', () => {
  const sarah = { currentBalance: '250000', currentRate: '7.5', currentTerm: '300', newRate: '6', newTerm: '360', closingCosts: '6000', plannedStay: '60' };
  // Independent (node): old 1,847.478 new 1,498.876 -> savings 348.60, break-even ceil(17.21)=18,
  // old interest 304,243.38, new 289,595.47 -> saved 14,647.91; net over 60 mo = 348.60*60 - 6000 = 14,916.10
  it("Sarah: payments, break-even, interest saved, net benefit", () => {
    const r = config.calculate(sarah);
    expect(getValue(r, 'oldPayment')).toBe('$1,847');
    expect(getValue(r, 'newPayment')).toBe('$1,499');
    expect(getValue(r, 'monthlySavings')).toBe('$349');
    expect(getValue(r, 'breakEven')).toContain('18 months');
    expect(getValue(r, 'totalInterestSaved')).toBe('$14,648');
    expect(getValue(r, 'netBenefit')).toBe('$14,916');
    expect(getValue(r, 'recommendation')).toBe('Yes — Refinance now');
  });
  // (interest saved 6,122.61 on 6.49%/235mo vs 20,000 costs)
  // Mike: 300k, 6.5%/240 -> 5.75%/180: old 2,236.72, new 2,491.23, interest 236,812.66 vs 148,421.45 -> saved 88,391.21; less 5,500 = 82,891
  it('Mike: shorter term raises the payment but saves interest, so the recommendation is Yes', () => {
    const r = config.calculate({ currentBalance: '300000', currentRate: '6.5', currentTerm: '240', newRate: '5.75', newTerm: '180', closingCosts: '5500', plannedStay: '120' });
    expect(getValue(r, 'totalInterestSaved')).toBe('$88,391');
    expect(getValue(r, 'recommendation')).toContain('Yes — shorter term saves $82,891');
    expect(getValue(r, 'breakEven')).toBe('Never');
  });
  it('higher rate -> Wait; lower rate but tiny interest saving vs huge closing costs -> Wait', () => {
    expect(getValue(config.calculate({ ...sarah, newRate: '8', newTerm: '300' }), 'recommendation')).toBe('Wait — your new rate is not lower');
    const r = config.calculate({ currentBalance: '300000', currentRate: '6.5', currentTerm: '240', newRate: '6.49', newTerm: '235', closingCosts: '20000', plannedStay: '120' });
    expect(getValue(r, 'recommendation')).toBe('Wait — interest savings do not cover the closing costs');
  });
  it('stay shorter than break-even -> Wait', () => {
    expect(getValue(config.calculate({ ...sarah, plannedStay: '12' }), 'recommendation')).toContain('Wait — break-even (18mo)');
  });
  it('shared maths: balance reaches zero and break-even is Infinity when payment does not fall', () => {
    expect(computeRefi({ ...sarah, newRate: '8', newTerm: '300' })!.breakEvenMonths).toBe(Infinity);
    expect(computeRefi({ ...sarah, currentBalance: '0' })).toBeNull();
  });
});
