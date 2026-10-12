import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/home-equity-loan/index';
import { getValue } from '../../helpers';

// pmt: P*r/(1-(1+r)^-n). Independent Python: 52,000 @ 8.5%/120 mo = 644.7256; /240 mo = 451.2681.
const maria = { homeValue: '400000', currentMortgage: '250000', creditProfile: 'excellent', desiredLoan: '50000', interestRate: '8.5', loanTerm: '120', closingCosts: '2000' };

describe('home-equity-loan audit', () => {
  it('Maria: $50k + $2k closing costs rolled in at 8.5% for 10 years = $644.73/mo, interest $25,367', () => {
    const r = config.calculate(maria);
    expect(getValue(r, 'monthlyPayment')).toBe('$644.73 (costs rolled in)');
    expect(getValue(r, 'totalInterest')).toBe('$25,367');
    expect(getValue(r, 'ltvRatio')).toBe('75.0%');
    expect(getValue(r, 'maxAvailable')).toBe('$90,000'); // 0.85 x 400,000 - 250,000
    const twenty = config.calculate({ ...maria, loanTerm: '240' });
    expect(getValue(twenty, 'monthlyPayment')).toBe('$451.27 (costs rolled in)');
    expect(getValue(twenty, 'totalInterest')).toBe('$56,304');
  });

  it('James: 75% of $300k is $225k < $250k mortgage, so nothing is available', () => {
    const r = config.calculate({ homeValue: '300000', currentMortgage: '250000', creditProfile: 'fair', desiredLoan: '40000', interestRate: '9.5', loanTerm: '180', closingCosts: '0' });
    expect(getValue(r, 'maxAvailable')).toBe('$0');
    expect(getValue(r, 'actualLoan')).toBe('$0'); // approved amount is capped to 0, not 40,000
    expect(getValue(r, 'monthlyPayment')).toBe('$0.00');
  });

  it('closing costs are used as entered (regression: silently capped at 5% of the loan)', () => {
    // $50k loan, $10,000 costs (20%): financed 60,000 at 8.5%/120 = 743.9...
    const r = config.calculate({ ...maria, closingCosts: '10000' });
    expect(getValue(r, 'closingCostsLine')).toBe('$10,000');
    expect(getValue(r, 'monthlyPayment')).toBe('$743.91 (costs rolled in)'); // 60,000 x 0.0070833/(1-(1+0.0070833)^-120)
  });

  it('desired loan above the CLTV cap is approved only up to the cap', () => {
    const r = config.calculate({ ...maria, desiredLoan: '200000', closingCosts: '0' });
    expect(getValue(r, 'actualLoan')).toBe('$90,000');
    expect(getValue(r, 'ltvRatio')).toBe('85.0%');
  });

  it('15-year vs 20-year pro tip: 28.7% less interest, 13.5% higher payment at 8.5%', () => {
    const base = { homeValue: '1000000', currentMortgage: '0', creditProfile: 'excellent', desiredLoan: '100000', interestRate: '8.5', closingCosts: '0' };
    const p15 = parseFloat(getValue(config.calculate({ ...base, loanTerm: '180' }), 'monthlyPayment').replace(/[$,]/g, ''));
    const p20 = parseFloat(getValue(config.calculate({ ...base, loanTerm: '240' }), 'monthlyPayment').replace(/[$,]/g, ''));
    expect(p15 / p20 - 1).toBeCloseTo(0.1348, 3);
    expect(1 - (p15 * 180 - 100000) / (p20 * 240 - 100000)).toBeCloseTo(0.2865, 3);
  });

  it('chart() mirrors calculate(): null when nothing is approved, series end at the financed amount', () => {
    expect(config.chart!({ ...maria, desiredLoan: '0' })).toBeNull();
    const c = config.chart!(maria)!;
    const last = c.points[c.points.length - 1].values;
    expect(last[0]).toBeCloseTo(52000, 4); // principal repaid = financed amount
    expect(last[1]).toBeCloseTo(25367.07, 1);
  });
});
