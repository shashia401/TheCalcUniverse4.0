import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/interest-calculator/index';
import { computeInterest } from '../../../src/calculators/finance/interest-calculator/interestMath';
import { getValue } from '../../helpers';

describe('interest-calculator audit', () => {
  it('SVG: $10,000 at 7% for 30 years — simple $31,000, annual compounding $76,123 (2.5x)', () => {
    const s = config.calculate({ principal: '10000', interestRate: '7', timeUnit: 'years', timePeriod: '30', interestType: 'simple' });
    expect(getValue(s, 'totalAmount')).toBe('$31,000.00');
    const c = config.calculate({ principal: '10000', interestRate: '7', timeUnit: 'years', timePeriod: '30', interestType: 'compound', compoundFrequency: '1' });
    expect(getValue(c, 'totalAmount')).toBe('$76,122.55'); // 10,000 x 1.07^30
    expect(76122.55 / 31000).toBeCloseTo(2.456, 3);
  });

  it('EAR: 12% nominal compounded monthly = 12.6825% (FAQ says 12.68%)', () => {
    const r = config.calculate({ principal: '1000', interestRate: '12', timeUnit: 'years', timePeriod: '1', interestType: 'compound', compoundFrequency: '12' });
    expect(getValue(r, 'effectiveRate')).toBe('12.6825%');
    expect(getValue(r, 'totalAmount')).toBe('$1,126.83');
  });

  it('time units: 18 months = 1.5 years, 73 days = 0.2 years (actual/365)', () => {
    const m = computeInterest({ principal: 1000, annualRate: 0.06, timeUnit: 'months', timePeriod: 18, interestType: 'simple', n: 1 });
    expect(m.totalInterest).toBeCloseTo(90, 10);
    const d = computeInterest({ principal: 1000, annualRate: 0.06, timeUnit: 'days', timePeriod: 73, interestType: 'simple', n: 1 });
    expect(d.totalInterest).toBeCloseTo(12, 10);
  });

  it('daily compounding for 30 days at 5%: 1000 x (1 + 0.05/365)^30 = 1004.1 (independent exponent)', () => {
    const r = config.calculate({ principal: '1000', interestRate: '5', timeUnit: 'days', timePeriod: '30', interestType: 'compound', compoundFrequency: '365' });
    expect(getValue(r, 'totalAmount')).toBe('$1,004.12');
    const bonus = r.find((x) => x.id === 'compoundBonus');
    expect(bonus).toBeUndefined(); // compound vs simple differs by < 1 cent over 30 days at 5%
  });

  it('runaway results return a notice instead of Infinity (regression)', () => {
    const r = config.calculate({ principal: '1000000', interestRate: '100', timeUnit: 'years', timePeriod: '36500', interestType: 'compound', compoundFrequency: '365' });
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe('error');
  });

  it('zero rate: no interest, growth multiple 1', () => {
    const r = config.calculate({ principal: '500', interestRate: '0', timeUnit: 'years', timePeriod: '10', interestType: 'compound', compoundFrequency: '12' });
    expect(getValue(r, 'totalInterest')).toBe('$0.00');
    expect(getValue(r, 'growthMultiple')).toBe('1.000× your money');
  });
});
