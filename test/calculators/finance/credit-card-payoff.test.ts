import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/credit-card-payoff';
import { getValue, getResult, parseMoney, parseNumber, near } from '../../helpers';

describe('credit-card-payoff', () => {
  it('fixed payment mode: shows debt-free date and interest', () => {
    const r = config.calculate({
      balance: '5000',
      apr: '21.99',
      payoffMode: 'fixed',
      monthlyPayment: '200',
    });
    expect(getResult(r, 'hero').label).toContain('Debt-Free');
    expect(getValue(r, 'payoffDate')).toBeTruthy();
    expect(parseMoney(getValue(r, 'totalInterest'))).toBeGreaterThan(0);
    expect(getValue(r, 'payoffTime')).toMatch(/\d+yr \d+mo/);
  });

  it('by-date mode: calculates required payment for target timeline', () => {
    const r = config.calculate({
      balance: '5000',
      apr: '21.99',
      payoffMode: 'bydate',
      targetMonths: '24',
    });
    expect(getResult(r, 'hero').label).toContain('Pay by');
    expect(getValue(r, 'requiredPayment')).toMatch(/\$/);
    expect(parseNumber(getValue(r, 'requiredPayment'))).toBeGreaterThan(0);
  });

  it('warning when payment only covers interest', () => {
    const r = config.calculate({
      balance: '5000',
      apr: '21.99',
      payoffMode: 'fixed',
      monthlyPayment: '50',
    });
    expect(getResult(r, 'warning').label).toContain('Warning');
  });

  it('zero APR: required payment = balance / months', () => {
    const r = config.calculate({
      balance: '2400',
      apr: '0',
      payoffMode: 'bydate',
      targetMonths: '24',
    });
    near(parseNumber(getValue(r, 'requiredPayment')), 100);
  });

  it('zero APR: fixed payment pays off with no interest', () => {
    const r = config.calculate({
      balance: '1200',
      apr: '0',
      payoffMode: 'fixed',
      monthlyPayment: '200',
    });
    near(parseMoney(getValue(r, 'totalInterest')), 0);
  });

  it('returns empty when balance is missing or zero', () => {
    expect(config.calculate({})).toHaveLength(0);
    expect(config.calculate({ balance: '0', apr: '10', payoffMode: 'fixed', monthlyPayment: '100' })).toHaveLength(0);
  });

  it('interest ratio is expressed as a percentage', () => {
    const r = config.calculate({
      balance: '5000',
      apr: '21.99',
      payoffMode: 'fixed',
      monthlyPayment: '200',
    });
    expect(getValue(r, 'interestRatio')).toMatch(/%$/);
  });
});

describe('credit-card-payoff – audit regressions', () => {
  const g = (r: any[], id: string) => r.find((x) => x.id === id)!.value as string;
  it('Total paid = balance + interest (final payment is partial): $5,000 @21.99%, $200/mo -> 34 mo, interest $1,748.69, paid $6,748.69 (was 34 x $200 = $6,800)', () => {
    const r = config.calculate({ balance: '5000', apr: '21.99', payoffMode: 'fixed', monthlyPayment: '200' });
    expect(g(r, 'totalInterest')).toBe('$1,748.69');
    expect(g(r, 'totalPaid')).toBe('$6,748.69');
    expect(g(r, 'payoffTime')).toBe('2yr 10mo');
  });
  it('by-date: $8,200 @24.99% over 36 months -> $325.99/mo, interest $3,535.54, total $11,735.54', () => {
    const r = config.calculate({ balance: '8200', apr: '24.99', payoffMode: 'bydate', targetMonths: '36' });
    expect(g(r, 'requiredPayment')).toBe('$325.99/mo');
    expect(g(r, 'totalInterest')).toBe('$3,535.54');
    expect(g(r, 'totalPaid')).toBe('$11,735.54');
  });
  it('a flat $100/mo on $5,000 @22% takes 137 months (11.4 yrs) and ~$8,678 interest', () => {
    const r = config.calculate({ balance: '5000', apr: '22', payoffMode: 'fixed', monthlyPayment: '100' });
    expect(g(r, 'payoffTime')).toBe('11yr 5mo');
    expect(g(r, 'totalInterest')).toBe('$8,678.06');
  });
});
