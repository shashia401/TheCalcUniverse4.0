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

describe('payback period audit', () => {
  const carlos = { initialInvestment: '50000', annualCashFlow: '12000', useDiscounted: 'discounted', discountRate: '8', projectLife: '10' };
  // Independent: PV factor 8%/10y = 6.710081 -> NPV 12000*6.710081-50000 = 30,520.98; PI 1.6104;
  // cumulative PV after 5y = 47,912.5, year-6 PV = 7,561.9 -> payback 5 + 2,087.5/7,561.9 = 5.276
  it("Carlos: simple 4.2, discounted 5.3, NPV $30,521, PI 1.61x", () => {
    const r = config.calculate(carlos);
    expect(getValue(r, 'simplePayback')).toBe('4.2 years');
    expect(getValue(r, 'discountedPayback')).toBe('5.3 years');
    expect(getValue(r, 'npv')).toBe('$30,521');
    expect(getValue(r, 'profitIndex')).toBe('1.61x');
  });
  // PV factor 10%/8y = 5.334926 -> NPV 22000*5.334926-75000 = 42,368.38; PI 1.5649; disc payback 4.385
  it('Priya: discounted 4.4, NPV $42,368, PI 1.56x, total $176,000', () => {
    const r = config.calculate({ initialInvestment: '75000', annualCashFlow: '22000', useDiscounted: 'discounted', discountRate: '10', projectLife: '8' });
    expect(getValue(r, 'simplePayback')).toBe('3.4 years');
    expect(getValue(r, 'discountedPayback')).toBe('4.4 years');
    expect(getValue(r, 'npv')).toBe('$42,368');
    expect(getValue(r, 'profitIndex')).toBe('1.56x');
    expect(getValue(r, 'totalReturn')).toBe('$176,000');
  });
  it('quick-reference row: 10% discount, 10yr life -> 4.2 simple / 5.7 discounted', () => {
    const r = config.calculate({ ...carlos, discountRate: '10' });
    expect(getValue(r, 'simplePayback')).toBe('4.2 years');
    expect(getValue(r, 'discountedPayback')).toBe('5.7 years');
  });
  // life 2.5y, CF 1000/yr, 0% rate: cash = 1000 + 1000 + 500 = 2500 (old code dropped the half year in NPV but kept it in 'total')
  it('a fractional project life pro-rates the last year consistently in NPV and total return', () => {
    const r = config.calculate({ initialInvestment: '2000', annualCashFlow: '1000', useDiscounted: 'discounted', discountRate: '0', projectLife: '2.5' });
    expect(getValue(r, 'npv')).toBe('$500');
    expect(getValue(r, 'totalReturn')).toBe('$2,500');
  });
  it('payback longer than the project life is reported as never recovered within the life', () => {
    const r = config.calculate({ initialInvestment: '50000', annualCashFlow: '12000', useDiscounted: 'discounted', discountRate: '8', projectLife: '4' });
    expect(getValue(r, 'discountedPayback')).toContain('Never within the project life');
  });
});
