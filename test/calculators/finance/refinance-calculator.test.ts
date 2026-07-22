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
