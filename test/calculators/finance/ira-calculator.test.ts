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
});
