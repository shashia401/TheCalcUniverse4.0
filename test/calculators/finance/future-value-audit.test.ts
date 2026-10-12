import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/future-value/index';
import { futureValue } from '../../../src/calculators/finance/future-value/fvMath';
import { getValue } from '../../helpers';

// Independent Python: lump = PV(1+r/m)^(nm); deposits = PMT*((1+i)^(12n)-1)/i with i=(1+r/m)^(m/12)-1.
describe('future-value audit', () => {
  it('Sarah: $15,000 at 7% monthly for 25 years = $85,881; interest $70,881; EAR 7.229%', () => {
    const r = config.calculate({ presentValue: '15000', annualRate: '7', years: '25', compounding: '12', monthlyContribution: '0' });
    expect(getValue(r, 'futureValue')).toBe('$85,881');
    expect(getValue(r, 'totalInterest')).toBe('$70,881');
    expect(getValue(r, 'effectiveAnnualRate')).toBe('7.229%');
    expect(futureValue(15000, 0.07, 12, 0, 15)).toBeCloseTo(42734.2, 1); // 15-year delay example
  });

  it('Marcus: $5,000 + $400/mo at 6% monthly for 30 years = $431,919; delaying 5 years -> $299,522', () => {
    const r = config.calculate({ presentValue: '5000', annualRate: '6', years: '30', compounding: '12', monthlyContribution: '400' });
    expect(getValue(r, 'futureValue')).toBe('$431,919');
    expect(getValue(r, 'totalContributions')).toBe('$144,000');
    expect(getValue(r, 'totalInterest')).toBe('$282,919');
    expect(futureValue(5000, 0.06, 12, 400, 25)).toBeCloseTo(299522.43, 1);
  });

  it('lump-sum compounding comparisons: $100k at 7% for 30 years annual $761,226 vs monthly $811,650; $10k daily $81,645', () => {
    expect(futureValue(100000, 0.07, 1, 0, 30)).toBeCloseTo(761225.5, 1);
    expect(futureValue(100000, 0.07, 12, 0, 30)).toBeCloseTo(811649.75, 1);
    expect(futureValue(10000, 0.07, 365, 0, 30)).toBeCloseTo(81645.26, 1);
  });

  it('$500/month at 7% compounded monthly for 30 years = $609,985 (regression: text said $567,691, an annual-deposit figure)', () => {
    expect(futureValue(0, 0.07, 12, 500, 30)).toBeCloseTo(609985.5, 1);
  });

  it('monthly deposits are monthly for every compounding option (regression: annual compounding deposited once a year, daily deposited daily)', () => {
    // $500/mo, 7% compounded annually, 10 years: i = 1.07^(1/12)-1, FV = 500*((1+i)^120-1)/i = 85,525.87
    expect(futureValue(0, 0.07, 1, 500, 10)).toBeCloseTo(85525.87, 1);
    // monthly compounding equals the textbook formula
    const i = 0.07 / 12;
    expect(futureValue(0, 0.07, 12, 500, 10)).toBeCloseTo(500 * ((Math.pow(1 + i, 120) - 1) / i), 6);
    // more frequent compounding never lowers FV
    expect(futureValue(1000, 0.07, 365, 500, 10)).toBeGreaterThan(futureValue(1000, 0.07, 1, 500, 10));
  });

  it('0% rate: FV = PV + deposits; invalid input returns []', () => {
    expect(futureValue(1000, 0, 12, 100, 5)).toBe(1000 + 100 * 60);
    expect(config.calculate({ presentValue: '0', annualRate: '5', years: '5' })).toEqual([]);
    expect(config.calculate({ presentValue: '1000', annualRate: '5' })).toEqual([]);
  });
});
