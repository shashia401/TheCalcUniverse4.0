import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/401k';
import { getValue, parseMoney, parseNumber, near } from '../../helpers';

describe('401k', () => {
  const base = {
    currentAge: '30',
    retirementAge: '65',
    currentBalance: '25000',
    annualSalary: '80000',
    salaryIncrease: '3',
    yourContribution: '6',
    employerMatch: '50',
    employerMatchLimit: '6',
    rateOfReturn: '7',
  };

  it('basic calculation returns 6 results', () => {
    const r = config.calculate(base);
    expect(r).toHaveLength(6);
    expect(getValue(r, 'totalBalance')).toMatch(/^\$/);
    expect(parseMoney(getValue(r, 'totalBalance'))).toBeGreaterThan(0);
  });

  it('returns employer contribs as "$0 (no match configured)" when employerMatch is 0', () => {
    const r = config.calculate({ ...base, employerMatch: '0' });
    expect(getValue(r, 'employerContribs')).toContain('$0 (no match configured)');
  });

  it('returns empty when retirementAge <= currentAge', () => {
    const r = config.calculate({ ...base, retirementAge: '25' });
    expect(r).toHaveLength(0);
  });

  it('returns empty when required fields are missing', () => {
    const r = config.calculate({});
    expect(r).toHaveLength(0);
  });

  it('zero current balance still projects growth', () => {
    const r = config.calculate({ ...base, currentBalance: '0' });
    expect(r).toHaveLength(6);
    expect(parseMoney(getValue(r, 'totalBalance'))).toBeGreaterThan(0);
  });

  it('includes monthly retirement estimate using 4% rule', () => {
    const r = config.calculate(base);
    const monthly = getValue(r, 'monthlyRetirement');
    expect(monthly).toMatch(/\$/);
    expect(parseNumber(monthly)).toBeGreaterThan(0);
  });

  it('returnsPct is between 0 and 100', () => {
    const r = config.calculate(base);
    const pct = parseNumber(getValue(r, 'returnsPct'));
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThan(100);
  });
});
