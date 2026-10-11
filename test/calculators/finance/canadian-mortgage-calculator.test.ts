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

  it('minimum down payment for $1.5M+ property requires 20% (insured cap raised from $1M, Dec 15 2024)', () => {
    const r = config.calculate({ ...base, price: '1600000', downPayment: '150000' });
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

describe('canadian-mortgage – audit regressions (LTT tables 2026, insured rules)', () => {
  const base = {
    price: '800000', downPayment: '160000', province: 'ontario', municipality: 'none',
    firstTimeBuyer: 'no', amortization: '25', rate: '5.25', frequency: 'monthly', stressTest: 'no',
  };
  const ltt = (v: Record<string, string>) => parseMoney(getValue(config.calculate({ ...base, ...v }), 'lttTotal'));

  it('Ontario $800K: 275 + 1,950 + 2,250 + 2%x400K = $12,475 (was quoted as $11,475 in FAQ)', () => {
    expect(ltt({})).toBeCloseTo(12475, 0);
  });
  it('Toronto $800K non-first-time buyer pays full municipal tax (no automatic $4,475 rebate): 12,475 x 2', () => {
    expect(ltt({ municipality: 'Toronto' })).toBeCloseTo(24950, 0);
  });
  it('Toronto $800K first-time buyer: 24,950 - 4,000 provincial - 4,475 municipal = 16,475', () => {
    expect(ltt({ municipality: 'Toronto', firstTimeBuyer: 'yes' })).toBeCloseTo(16475, 0);
  });
  it('Toronto $3.5M uses the Apr-2026 graduated rate: ON-bracket sum 83,475 (2.5% to $3M, 4.4% above)', () => {
    // province: 275+1950+2250+32000+25000+2.5%*500K = 73,975? -> provincial 2.5% above $2M:
    //   0.5%*55K + 1%*195K + 1.5%*150K + 2%*1.6M + 2.5%*1.5M = 275+1950+2250+32000+37500 = 73,975
    // Toronto: ... + 2.5%*1M + 4.4%*500K = 275+1950+2250+32000+25000+22000 = 83,475
    expect(ltt({ price: '3500000', downPayment: '700000', municipality: 'Toronto' })).toBeCloseTo(73975 + 83475, 0);
  });
  it('BC $700K first-time buyer: tax 2,000+2%x500K = 12,000, exempt $8,000 -> 4,000', () => {
    expect(ltt({ province: 'bc', price: '700000', downPayment: '140000', firstTimeBuyer: 'yes' })).toBeCloseTo(4000, 0);
  });
  it('BC $850K first-time buyer: tax 15,000 less partial exemption 8,000x(860K-850K)/25K = 3,200 -> 11,800', () => {
    expect(ltt({ province: 'bc', price: '850000', downPayment: '170000', firstTimeBuyer: 'yes' })).toBeCloseTo(11800, 0);
  });
  it('BC $900K first-time buyer gets no exemption (above $860K): 2,000+2%x700K = 16,000', () => {
    expect(ltt({ province: 'bc', price: '900000', downPayment: '180000', firstTimeBuyer: 'yes' })).toBeCloseTo(16000, 0);
  });
  it('Quebec $400K (2026 brackets): 0.5%x62,900 + 1%x252,100 + 1.5%x85,000 = 4,110.50, no FTB rebate', () => {
    expect(ltt({ province: 'quebec', price: '400000', downPayment: '80000', firstTimeBuyer: 'yes' })).toBeCloseTo(4110.5, 1);
  });
  it('Saskatchewan has no land transfer tax', () => {
    expect(getValue(config.calculate({ ...base, province: 'saskatchewan' }), 'lttTotal')).toContain('No provincial LTT');
  });

  it('insured 30-yr amortization allowed for first-time buyers, still blocked otherwise (Dec 15 2024 rule)', () => {
    const ins = { ...base, province: 'alberta', price: '700000', downPayment: '70000', amortization: '30' };
    expect(config.calculate({ ...ins, firstTimeBuyer: 'no' }).find((x: any) => x.id === 'error')).toBeDefined();
    expect(config.calculate({ ...ins, firstTimeBuyer: 'yes' }).find((x: any) => x.id === 'error')).toBeUndefined();
  });
  it('$1.2M purchase with 5%/10% tiered minimum ($95,000) is allowed (insured cap now $1.5M)', () => {
    const r = config.calculate({ ...base, province: 'alberta', price: '1200000', downPayment: '95000' });
    expect(r.find((x: any) => x.id === 'error')).toBeUndefined();
  });
  it('accelerated bi-weekly on $500K, 25y, 5.25%: ~3.6 years and ~$66K interest saved (semi-annual compounding, independent sim)', () => {
    const r = config.calculate({ ...base, province: 'alberta', price: '625000', downPayment: '125000', frequency: 'accelbiweekly' });
    near(parseMoney(getValue(r, 'savedInterest')), 66089, 5);
    near(parseFloat(getValue(r, 'savedYears')), 3.62, 0.01);
  });
});
