import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/interest-rate/index';
import { getValue } from '../../helpers';

// Independent: r = n[(A/P)^(1/(nt)) - 1]; EAR = (1+r/n)^n - 1.
describe('interest-rate audit', () => {
  it('Lisa: 10,000 -> 14,500 in 4 years, monthly: 9.3251% nominal, 9.7342% EAR, 0.7771% per month', () => {
    const r = config.calculate({ principal: '10000', finalAmount: '14500', timePeriod: '4', timeUnit: 'years', compoundFrequency: '12' });
    expect(getValue(r, 'nominalRate')).toBe('9.3251%');
    expect(getValue(r, 'ear')).toBe('9.7342%');
    expect(getValue(r, 'periodicRate')).toBe('0.7771%');
    const simple = config.calculate({ principal: '10000', finalAmount: '14500', timePeriod: '4', timeUnit: 'years', compoundFrequency: '0' });
    expect(getValue(simple, 'nominalRate')).toBe('11.2500%');
  });

  it('Tom: 5,000 -> 6,920 in 3 years: 10.8816% nominal, 11.4411% EAR; simple interest would be $1,632 vs $1,920', () => {
    const r = config.calculate({ principal: '5000', finalAmount: '6920', timePeriod: '3', timeUnit: 'years', compoundFrequency: '12' });
    expect(getValue(r, 'nominalRate')).toBe('10.8816%');
    expect(getValue(r, 'ear')).toBe('11.4411%');
    expect(5000 * 0.108816 * 3).toBeCloseTo(1632.24, 1);
  });

  it('quarterly and annual labels are named (regression: showed "4x/yr" and "1x/yr")', () => {
    const q = config.calculate({ principal: '1000', finalAmount: '1100', timePeriod: '2', timeUnit: 'years', compoundFrequency: '4' });
    expect(q[0].label).toBe('Nominal Annual Rate (compounded quarterly)');
    const a = config.calculate({ principal: '1000', finalAmount: '1100', timePeriod: '2', timeUnit: 'years', compoundFrequency: '1' });
    expect(a[0].label).toBe('Nominal Annual Rate (compounded annually)');
    expect(getValue(a, 'nominalRate')).toBe('4.8809%'); // sqrt(1.1) - 1
    expect(getValue(q, 'periodicRate')).not.toContain('0.08');
    expect(q.find((x) => x.id === 'periodicRate')!.label).toBe('Rate per Period (quarterly)');
  });

  it('pro-tip EAR facts: 24% monthly = 26.82%; 25% daily = 28.39%; approx rule 12% -> 12.66%', () => {
    expect(((1 + 0.24 / 12) ** 12 - 1) * 100).toBeCloseTo(26.82, 2);
    expect(((1 + 0.25 / 365) ** 365 - 1) * 100).toBeCloseTo(28.39, 2);
    expect((0.12 + (0.12 ** 2 * 11) / 24) * 100).toBeCloseTo(12.66, 2);
  });

  it('A <= P gives a notice; blank gives []', () => {
    expect(config.calculate({ principal: '1000', finalAmount: '900', timePeriod: '2', timeUnit: 'years', compoundFrequency: '12' })[0].id).toBe('error');
    expect(config.calculate({})).toEqual([]);
  });
});
