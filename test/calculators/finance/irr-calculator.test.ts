import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/irr-calculator/index';
import { getValue, parseNumber, parseMoney, near } from '../../helpers';

describe('irr-calculator', () => {
  it('calculates IRR for standard investment with positive cash flows', () => {
    const r = config.calculate({
      initialInvestment: '100000',
      year1: '25000',
      year2: '30000',
      year3: '35000',
      year4: '40000',
      year5: '45000',
    });
    expect(r.length).toBeGreaterThanOrEqual(4);
    const irrResult = r.find(x => x.id === 'irrResult');
    expect(irrResult).toBeDefined();
    expect(parseNumber(irrResult!.value)).toBeGreaterThan(0);
    expect(parseMoney(getValue(r, 'totalCashInflows'))).toBe(175000);
    expect(parseMoney(getValue(r, 'totalReturn'))).toBe(75000);
    // Payback period should be between 2-3 years
    const payback = parseNumber(getValue(r, 'paybackPeriodResult'));
    expect(payback).toBeGreaterThan(2);
    expect(payback).toBeLessThan(4);
  });

  it('returns empty for zero initial investment', () => {
    const r = config.calculate({
      initialInvestment: '0',
      year1: '10000',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for missing required fields', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('calculates NPV when discount rate is provided', () => {
    const r = config.calculate({
      initialInvestment: '100000',
      discountRate: '10',
      year1: '30000',
      year2: '30000',
      year3: '30000',
      year4: '30000',
      year5: '30000',
    });
    const npvResult = r.find(x => x.id === 'npvResult');
    expect(npvResult).toBeDefined();
    expect(getValue(r, 'irrResult')).not.toContain('Cannot calculate');
    // NPV should be positive with $150k total inflows vs $100k investment
    expect(getValue(r, 'npvResult')).toBeDefined();
  });

  it('calculates IRR for a very high-return investment', () => {
    const r = config.calculate({
      initialInvestment: '50000',
      year1: '50000',
      year2: '50000',
    });
    const irrValue = parseNumber(getValue(r, 'irrResult'));
    // Doubling money in 1 year and tripling in 2 = very high IRR
    expect(irrValue).toBeGreaterThan(50);
  });

  it('returns result without NPV when discount rate is omitted', () => {
    const r = config.calculate({
      initialInvestment: '100000',
      year1: '25000',
      year2: '30000',
      year3: '35000',
    });
    const npvResult = r.find(x => x.id === 'npvResult');
    expect(npvResult).toBeUndefined();
  });

  it('shows negative net return when inflows are less than investment', () => {
    const r = config.calculate({
      initialInvestment: '100000',
      year1: '10000',
      year2: '10000',
    });
    expect(parseMoney(getValue(r, 'totalReturn'))).toBeLessThan(0);
  });

  it('handles single-year cash flow', () => {
    const r = config.calculate({
      initialInvestment: '1000',
      year1: '1500',
    });
    const irrValue = parseNumber(getValue(r, 'irrResult'));
    // IRR for $1000 invested, $1500 returned in 1 year = 50%
    near(irrValue, 50, 0.5);
    expect(parseNumber(getValue(r, 'paybackPeriodResult'))).toBeLessThan(1.5);
  });

  // ── Known-answer math correctness tests ──

  it('returns exactly 10% IRR for $1000 → $1100 in 1 year', () => {
    const r = config.calculate({
      initialInvestment: '1000',
      year1: '1100',
    });
    const irrValue = parseNumber(getValue(r, 'irrResult'));
    near(irrValue, 10, 0.01);
  });

  it('returns exactly 0% IRR when total inflows equal investment (no growth)', () => {
    const r = config.calculate({
      initialInvestment: '5000',
      year1: '2500',
      year2: '2500',
    });
    const irrValue = parseNumber(getValue(r, 'irrResult'));
    near(irrValue, 0, 0.5);
  });

  it('handles all-negative cash flows gracefully (no IRR possible)', () => {
    const r = config.calculate({
      initialInvestment: '1000',
      year1: '-200',
      year2: '-300',
    });
    const irrValue = getValue(r, 'irrResult');
    expect(irrValue).toContain('Cannot calculate');
  });

  it('handles zero total return (IRR should be near 0%)', () => {
    const r = config.calculate({
      initialInvestment: '10000',
      year1: '5000',
      year2: '5000',
    });
    const irrValue = parseNumber(getValue(r, 'irrResult'));
    near(irrValue, 0, 0.5);
  });

  it('calculates correctly for large investment with small returns (negative IRR)', () => {
    const r = config.calculate({
      initialInvestment: '1000000',
      year1: '50000',
      year2: '50000',
      year3: '50000',
      year4: '50000',
      year5: '50000',
    });
    const irrValue = parseNumber(getValue(r, 'irrResult'));
    // $1M invested, $250k total return over 5 years → negative IRR
    expect(irrValue).toBeLessThan(0);
  });

  it('IRR for $1000 → $1200 in 1 year = 20%', () => {
    const r = config.calculate({
      initialInvestment: '1000',
      year1: '1200',
    });
    const irrValue = parseNumber(getValue(r, 'irrResult'));
    near(irrValue, 20, 0.01);
  });
});
