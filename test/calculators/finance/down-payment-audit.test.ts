import { describe, it, expect } from 'vitest';
import config, { monthsToEightyPercentLtv } from '../../../src/calculators/finance/down-payment/index';
import { getValue } from '../../helpers';

// Expected values: independent Python month-by-month loops (savings compounding monthly, end-of-month deposits;
// 30-year amortization at 6.8% until balance <= 80% of price).
describe('down-payment audit', () => {
  it('David & Michelle: $35k saved + $2,000/mo at 4% reaches the 20% goal ($90,000) in 25 months', () => {
    const r = config.calculate({ homePrice: '450000', targetDownPct: '20', currentSavings: '35000', monthlySavings: '2000', expectedReturn: '4' });
    expect(getValue(r, 'targetDownPayment')).toBe('$90,000');
    expect(getValue(r, 'savingsGap')).toBe('$55,000');
    expect(getValue(r, 'monthsToGoal')).toContain('25 months');
  });

  it('FAQ timeline: $350k home, $10k saved, 4%: $1,000/mo -> 54 months, $1,500 -> 37, $2,000 -> 29', () => {
    const base = { homePrice: '350000', targetDownPct: '20', currentSavings: '10000', expectedReturn: '4' };
    expect(getValue(config.calculate({ ...base, monthlySavings: '1000' }), 'monthsToGoal')).toContain('54 months');
    expect(getValue(config.calculate({ ...base, monthlySavings: '1500' }), 'monthsToGoal')).toContain('37 months');
    expect(getValue(config.calculate({ ...base, monthlySavings: '2000' }), 'monthsToGoal')).toContain('29 months');
  });

  it('PMI lasts until scheduled payments reach 80% LTV (regression: used an arbitrary months formula)', () => {
    expect(monthsToEightyPercentLtv(350000, 332500, 6.8)).toBe(127); // 5% down
    expect(monthsToEightyPercentLtv(350000, 315000, 6.8)).toBe(98); // 10% down
    expect(monthsToEightyPercentLtv(450000, 415000, 6.8)).toBe(112); // David & Michelle buying now
    expect(monthsToEightyPercentLtv(350000, 280000, 6.8)).toBe(0); // 20% down
  });

  it('5% down on $350k: PMI $2,660/yr for ~10.6 years = about $28,152', () => {
    const r = config.calculate({ homePrice: '350000', targetDownPct: '5', currentSavings: '5000', monthlySavings: '500', expectedReturn: '3' });
    expect(getValue(r, 'pmiWarning')).toBe('Yes — add ~$2,660/yr to your payment');
    expect(getValue(r, 'totalPmiCost')).toBe('~$28,152 total (about 10.6 years)');
  });

  it('mortgage rate input drives the payment: $280,000 loan at 6.8% = $1,825; at 0% = $778', () => {
    const base = { homePrice: '350000', targetDownPct: '20', currentSavings: '70000', monthlySavings: '0' };
    expect(getValue(config.calculate({ ...base }), 'monthlyPayment')).toBe('$1,825'); // 280000*r/(1-(1+r)^-360), r=0.068/12
    expect(getValue(config.calculate({ ...base, mortgageRate: '0' }), 'monthlyPayment')).toBe('$778');
  });

  it('goal already met with no monthly savings; a lone return can still reach the goal', () => {
    const met = config.calculate({ homePrice: '300000', targetDownPct: '20', currentSavings: '60000', monthlySavings: '0' });
    expect(getValue(met, 'monthsToGoal')).toBe('Goal already met!');
    const growth = config.calculate({ homePrice: '300000', targetDownPct: '20', currentSavings: '50000', monthlySavings: '0', expectedReturn: '5' });
    expect(getValue(growth, 'monthsToGoal')).toContain('months'); // 50k -> 60k at 5%/yr compounding monthly
  });
});
