import { describe, it, expect } from 'vitest';
import sip from '../../../src/calculators/finance/sip-calculator/index';
import swp from '../../../src/calculators/finance/swp-calculator/index';
import { sipFutureValue, sipYearly } from '../../../src/calculators/finance/sip-calculator/sipMath';
import { simulateSwp, monthsToDepletion } from '../../../src/calculators/finance/swp-calculator/swpMath';
import { getValue, near } from '../../helpers';

// Independent annuity-due FV by explicit summation: the instalment paid at the start of month k earns n-k+1 months.
const sipSum = (P: number, rate: number, months: number) => {
  const i = rate / 12;
  let t = 0;
  for (let k = 1; k <= months; k++) t += P * Math.pow(1 + i, k);
  return t;
};

describe('SIP audit', () => {
  it('annuity-due closed form equals instalment-by-instalment summation', () => {
    near(sipFutureValue(0, 10000, 0.12, 180), sipSum(10000, 0.12, 180), 1e-3);
    near(sipFutureValue(0, 5000, 0.12, 360), sipSum(5000, 0.12, 360), 1e-2);
  });

  it('worked examples: Rs 5,000 x 30y @12% = 1.76 crore; Rs 10,000 x 15/20/30y = 50 lakh / 1 crore / 3.5 crore', () => {
    // 5000 x ((1.01^360 - 1)/0.01 = 3494.96) x 1.01 = 17,649,566
    near(sipFutureValue(0, 5000, 0.12, 360), 17649566, 5);
    expect(getValue(sip.calculate({ monthlyInvestment: '5000', expectedReturn: '12', timePeriod: '30' }), 'futureValue')).toBe('₹1.76Cr');
    near(sipFutureValue(0, 10000, 0.12, 180) / 1e5, 50.46, 0.01);
    near(sipFutureValue(0, 10000, 0.12, 240) / 1e7, 0.999, 0.001);
    near(sipFutureValue(0, 10000, 0.12, 360) / 1e7, 3.53, 0.005);
    // 15 x 15 x 15 rule: 15,000/month for 15 years at 15% is about Rs 1.02 crore
    near(sipFutureValue(0, 15000, 0.15, 180) / 1e7, 1.0152, 0.001);
  });

  it('worked example: Priya lump sum 5L + 15,000/m for 12y @10% = 58.33 lakh, 26.6 lakh invested', () => {
    near(sipFutureValue(500000, 0, 0.1, 144) / 1e5, 16.515, 0.01);
    near(sipFutureValue(0, 15000, 0.1, 144) / 1e5, 41.8, 0.02);
    const r = sip.calculate({ lumpsum: '500000', monthlyInvestment: '15000', expectedReturn: '10', timePeriod: '12' });
    expect(getValue(r, 'totalInvested')).toBe('₹26.60L');
    expect(getValue(r, 'futureValue')).toBe('₹58.33L');
  });

  it('annuity-due vs ordinary differ by exactly (1 + r/12)', () => {
    const ordinary = 10000 * ((Math.pow(1.01, 240) - 1) / 0.01);
    near(sipFutureValue(0, 10000, 0.12, 240) / ordinary, 1.01, 1e-9);
  });

  it('honours the active tab: a stale lump sum is ignored on the SIP tab and vice versa (regression)', () => {
    const base = { lumpsum: '1000000', monthlyInvestment: '5000', expectedReturn: '12', timePeriod: '10' };
    const onSip = sip.calculate({ ...base, shape: 'sip' });
    expect(getValue(onSip, 'totalInvested')).toBe('₹6.00L'); // 5000 x 120 months, no lump sum
    const onLump = sip.calculate({ ...base, shape: 'lumpsum' });
    expect(getValue(onLump, 'totalInvested')).toBe('₹10.00L');
  });

  it('chart ends at the final (possibly fractional) year and is not capped at 30 years', () => {
    const y = sipYearly(0, 1000, 0.1, 54); // 4.5 years
    expect(y.map((p) => p.year)).toEqual([1, 2, 3, 4, 4.5]);
    expect(sipYearly(0, 1000, 0.1, 480).length).toBe(40);
  });

  it('zero return and invalid input', () => {
    near(sipFutureValue(100, 50, 0, 12), 700, 1e-9);
    expect(sip.calculate({ monthlyInvestment: '0', lumpsum: '0', expectedReturn: '10', timePeriod: '5' })).toEqual([]);
  });
});

describe('SWP audit', () => {
  it('worked example: 1 crore, 8%, 50,000/month, 30 years leaves about 3.48 crore (closed form C(1+i)^n - W((1+i)^n-1)/i)', () => {
    const i = 0.08 / 12;
    const g = Math.pow(1 + i, 360);
    const closed = 1e7 * g - 50000 * ((g - 1) / i);
    const sim = simulateSwp(1e7, 0.08, 50000, 360);
    near(sim.ending, closed, 0.5);
    near(sim.ending / 1e7, 3.484, 0.001);
    expect(sim.depleted).toBe(false);
    expect(getValue(swp.calculate({ corpus: '10000000', expectedReturn: '8', monthlyWithdrawal: '50000', withdrawalPeriod: '30' }), 'finalValue')).toBe('₹3.48Cr');
  });

  it('FAQ: 10% annual withdrawal at 8% return depletes in about 20 years (242 months)', () => {
    near(monthsToDepletion(1e6, 0.08, 100000 / 12), 242.2, 0.1);
    const sim = simulateSwp(1e6, 0.08, 100000 / 12, 360);
    expect(sim.depleted).toBe(true);
    expect(sim.monthsPaid).toBe(243); // 242.2 -> the 243rd payment is the partial one
  });

  it('never goes negative and the last payment is only what is left', () => {
    const sim = simulateSwp(100000, 0.08, 500000, 60);
    expect(sim.ending).toBe(0);
    near(sim.totalWithdrawn, 100000 * (1 + 0.08 / 12), 1e-6);
    expect(sim.monthsPaid).toBe(1);
  });

  it('conservation with zero return; exactly exhausting the corpus counts as depleted', () => {
    const sim = simulateSwp(120000, 0, 10000, 6);
    expect(sim.totalWithdrawn + sim.ending).toBe(120000);
    expect(sim.depleted).toBe(false);
    expect(simulateSwp(120000, 0, 10000, 12).depleted).toBe(true);
  });

  it('a 60-year horizon is simulated in full (regression: the loop stopped at 600 months and mislabelled it Depleted)', () => {
    const r = swp.calculate({ corpus: '50000000', expectedReturn: '10', monthlyWithdrawal: '100000', withdrawalPeriod: '60' });
    expect(r.find((x) => x.id === 'finalValue')!.label).toContain('Corpus preserved');
    expect(getValue(r, 'monthsLasted')).toContain('720 months');
  });

  it('chart data is year-end balances', () => {
    const sim = simulateSwp(1e7, 0.08, 50000, 36);
    expect(sim.yearly.map((y) => y.year)).toEqual([1, 2, 3]);
  });
});
