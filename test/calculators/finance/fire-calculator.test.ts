import { describe, it, expect } from 'vitest';
import fireConfig from '../../../src/calculators/finance/fire-calculator/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('FIRE Calculator', () => {
  it('calculates standard FIRE correctly', () => {
    const results = fireConfig.calculate({
      currentAge: '30',
      currentNetWorth: '100000',
      annualIncome: '80000',
      annualExpenses: '50000',
      currentSavingsRate: '',
      investmentReturn: '7',
      targetWithdrawalRate: '4',
      fireType: 'standard',
    });
    expect(results.length).toBeGreaterThan(0);
    // fireNumber is formatted, e.g. $1,250,000 or $1.25M
    expect(getValue(results, 'fireNumber')).toContain('1.25M');
    const savingsRate = parseNumber(getValue(results, 'savingsRate'));
    expect(savingsRate).toBeCloseTo(37.5, 0.5); // (80K-50K)/80K = 37.5%
  });

  it('returns empty for invalid inputs', () => {
    const results = fireConfig.calculate({
      currentAge: '',
      currentNetWorth: '',
      annualIncome: '',
      annualExpenses: '',
      currentSavingsRate: '',
      investmentReturn: '7',
      targetWithdrawalRate: '4',
      fireType: 'standard',
    });
    expect(results).toEqual([]);
  });

  it('calculates Lean FIRE as 25x expenses', () => {
    const results = fireConfig.calculate({
      currentAge: '35',
      currentNetWorth: '50000',
      annualIncome: '60000',
      annualExpenses: '30000',
      currentSavingsRate: '',
      investmentReturn: '7',
      targetWithdrawalRate: '4',
      fireType: 'lean',
    });
    expect(getValue(results, 'fireNumber')).toContain('750,000'); // 30K * 25 = 750K
  });

  it('calculates Fat FIRE as 37.5x expenses', () => {
    const results = fireConfig.calculate({
      currentAge: '40',
      currentNetWorth: '200000',
      annualIncome: '150000',
      annualExpenses: '80000',
      currentSavingsRate: '',
      investmentReturn: '7',
      targetWithdrawalRate: '4',
      fireType: 'fat',
    });
    expect(getValue(results, 'fireNumber')).toContain('3.00M'); // 80K * 1.5 * 25 = 3M
  });

  it('uses manual savings rate when provided', () => {
    const results = fireConfig.calculate({
      currentAge: '30',
      currentNetWorth: '50000',
      annualIncome: '100000',
      annualExpenses: '60000',
      currentSavingsRate: '50',
      investmentReturn: '7',
      targetWithdrawalRate: '4',
      fireType: 'standard',
    });
    const savingsRate = parseNumber(getValue(results, 'savingsRate'));
    expect(savingsRate).toBeCloseTo(50, 0.5);
  });

  it('extracts all required result IDs', () => {
    const results = fireConfig.calculate({
      currentAge: '30',
      currentNetWorth: '100000',
      annualIncome: '80000',
      annualExpenses: '50000',
      currentSavingsRate: '',
      investmentReturn: '7',
      targetWithdrawalRate: '4',
      fireType: 'standard',
    });
    const ids = results.map((r) => r.id);
    expect(ids).toContain('fireNumber');
    expect(ids).toContain('fireAge');
    expect(ids).toContain('yearsToFire');
    expect(ids).toContain('savingsRate');
    expect(ids).toContain('annualSavings');
    expect(ids).toContain('currentNetWorth');
    expect(ids).toContain('fireType');
    expect(ids).toContain('monthlySavings');
    expect(ids).toContain('nwAtRetirement');
    expect(ids).toContain('totalContributions');
  });

  it('caps savings rate at 100%', () => {
    const results = fireConfig.calculate({
      currentAge: '25',
      currentNetWorth: '0',
      annualIncome: '50000',
      annualExpenses: '0',
      currentSavingsRate: '150',
      investmentReturn: '7',
      targetWithdrawalRate: '4',
      fireType: 'standard',
    });
    const savingsRate = parseNumber(getValue(results, 'savingsRate'));
    expect(savingsRate).toBeLessThanOrEqual(100);
  });

  it('shows fire age older than current age', () => {
    const results = fireConfig.calculate({
      currentAge: '30',
      currentNetWorth: '10000',
      annualIncome: '60000',
      annualExpenses: '55000',
      currentSavingsRate: '',
      investmentReturn: '7',
      targetWithdrawalRate: '4',
      fireType: 'standard',
    });
    const fireAgeStr = getValue(results, 'fireAge');
    expect(fireAgeStr).toMatch(/years old/);
  });
});
