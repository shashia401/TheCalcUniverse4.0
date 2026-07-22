import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/payback-period/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('payback-period-calculator', () => {
  it('simple payback: standard case matches formula', () => {
    const r = config.calculate({
      initialInvestment: '50000',
      annualCashFlow: '12000',
      useDiscounted: 'simple',
    });
    // Payback = 50,000 / 12,000 = 4.1667 years
    near(parseNumber(getValue(r, 'simplePayback')), 4.2, 0.1);
    expect(getValue(r, 'annualCashFlowResult')).toContain('12,000');
    expect(getValue(r, 'totalReturn')).toContain('Ongoing');
    // Return multiple: 12000/50000 = 24%
    const roi = getValue(r, 'profitIndex');
    expect(roi).toContain('%');
  });

  it('simple payback with project life shows total return and profitability index', () => {
    const r = config.calculate({
      initialInvestment: '50000',
      annualCashFlow: '12000',
      useDiscounted: 'simple',
      projectLife: '8',
    });
    near(parseNumber(getValue(r, 'simplePayback')), 4.2, 0.1);
    // Total return = 12,000 * 8 = 96,000
    expect(getValue(r, 'totalReturn')).toContain('96,000');
    // Profitability index = 96,000 / 50,000 = 1.92x
    expect(getValue(r, 'profitIndex')).toContain('x');
  });

  it('discounted payback with 10% rate', () => {
    const r = config.calculate({
      initialInvestment: '50000',
      annualCashFlow: '12000',
      useDiscounted: 'discounted',
      discountRate: '10',
      projectLife: '10',
    });
    // Discounted payback should be longer than simple
    const discountedYrs = parseNumber(getValue(r, 'discountedPayback'));
    expect(discountedYrs).toBeGreaterThan(4);
    expect(discountedYrs).toBeLessThan(10);
    // NPV should be positive at 10% over 10 years
    expect(getValue(r, 'npv')).not.toContain('-');
    expect(getValue(r, 'discountRateUsed')).toBe('10.0%');
  });

  it('discounted payback with very high discount rate may never recoup', () => {
    const r = config.calculate({
      initialInvestment: '50000',
      annualCashFlow: '12000',
      useDiscounted: 'discounted',
      discountRate: '50',
      projectLife: '3',
    });
    expect(getValue(r, 'discountedPayback')).toContain('Never');
  });

  it('simple payback exceeds project life', () => {
    const r = config.calculate({
      initialInvestment: '100000',
      annualCashFlow: '10000',
      useDiscounted: 'simple',
      projectLife: '5',
    });
    // Payback = 10 years, but project life is 5 — should exceed
    expect(getValue(r, 'simplePayback')).toContain('exceeds project life');
    expect(getValue(r, 'simplePayback')).toContain('5.0');
  });

  it('returns empty array for missing initial investment', () => {
    const r = config.calculate({
      initialInvestment: '',
      annualCashFlow: '12000',
      useDiscounted: 'simple',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty array for missing annual cash flow', () => {
    const r = config.calculate({
      initialInvestment: '50000',
      annualCashFlow: '',
      useDiscounted: 'simple',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty array for zero initial investment', () => {
    const r = config.calculate({
      initialInvestment: '0',
      annualCashFlow: '12000',
      useDiscounted: 'simple',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty array for zero annual cash flow', () => {
    const r = config.calculate({
      initialInvestment: '50000',
      annualCashFlow: '0',
      useDiscounted: 'simple',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty array for NaN inputs', () => {
    const r = config.calculate({
      initialInvestment: 'not-a-number',
      annualCashFlow: '12000',
      useDiscounted: 'simple',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty array for negative values', () => {
    const r = config.calculate({
      initialInvestment: '-5000',
      annualCashFlow: '12000',
      useDiscounted: 'simple',
    });
    expect(r).toHaveLength(0);
  });

  it('simple payback: investment recovered in exactly 1 year', () => {
    const r = config.calculate({
      initialInvestment: '10000',
      annualCashFlow: '10000',
      useDiscounted: 'simple',
    });
    near(parseNumber(getValue(r, 'simplePayback')), 1.0);
  });

  it('discounted payback produces NPV alongside payback', () => {
    const r = config.calculate({
      initialInvestment: '100000',
      annualCashFlow: '25000',
      useDiscounted: 'discounted',
      discountRate: '8',
      projectLife: '6',
    });
    // Should have discounted payback result
    expect(parseNumber(getValue(r, 'discountedPayback'))).toBeGreaterThan(0);
    // Should have NPV result
    const npv = getValue(r, 'npv');
    expect(npv.length).toBeGreaterThan(0);
    // Should show discount rate
    expect(getValue(r, 'discountRateUsed')).toBe('8.0%');
  });

  it('empty object returns empty array', () => {
    const r = config.calculate({});
    expect(r).toHaveLength(0);
  });
});
