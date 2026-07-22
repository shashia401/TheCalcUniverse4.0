import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/canadian-mortgage';
import { getValue, parseMoney, parseNumber, near } from '../../helpers';

describe('canadian-mortgage-calculator', () => {
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

  it('returns empty array when price is missing or invalid', () => {
    expect(config.calculate({})).toHaveLength(0);
    expect(config.calculate({ price: '', downPayment: '50000', amortization: '25', rate: '5', frequency: 'monthly' })).toHaveLength(0);
  });

  it('returns empty array when annual rate is negative', () => {
    expect(config.calculate({ ...base, rate: '-2' })).toHaveLength(0);
  });

  it('returns empty array when annual rate exceeds 30%', () => {
    expect(config.calculate({ ...base, rate: '35' })).toHaveLength(0);
  });

  it('returns empty array when down payment exceeds price', () => {
    expect(config.calculate({ ...base, downPayment: '800000' })).toHaveLength(0);
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

  it('stress test with floor525 uses the higher of contract+2 or 5.25%', () => {
    const rLow = config.calculate({ ...base, rate: '2.00', stressTest: 'floor525' });
    expect(getValue(rLow, 'stressTestQualifying')).toContain('qualifying at 5.25%');
  });

  it('minimum down payment error for insufficient down', () => {
    const r = config.calculate({ ...base, downPayment: '10000' });
    expect(getValue(r, 'error')).toContain('Minimum');
  });

  it('minimum down payment for $1M+ property requires 20%', () => {
    const r = config.calculate({ ...base, price: '1200000', downPayment: '150000' });
    expect(getValue(r, 'error')).toContain('Minimum');
  });

  it('land transfer tax shown for Ontario', () => {
    const r = config.calculate({ ...base, province: 'ontario' });
    expect(getValue(r, 'lttTotal')).toMatch(/\$/);
  });

  it('no LTT shown for Alberta', () => {
    const r = config.calculate(base);
    expect(getValue(r, 'lttTotal')).toContain('No provincial LTT');
  });

  it('Toronto municipal LTT adds additional tax', () => {
    const rOnt = config.calculate({ ...base, province: 'ontario', municipality: 'none' });
    const rTor = config.calculate({ ...base, province: 'ontario', municipality: 'Toronto' });
    const ontLtt = parseMoney(getValue(rOnt, 'lttTotal'));
    const torLtt = parseMoney(getValue(rTor, 'lttTotal'));
    expect(torLtt).toBeGreaterThan(ontLtt);
  });

  it('first-time buyer rebate reduces LTT in Ontario', () => {
    const rNo = config.calculate({ ...base, province: 'ontario', firstTimeBuyer: 'no' });
    const rYes = config.calculate({ ...base, province: 'ontario', firstTimeBuyer: 'yes' });
    const lttNo = parseMoney(getValue(rNo, 'lttTotal'));
    const lttYes = parseMoney(getValue(rYes, 'lttTotal'));
    expect(lttYes).toBeLessThan(lttNo);
  });

  it('effective annual rate is calculated from semi-annual compounding', () => {
    const r = config.calculate(base);
    expect(getValue(r, 'effRate')).toMatch(/%$/);
    const effRate = parseNumber(getValue(r, 'effRate'));
    // For 5.25% semi-annual: (1 + 0.0525/2)^2 - 1 = 0.05315... (about 5.315%)
    expect(effRate).toBeCloseTo(5.32, 1);
  });

  it('known answer: $600K loan at 5% 25yr monthly ~ $3,490', () => {
    const r = config.calculate({
      price: '750000',
      downPayment: '150000',
      province: 'alberta',
      municipality: 'none',
      firstTimeBuyer: 'no',
      amortization: '25',
      rate: '5',
      frequency: 'monthly',
      stressTest: 'no',
    });
    // Principal = 600000, EAR = 5.0625%, monthly rate = (1.050625)^(1/12)-1 = 0.004128...
    // Payment = 600000 * 0.004128 / (1-1.004128^-300) = ~3491
    const pmt = parseMoney(getValue(r, 'payment'));
    near(pmt, 3491, 10);
  });

  it('CMHC error when insured mortgage has >25yr amortization', () => {
    const r = config.calculate({ ...base, downPayment: '50000', amortization: '30' });
    expect(getValue(r, 'error')).toContain('CMHC');
  });

  it('semi-monthly payment is roughly half of monthly', () => {
    const rMonthly = config.calculate(base);
    const rSemi = config.calculate({ ...base, frequency: 'semimonthly' });
    const monthlyPmt = parseMoney(getValue(rMonthly, 'payment'));
    const semiPmt = parseMoney(getValue(rSemi, 'payment'));
    expect(semiPmt * 2).toBeCloseTo(monthlyPmt, 0);
  });
});
