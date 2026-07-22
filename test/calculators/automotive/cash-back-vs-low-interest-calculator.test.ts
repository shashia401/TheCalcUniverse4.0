import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/automotive/cash-back-vs-low-interest/index';

import { getValue, getResult, parseNumber, near } from '../../helpers';

describe('cash-back-vs-low-interest', () => {
  it('cash back wins with large rebate and short term', () => {
    const r = config.calculate({
      vehiclePrice: '25000',
      downPayment: '5000',
      loanTermMonths: '36',
      cashRebate: '4000',
      standardRate: '5',
      promoRate: '3.9',
    });
    expect(r).toHaveLength(8);
    // Option A principal = 25000 - 5000 - 4000 = 16000
    // Option B principal = 25000 - 5000 = 20000
    // Cash back should win with this setup (check label)
    const winnerLabel = getResult(r, 'winner').label;
    expect(winnerLabel).toContain('A');
    expect(getValue(r, 'savingsAmount')).toBeTruthy();
    // Both option payments should be positive
    expect(parseNumber(getValue(r, 'optionAPayment'))).toBeGreaterThan(0);
    expect(parseNumber(getValue(r, 'optionBPayment'))).toBeGreaterThan(0);
  });

  it('low interest wins with 0% promo rate and long term', () => {
    const r = config.calculate({
      vehiclePrice: '35000',
      downPayment: '5000',
      loanTermMonths: '60',
      cashRebate: '2000',
      standardRate: '6.99',
      promoRate: '0',
    });
    expect(r).toHaveLength(8);
    // Option A principal = 35000 - 5000 - 2000 = 28000 at 6.99%
    // Option B principal = 35000 - 5000 = 30000 at 0%
    // Low rate (B) should win at 0% (check label)
    const winnerLabel = getResult(r, 'winner').label;
    expect(winnerLabel).toContain('B');
    // Option A pays interest, Option B pays zero interest
    expect(parseNumber(getValue(r, 'optionAInterest'))).toBeGreaterThan(0);
    near(parseNumber(getValue(r, 'optionBInterest')), 0, 0.01);
  });

  it('roughly breakeven where both options are close', () => {
    // Design: small rebate, moderate rates, mid term
    const r = config.calculate({
      vehiclePrice: '30000',
      downPayment: '0',
      loanTermMonths: '48',
      cashRebate: '1000',
      standardRate: '4.5',
      promoRate: '2.9',
    });
    expect(r).toHaveLength(8);
    // Both option payments should exist and be positive
    expect(parseNumber(getValue(r, 'optionAPayment'))).toBeGreaterThan(0);
    expect(parseNumber(getValue(r, 'optionBPayment'))).toBeGreaterThan(0);
    // Savings should be small, both options close
    const savings = parseNumber(getValue(r, 'savingsAmount'));
    expect(savings).toBeGreaterThan(0);
  });

  it('zero down payment still works', () => {
    const r = config.calculate({
      vehiclePrice: '20000',
      downPayment: '0',
      loanTermMonths: '36',
      cashRebate: '1500',
      standardRate: '5.5',
      promoRate: '1.9',
    });
    expect(r).toHaveLength(8);
    expect(parseNumber(getValue(r, 'optionAPayment'))).toBeGreaterThan(0);
    expect(parseNumber(getValue(r, 'optionBPayment'))).toBeGreaterThan(0);
  });

  it('returns empty for zero vehicle price', () => {
    const r = config.calculate({
      vehiclePrice: '0',
      standardRate: '5',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for missing standard rate', () => {
    const r = config.calculate({
      vehiclePrice: '30000',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for empty inputs', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('loan amount zeroed out by down payment and rebate', () => {
    const r = config.calculate({
      vehiclePrice: '20000',
      downPayment: '20000',
      loanTermMonths: '36',
      cashRebate: '0',
      standardRate: '5',
      promoRate: '2',
    });
    expect(r).toHaveLength(0);
  });
});
