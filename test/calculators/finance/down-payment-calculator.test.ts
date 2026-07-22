import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/down-payment/index';
import { getValue, parseMoney, parsePercent, parseNumber, near } from '../../helpers';

describe('down-payment-calculator', () => {
  it('calculates 20% down payment on a $350K home', () => {
    const r = config.calculate({
      homePrice: '350000',
      targetDownPct: '20',
      currentSavings: '20000',
      monthlySavings: '1000',
      expectedReturn: '4',
    });
    // 20% of $350K = $70,000
    near(parseMoney(getValue(r, 'targetDownPayment')), 70000);
    // Savings gap = 70000 - 20000 = 50000
    near(parseMoney(getValue(r, 'savingsGap')), 50000);
    // Current down % = 20000 / 350000 = 5.7%
    near(parsePercent(getValue(r, 'currentDownPct')), 5.7);
    // Target = 20%
    near(parsePercent(getValue(r, 'targetDownPct')), 20);
    // No PMI at 20% down
    expect(getValue(r, 'pmiWarning')).toContain('No');
    expect(getValue(r, 'totalPmiCost')).toBe('$0');
    // Loan amount = 350000 - 70000 = 280000
    near(parseMoney(getValue(r, 'loanAmount')), 280000);
  });

  it('calculates 3.5% FHA down payment correctly', () => {
    const r = config.calculate({
      homePrice: '300000',
      targetDownPct: '3.5',
      currentSavings: '5000',
      monthlySavings: '800',
      expectedReturn: '3',
    });
    // 3.5% of $300K = $10,500
    near(parseMoney(getValue(r, 'targetDownPayment')), 10500);
    // Savings gap = 10500 - 5000 = 5500
    near(parseMoney(getValue(r, 'savingsGap')), 5500);
    // PMI required at 3.5% down
    expect(getValue(r, 'pmiWarning')).toContain('Yes');
    expect(getValue(r, 'totalPmiCost')).not.toBe('$0');
  });

  it('shows goal already met when current savings exceed target', () => {
    const r = config.calculate({
      homePrice: '200000',
      targetDownPct: '10',
      currentSavings: '50000',
      monthlySavings: '500',
      expectedReturn: '2',
    });
    // 10% of $200K = $20,000; $50K saved
    expect(getValue(r, 'savingsGap')).toBe('Already saved!');
    expect(getValue(r, 'monthsToGoal')).toBe('Goal already met!');
  });

  it('calculates months to reach savings goal with compounding', () => {
    const r = config.calculate({
      homePrice: '400000',
      targetDownPct: '20',
      currentSavings: '30000',
      monthlySavings: '1500',
      expectedReturn: '4',
    });
    // Need $80,000. Have $30,000. Need $50,000 more at $1,500/mo with 4% return
    const monthsStr = getValue(r, 'monthsToGoal');
    expect(monthsStr).not.toBe('Increase savings rate');
    expect(monthsStr).not.toBe('Goal already met!');
    // Should be roughly 30-33 months
    const monthsVal = parseNumber(monthsStr);
    expect(monthsVal).toBeGreaterThan(25);
    expect(monthsVal).toBeLessThan(40);
  });

  it('shows PMI cost for 5% down on $350K home', () => {
    const r = config.calculate({
      homePrice: '350000',
      targetDownPct: '5',
      currentSavings: '17500',
      monthlySavings: '1000',
      expectedReturn: '3',
    });
    // 5% of $350K = $17,500 - exactly saved
    expect(getValue(r, 'savingsGap')).toBe('Already saved!');
    // PMI required
    expect(getValue(r, 'pmiWarning')).toContain('Yes');
    // Loan amount = 350000 - 17500 = 332500
    near(parseMoney(getValue(r, 'loanAmount')), 332500);
  });

  it('returns empty array for empty home price', () => {
    const r = config.calculate({
      homePrice: '',
      targetDownPct: '20',
      currentSavings: '20000',
      monthlySavings: '1000',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for NaN home price', () => {
    const r = config.calculate({
      homePrice: 'abc',
      targetDownPct: '20',
      currentSavings: '20000',
      monthlySavings: '1000',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for negative home price', () => {
    const r = config.calculate({
      homePrice: '-100000',
      targetDownPct: '20',
      currentSavings: '20000',
      monthlySavings: '1000',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for invalid current savings', () => {
    const r = config.calculate({
      homePrice: '350000',
      targetDownPct: '20',
      currentSavings: 'xyz',
      monthlySavings: '1000',
    });
    expect(r).toEqual([]);
  });

  it('handles zero monthly savings correctly', () => {
    const r = config.calculate({
      homePrice: '300000',
      targetDownPct: '20',
      currentSavings: '30000',
      monthlySavings: '0',
      expectedReturn: '0',
    });
    // Need $60,000 but have $30,000. With $0 monthly savings, never reach goal
    expect(getValue(r, 'monthsToGoal')).toBe('Increase savings rate');
    near(parseMoney(getValue(r, 'savingsGap')), 30000);
  });

  it('handles zero expected return correctly', () => {
    const r = config.calculate({
      homePrice: '250000',
      targetDownPct: '10',
      currentSavings: '10000',
      monthlySavings: '500',
      expectedReturn: '0',
    });
    // 10% of 250K = 25K. Gap = 15K. At 500/mo = 30 months
    const monthsStr = getValue(r, 'monthsToGoal');
    const monthsVal = parseNumber(monthsStr);
    // With 0% return, it takes exactly 15000/500 = 30 months
    near(monthsVal, 30);
  });

  it('has all expected result IDs', () => {
    const r = config.calculate({
      homePrice: '350000',
      targetDownPct: '20',
      currentSavings: '20000',
      monthlySavings: '1000',
      expectedReturn: '4',
    });
    const ids = r.map(x => x.id).sort();
    expect(ids).toContain('targetDownPayment');
    expect(ids).toContain('savingsGap');
    expect(ids).toContain('currentDownPct');
    expect(ids).toContain('targetDownPct');
    expect(ids).toContain('monthsToGoal');
    expect(ids).toContain('pmiWarning');
    expect(ids).toContain('totalPmiCost');
    expect(ids).toContain('monthlyPayment');
    expect(ids).toContain('loanAmount');
  });

  it('produces a valid monthly payment estimate', () => {
    const r = config.calculate({
      homePrice: '350000',
      targetDownPct: '20',
      currentSavings: '70000',
      monthlySavings: '0',
      expectedReturn: '0',
    });
    // Loan amount = $280K at 6.8% for 30yr
    const monthlyPmt = parseMoney(getValue(r, 'monthlyPayment'));
    // Expected: ~$1,825
    expect(monthlyPmt).toBeGreaterThan(1700);
    expect(monthlyPmt).toBeLessThan(2000);
  });

  it('handles 25% down payment with no PMI', () => {
    const r = config.calculate({
      homePrice: '500000',
      targetDownPct: '25',
      currentSavings: '125000',
      monthlySavings: '2000',
      expectedReturn: '4',
    });
    // 25% of $500K = $125K - exactly saved
    expect(getValue(r, 'savingsGap')).toBe('Already saved!');
    // No PMI
    expect(getValue(r, 'pmiWarning')).toContain('No');
    expect(getValue(r, 'totalPmiCost')).toBe('$0');
    // Loan = $375K
    near(parseMoney(getValue(r, 'loanAmount')), 375000);
  });

  it('handles large home price without overflow', () => {
    const r = config.calculate({
      homePrice: '2000000',
      targetDownPct: '20',
      currentSavings: '100000',
      monthlySavings: '5000',
      expectedReturn: '4',
    });
    // 20% of $2M = $400K
    near(parseMoney(getValue(r, 'targetDownPayment')), 400000);
    // Should not error
    expect(r.length).toBeGreaterThan(0);
  });

  it('educational content has 7+ FAQs', () => {
    expect(config.educational.faqs.length).toBeGreaterThanOrEqual(7);
  });

  it('educational content has worked examples', () => {
    expect(config.educational.workedExamples).toBeDefined();
    expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(3);
  });

  it('educational content has pro tips', () => {
    expect(config.educational.proTips).toBeDefined();
    expect(config.educational.proTips!.length).toBeGreaterThanOrEqual(3);
  });

  it('educational content has limitations section', () => {
    expect(config.educational.limitations).toBeDefined();
    expect(config.educational.limitations!.length).toBeGreaterThan(0);
  });
});
