import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/payback-period/index';
import { getValue, parseNumber } from '../../helpers';

describe('payback period calculator', () => {
  it('calculates simple payback correctly', () => {
    const r = config.calculate({
      initialInvestment: '50000',
      annualCashFlow: '10000',
      useDiscounted: 'simple',
      discountRate: '',
      projectLife: '',
    });
    const payback = parseNumber(getValue(r, 'simplePayback'));
    expect(payback).toBeCloseTo(5, 0);
  });

  it('calculates discounted payback with TVM', () => {
    const r = config.calculate({
      initialInvestment: '50000',
      annualCashFlow: '10000',
      useDiscounted: 'discounted',
      discountRate: '10',
      projectLife: '10',
    });
    const discounted = getValue(r, 'discountedPayback');
    // With 10% discount rate, discounted payback > simple payback
    const discountedVal = parseNumber(discounted);
    const simpleVal = parseNumber(getValue(r, 'simplePayback'));
    expect(discountedVal).toBeGreaterThan(simpleVal);
  });

  it('shows positive NPV when cash flows exceed investment', () => {
    const r = config.calculate({
      initialInvestment: '50000',
      annualCashFlow: '15000',
      useDiscounted: 'discounted',
      discountRate: '8',
      projectLife: '5',
    });
    const npv = getValue(r, 'npv');
    expect(npv).not.toContain('-');
  });

  it('returns empty for invalid inputs', () => {
    const r = config.calculate({
      initialInvestment: '',
      annualCashFlow: '10000',
      useDiscounted: 'simple',
      discountRate: '',
      projectLife: '',
    });
    expect(r).toEqual([]);
  });
});
