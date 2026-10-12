import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/mortgage-payoff/index';

describe('originalAmount', () => {
  it('should export a valid calculator config', () => {
    expect(config).toBeDefined();
    expect(config.inputs).toBeDefined();
    expect(Array.isArray(config.inputs)).toBe(true);
    expect(typeof config.calculate).toBe('function');
  });

  it('should return empty array for empty/invalid inputs', () => {
    const emptyValues: Record<string, string> = {};
    config.inputs.forEach((inp: any) => {
      emptyValues[inp.id] = '';
    });
    const result = config.calculate(emptyValues);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return results for valid demo inputs', () => {
    const demoValues: Record<string, string> = {};
    config.inputs.forEach((inp: any) => {
      if (inp.defaultValue !== undefined) {
        demoValues[inp.id] = String(inp.defaultValue);
      } else if (inp.placeholder) {
        demoValues[inp.id] = inp.placeholder;
      } else if (inp.type === 'select' && inp.options?.length > 0) {
        demoValues[inp.id] = inp.options[0].value;
      } else if (inp.type === 'number') {
        demoValues[inp.id] = '10';
      } else {
        demoValues[inp.id] = 'test';
      }
    });
    const result = config.calculate(demoValues);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});

import { vi, afterEach } from 'vitest';
import { simulatePayoff, payoffDateLabel } from '../../../src/calculators/finance/mortgage-payoff/payoffSim';
import { getValue } from '../../helpers';

describe('mortgage payoff audit', () => {
  afterEach(() => vi.useRealTimers());

  // Independent month-by-month schedule (node): $350k @ 6.75% 30y -> P&I 2270.0933, interest 467,233.60, 360 payments.
  // With +$300/mo: 259 payments, interest 315,534.73 -> saves 101 months and $151,698.87.
  it('schedule ends at zero; extra $300/mo on the educational example saves 101 months / $151,699', () => {
    const pay = 2270.0933379887547;
    const std = simulatePayoff(350000, 0.0675 / 12, pay);
    expect(std.months).toBe(360);
    expect(std.totalInterest).toBeCloseTo(467233.6017, 2);
    expect(std.yearEndBalances).toHaveLength(30);
    expect(std.yearEndBalances[29]).toBe(0);
    const acc = simulatePayoff(350000, 0.0675 / 12, pay, 300);
    expect(acc.months).toBe(259);
    expect(acc.totalInterest).toBeCloseTo(315534.7267, 2);
    expect(std.totalInterest - acc.totalInterest).toBeCloseTo(151698.87, 1);
  });

  // $280k @ 6.75%, P&I 2270: 212 payments / interest 198,999.98; with a $10,000 lump now: 198 payments / 177,505.04.
  it('single lump sum today shortens the term (FAQ example)', () => {
    const r = config.calculate({ originalAmount: '350000', currentBalance: '280000', interestRate: '6.75', monthlyPayment: '2270', singleLumpSum: '10000' });
    expect(getValue(r, 'standardInterest')).toBe('$198,999.98');
    expect(getValue(r, 'newTotalInterest')).toBe('$177,505.04');
    expect(getValue(r, 'timeSaved')).toBe('1 yr 2 mo');
  });

  it('yearly lump sum is paid after each 12th payment', () => {
    // 0% rate, balance 1000, pay 10/mo, 500 extra with payments 13, 25, ...
    // after 12 payments 880 left; payment 13 = 510 -> 370; payments 14-24 = 110 -> 260; payment 25 = min(260, 510) -> 0
    const s = simulatePayoff(1000, 0, 10, 0, 500);
    expect(s.months).toBe(25);
  });

  it('payoff month does not overflow on the 31st (Jan 31 + 1 month = February, not March)', () => {
    expect(payoffDateLabel(1, new Date(2026, 0, 31))).toBe('February 2026');
    expect(payoffDateLabel(13, new Date(2026, 9, 31))).toBe('November 2027');
  });

  it('payment that never retires the loan within 100 years is flagged', () => {
    const r = config.calculate({ originalAmount: '300000', currentBalance: '300000', interestRate: '6', monthlyPayment: '1501' });
    expect(getValue(r, 'negativeAmortization')).toContain('too low');
  });

  it('original amount is optional and only drives the repaid-share row', () => {
    const r = config.calculate({ currentBalance: '280000', interestRate: '6.75', monthlyPayment: '2270' });
    expect(r.find((x) => x.id === 'paidSoFar')).toBeUndefined();
    const r2 = config.calculate({ originalAmount: '350000', currentBalance: '280000', interestRate: '6.75', monthlyPayment: '2270' });
    expect(getValue(r2, 'paidSoFar')).toContain('20.0%');
  });
});
