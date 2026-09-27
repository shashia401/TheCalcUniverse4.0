import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/ira-calculator/index';
import { getValue, parseMoney } from '../../helpers';

describe('ira calculator (traditional vs roth)', () => {
  it('shows both roth and traditional balances', () => {
    const r = config.calculate({
      currentAge: '30',
      retirementAge: '65',
      currentBalance: '10000',
      annualContribution: '7000',
      expectedReturn: '7',
      marginalTaxRate: '22',
      retirementTaxRate: '12',
    });
    const roth = parseMoney(getValue(r, 'rothBalance'));
    const trad = parseMoney(getValue(r, 'tradAfterTax'));
    expect(roth).toBeGreaterThan(500000);
    expect(trad).toBeGreaterThan(0);
  });

  it('returns empty when retirement age <= current age', () => {
    const r = config.calculate({
      currentAge: '65',
      retirementAge: '60',
      currentBalance: '10000',
      annualContribution: '7000',
      expectedReturn: '7',
      marginalTaxRate: '22',
      retirementTaxRate: '12',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for missing age', () => {
    const r = config.calculate({
      currentAge: '',
      retirementAge: '65',
      currentBalance: '10000',
      annualContribution: '7000',
      expectedReturn: '7',
      marginalTaxRate: '22',
      retirementTaxRate: '12',
    });
    expect(r).toEqual([]);
  });

  it('shows breakeven rate', () => {
    const r = config.calculate({
      currentAge: '30',
      retirementAge: '65',
      currentBalance: '10000',
      annualContribution: '7000',
      expectedReturn: '7',
      marginalTaxRate: '22',
      retirementTaxRate: '12',
    });
    const breakeven = getValue(r, 'breakevenRate');
    expect(breakeven).toContain('%');
  });

  it('warns on over-limit contributions', () => {
    const r = config.calculate({
      currentAge: '30',
      retirementAge: '65',
      currentBalance: '0',
      annualContribution: '15000',
      expectedReturn: '7',
      marginalTaxRate: '22',
      retirementTaxRate: '12',
    });
    const hasWarning = r.some((x) => x.id === 'limitWarning');
    expect(hasWarning).toBe(true);
  });

  it('matches the "Diana" worked example (regression: educational text previously called this "virtually tied" with Roth ahead, when Traditional actually wins once the reinvested tax deduction is credited)', () => {
    const r = config.calculate({
      currentAge: '48',
      retirementAge: '67',
      currentBalance: '120000',
      annualContribution: '7500',
      expectedReturn: '6',
      marginalTaxRate: '32',
      retirementTaxRate: '12',
    });
    expect(getValue(r, 'winner')).toContain('Traditional wins');
    const rothBalance = parseMoney(getValue(r, 'rothBalance'));
    const tradTaxSavingsInvested = parseMoney(getValue(r, 'tradTaxSavingsInvested'));
    const tradAfterTax = parseMoney(getValue(r, 'tradAfterTax'));
    expect(tradAfterTax + tradTaxSavingsInvested).toBeGreaterThan(rothBalance);
  });
});
