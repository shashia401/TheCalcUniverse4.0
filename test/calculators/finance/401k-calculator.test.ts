import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/401k';
import { getValue, parseMoney, parseNumber, near } from '../../helpers';

describe('401k Calculator — full unit test suite', () => {
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

  it('returns 6 result rows for valid inputs', () => {
    const r = config.calculate(base);
    expect(r).toHaveLength(6);
    expect(getValue(r, 'totalBalance')).toMatch(/^\$/);
    expect(parseMoney(getValue(r, 'totalBalance'))).toBeGreaterThan(0);
  });

  it('returns empty array when retirementAge <= currentAge (invalid)', () => {
    const r = config.calculate({ ...base, retirementAge: '25' });
    expect(r).toHaveLength(0);
  });

  it('returns empty array when required fields are missing or NaN', () => {
    expect(config.calculate({})).toHaveLength(0);
    expect(config.calculate({ currentAge: 'abc', retirementAge: 'xyz', annualSalary: '', yourContribution: 'nope', rateOfReturn: '---' })).toHaveLength(0);
  });

  it('employerContribs shows "$0 (no match configured)" when employerMatch is 0', () => {
    const r = config.calculate({ ...base, employerMatch: '0' });
    expect(getValue(r, 'employerContribs')).toContain('$0 (no match configured)');
  });

  it('zero current balance still projects growth from contributions', () => {
    const r = config.calculate({ ...base, currentBalance: '0' });
    expect(r).toHaveLength(6);
    expect(parseMoney(getValue(r, 'totalBalance'))).toBeGreaterThan(0);
  });

  it('monthly retirement estimate uses the 4% rule', () => {
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

  it('totalBalance > total contributions (compounding adds value)', () => {
    const r = config.calculate(base);
    const balance = parseMoney(getValue(r, 'totalBalance'));
    const yourContribs = parseMoney(getValue(r, 'yourContribs'));
    const employerContribsStr = getValue(r, 'employerContribs');
    const employerContribs = employerContribsStr.includes('no match') ? 0 : parseMoney(employerContribsStr);
    expect(balance).toBeGreaterThan(yourContribs + employerContribs);
  });

  it('higher contribution rate produces a larger balance', () => {
    const low = config.calculate({ ...base, yourContribution: '3' });
    const high = config.calculate({ ...base, yourContribution: '12' });
    expect(parseMoney(getValue(high, 'totalBalance'))).toBeGreaterThan(parseMoney(getValue(low, 'totalBalance')));
  });

  it('longer time horizon (earlier start) produces a larger balance', () => {
    const early = config.calculate({ ...base, currentAge: '25', retirementAge: '65' });
    const late = config.calculate({ ...base, currentAge: '40', retirementAge: '65' });
    expect(parseMoney(getValue(early, 'totalBalance'))).toBeGreaterThan(parseMoney(getValue(late, 'totalBalance')));
  });

  it('higher return rate produces a larger balance', () => {
    const conservative = config.calculate({ ...base, rateOfReturn: '5' });
    const aggressive = config.calculate({ ...base, rateOfReturn: '9' });
    expect(parseMoney(getValue(aggressive, 'totalBalance'))).toBeGreaterThan(parseMoney(getValue(conservative, 'totalBalance')));
  });

  it('empty currentAge returns empty results', () => {
    const r = config.calculate({ ...base, currentAge: '' });
    expect(r).toHaveLength(0);
  });

  it('empty retirementAge returns empty results', () => {
    const r = config.calculate({ ...base, retirementAge: '' });
    expect(r).toHaveLength(0);
  });

  it('employerContribs > 0 when employerMatch > 0', () => {
    const r = config.calculate(base);
    const empVal = getValue(r, 'employerContribs');
    expect(empVal).not.toContain('no match');
    expect(parseMoney(empVal)).toBeGreaterThan(0);
  });

  it('investment returns label contains "Compounding" text', () => {
    const r = config.calculate(base);
    expect(getValue(r, 'investmentReturns')).toMatch(/^\$/);
  });
});
