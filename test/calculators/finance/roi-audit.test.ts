import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/roi/index';
import { computeRoi } from '../../../src/calculators/finance/roi/roiMath';
import { getValue, near } from '../../helpers';

// Hand-derived: ROI = (R - I)/I; annualized = (R/I)^(1/t) - 1.
describe('ROI audit', () => {
  it('computeRoi keeps the sign for a loss (regression: the panel used to parse "-50.00%" as +50)', () => {
    const f = computeRoi(5000, 2500, 2);
    expect(f.totalRoiPct).toBe(-50);
    expect(f.netProfit).toBe(-2500);
    expect(f.multiplier).toBe(0.5);
    near(f.annualizedPct, -29.2893, 0.001); // 0.5^0.5 - 1
  });

  it('worked example: David 15,000 -> 22,700 over 3 years', () => {
    const r = config.calculate({ amountInvested: '15000', amountReturned: '22700', years: '3' });
    expect(getValue(r, 'roi')).toBe('+51.33%');
    expect(getValue(r, 'annualizedRoi')).toBe('+14.81%'); // 1.513333^(1/3) = 1.148096
    expect(getValue(r, 'multiplier')).toBe('1.51x');
  });

  it('worked example: Priya 5,000 -> 2,500 over 2 years', () => {
    const r = config.calculate({ amountInvested: '5000', amountReturned: '2500', years: '2' });
    expect(getValue(r, 'roi')).toBe('-50.00%');
    expect(getValue(r, 'annualizedRoi')).toBe('-29.29%');
  });

  it('worked example: Marcus 65,000 -> 100,000 over 5 years', () => {
    const r = config.calculate({ amountInvested: '65000', amountReturned: '100000', years: '5' });
    expect(getValue(r, 'roi')).toBe('+53.85%'); // 35000/65000
    expect(getValue(r, 'annualizedRoi')).toBe('+9.00%'); // 1.538462^0.2 = 1.0900
    expect(getValue(r, 'netProfit')).toBe('+$35,000.00');
  });

  it('diagram example: 10,000 -> 15,000 over 5 years = 8.45% annualized', () => {
    const r = config.calculate({ amountInvested: '10000', amountReturned: '15000', years: '5' });
    expect(getValue(r, 'annualizedRoi')).toBe('+8.45%');
  });

  it('total loss annualizes to -100%; no holding period omits annualized rows', () => {
    const r = config.calculate({ amountInvested: '1000', amountReturned: '0', years: '4' });
    expect(getValue(r, 'annualizedRoi')).toBe('-100.00%');
    const n = config.calculate({ amountInvested: '1000', amountReturned: '1200' });
    expect(n.find((x) => x.id === 'annualizedRoi')).toBeUndefined();
  });

  it('rejects non-positive investment and negative return', () => {
    expect(config.calculate({ amountInvested: '0', amountReturned: '10' })).toEqual([]);
    expect(config.calculate({ amountInvested: '100', amountReturned: '-5' })).toEqual([]);
  });
});
