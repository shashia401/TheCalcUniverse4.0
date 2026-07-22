import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/canadian-mortgage';
import { getValue, parseMoney, parseNumber, near } from '../../helpers';

describe('canadian-mortgage', () => {
  const base = {
    price: '750000',
    downPayment: '150000',
    province: 'alberta',
    municipality: 'none',
    firstTimeBuyer: 'no',
    amortization: '25',
    rate: '5.25',
    frequency: 'monthly',
    stressTest: 'no',
  };

  it('basic monthly payment is calculated', () => {
    const r = config.calculate(base);
    expect(r.length).toBeGreaterThanOrEqual(5);
    expect(getValue(r, 'payment')).toMatch(/\$/);
    expect(parseMoney(getValue(r, 'payment'))).toBeGreaterThan(0);
  });

  it('CMHC premium added to principal when down payment < 20%', () => {
    const r = config.calculate({ ...base, downPayment: '50000' });
    expect(getValue(r, 'cmhc')).toContain('added to principal');
    const principal = parseMoney(getValue(r, 'principal'));
    expect(principal).toBeGreaterThan(700000);
  });

  it('CMHC not required when down payment is 20%+', () => {
    const r = config.calculate(base);
    expect(getValue(r, 'cmhc')).toContain('Not required');
  });

  it('accelerated bi-weekly saves interest vs monthly', () => {
    const rAccel = config.calculate({ ...base, frequency: 'accelbiweekly' });
    expect(getValue(rAccel, 'savedInterest')).toBeTruthy();
    expect(getValue(rAccel, 'savedYears')).toBeTruthy();
    expect(parseMoney(getValue(rAccel, 'savedInterest'))).toBeGreaterThan(0);
  });

  it('stress test produces qualifying payment', () => {
    const r = config.calculate({ ...base, stressTest: 'plus2' });
    expect(getValue(r, 'stressTestQualifying')).toContain('qualifying at');
    expect(getValue(r, 'stressTestMaxPrice')).toMatch(/\$[\d,.]/);
  });

  it('minimum down payment error for insufficient down', () => {
    const r = config.calculate({ ...base, downPayment: '10000' });
    expect(getValue(r, 'error')).toContain('Minimum');
  });

  it('returns empty when price is missing or invalid', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('land transfer tax shown for Ontario', () => {
    const r = config.calculate({ ...base, province: 'ontario' });
    expect(getValue(r, 'lttTotal')).toMatch(/\$/);
  });

  it('no LTT shown for Alberta', () => {
    const r = config.calculate(base);
    expect(getValue(r, 'lttTotal')).toContain('No provincial LTT');
  });
});
