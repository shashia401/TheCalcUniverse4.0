import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/roi/index';
import { getValue, parseNumber } from '../../helpers';

describe('ROI calculator', () => {
  it('calculates basic ROI', () => {
    const r = config.calculate({
      amountInvested: '10000',
      amountReturned: '15000',
      years: '',
    });
    const roi = getValue(r, 'roi');
    expect(roi).toContain('+');
    expect(roi).toContain('%');
    expect(parseNumber(roi)).toBeCloseTo(50, 0);
  });

  it('calculates annualized ROI with years', () => {
    const r = config.calculate({
      amountInvested: '10000',
      amountReturned: '20000',
      years: '5',
    });
    const annualized = parseNumber(getValue(r, 'annualizedRoi'));
    // (20000/10000)^(1/5) - 1 ≈ 14.87%
    expect(annualized).toBeGreaterThan(14);
    expect(annualized).toBeLessThan(15);
  });

  it('shows negative ROI for losses', () => {
    const r = config.calculate({
      amountInvested: '10000',
      amountReturned: '8000',
      years: '',
    });
    expect(getValue(r, 'roi')).toContain('-');
    expect(getValue(r, 'netProfit')).toContain('-');
  });

  it('returns empty for zero investment', () => {
    const r = config.calculate({
      amountInvested: '0',
      amountReturned: '100',
      years: '',
    });
    expect(r).toEqual([]);
  });
});
