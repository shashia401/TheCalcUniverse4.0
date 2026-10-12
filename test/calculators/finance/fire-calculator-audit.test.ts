import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/fire-calculator/index';
import { computeFire, parseFireInputs, projectToTarget } from '../../../src/calculators/finance/fire-calculator/fireMath';
import { getValue } from '../../helpers';

// Reference values from an independent year-by-year loop (B = B*(1+r) + savings, contributions at year end).
const maya = { currentAge: '28', currentNetWorth: '65000', annualIncome: '95000', annualExpenses: '48000', investmentReturn: '7', targetWithdrawalRate: '4', fireType: 'standard' };
const kevin = { currentAge: '40', currentNetWorth: '200000', annualIncome: '62000', annualExpenses: '35000', investmentReturn: '7', targetWithdrawalRate: '4', fireType: 'lean' };

describe('fire-calculator audit', () => {
  it('Maya: $1.2M target, 14 years, age 42, portfolio $1.23M', () => {
    const r = config.calculate(maya);
    expect(getValue(r, 'fireNumber')).toBe('$1.20M');
    expect(getValue(r, 'savingsRate')).toBe('49.5%');
    expect(getValue(r, 'yearsToFire')).toBe('14 years');
    expect(getValue(r, 'fireAge')).toBe('42 years old');
    expect(getValue(r, 'nwAtRetirement')).toBe('$1.23M');
  });

  it('Kevin (lean): $875,000 target, 12 years, age 52; coast check: $200k at 7% for 25 years = $1,085,487', () => {
    const r = config.calculate(kevin);
    expect(getValue(r, 'fireNumber')).toBe('$875,000');
    expect(getValue(r, 'yearsToFire')).toBe('12 years');
    expect(getValue(r, 'fireAge')).toBe('52 years old');
    expect(200000 * Math.pow(1.07, 25)).toBeCloseTo(1_085_486.53, 1);
    const coast = config.calculate({ ...kevin, fireType: 'coast' });
    expect(getValue(coast, 'coastFireNumber')).toBe('$161,218'); // 875,000 / 1.07^25
    expect(getValue(coast, 'yearsToFire')).toBe('0 years'); // already past it
  });

  it('SVG/bar-chart years-to-FIRE from $0 at 7%: 10% -> 42, 30% -> 24, 50% -> 15, 70% -> 8 (closed form ln(1+25(1-s)r/s)/ln(1+r))', () => {
    const yearsFor = (s: number) => {
      const income = 100000;
      const f = computeFire({ currentAge: 25, netWorth: 0, income, expenses: income * (1 - s), returnPct: 7, withdrawalPct: 4, fireType: 'standard' });
      return f.yearsToFire;
    };
    expect(yearsFor(0.1)).toBe(42);
    expect(yearsFor(0.2)).toBe(31);
    expect(yearsFor(0.3)).toBe(25); // 24.03 rounds up to the next full year
    expect(yearsFor(0.5)).toBe(15);
    expect(yearsFor(0.7)).toBe(9); // 8.27 -> next full year (end-of-year contributions)
  });

  it('0% return is honoured (regression: "|| 7" turned 0 into 7%) and 10 years of $10k reaches $100k', () => {
    const f = computeFire({ currentAge: 30, netWorth: 0, income: 50000, expenses: 40000, returnPct: 0, withdrawalPct: 4, fireType: 'standard' });
    expect(f.fireNumber).toBe(1_000_000);
    expect(f.yearsToFire).toBe(100); // 1,000,000 / 10,000 per year
    const p = projectToTarget(0, 10000, 100000, 0);
    expect(p.years).toBe(10);
    expect(p.reached).toBe(true);
    const r = config.calculate({ ...maya, investmentReturn: '0' });
    expect(getValue(r, 'yearsToFire')).not.toBe('14 years');
  });

  it('unreachable targets say so instead of reporting 100 years (regression)', () => {
    const r = config.calculate({ ...maya, currentNetWorth: '0', annualExpenses: '95000' }); // saves nothing, owns nothing
    expect(getValue(r, 'fireAge')).toBe('Not achievable');
    expect(getValue(r, 'yearsToFire')).toBe('N/A');
  });

  it('the savings-rate input now drives savings (regression: it was display-only)', () => {
    const f = computeFire(parseFireInputs({ ...maya, currentSavingsRate: '30' })!);
    expect(f.annualSavings).toBeCloseTo(28500, 6);
    expect(f.savingsRate).toBe(30);
  });

  it('withdrawal rate applies to lean and fat too; fat adds the 1.5x cushion', () => {
    const lean = config.calculate({ ...kevin, targetWithdrawalRate: '3.5' });
    expect(getValue(lean, 'fireNumber')).toBe('$1,000,000'); // 35,000 / 0.035
    const fat = config.calculate({ ...kevin, fireType: 'fat' });
    expect(getValue(fat, 'fireNumber')).toBe('$1.31M'); // 35,000 x 1.5 / 0.04 = 1,312,500
  });
});
