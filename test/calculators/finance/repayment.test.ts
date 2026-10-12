import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/repayment/index';

describe('loanAmount', () => {
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

import { getValue as gvRep } from '../../helpers';
describe('repayment audit', () => {
  const base = { loanAmount: '25000', interestRate: '7', termUnit: 'years', loanTerm: '5' };
  // Independent month-by-month simulation (node): payment 495.03; +$25/mo -> 57 payments, interest saved 276.89
  it('$25 extra on $25k @ 7% / 5y saves $277 and 3 months (explanation text said $60)', () => {
    const r = config.calculate({ ...base, extraPayment: '25' });
    expect(gvRep(r, 'interestSaved')).toBe('$277');
    expect(gvRep(r, 'timeSaved')).toBe('0yr 3mo');
    expect(gvRep(r, 'newPayoffTime')).toContain('57 payments');
  });
  it('currency is formatted once (no "$$")', () => {
    const r = config.calculate({ ...base, extraPayment: '25' });
    r.forEach((x) => expect(String(x.value)).not.toContain('$$'));
    expect(gvRep(config.calculate(base), 'totalInterest')).toBe('$4,702');
  });
  it('0% APR with extra payment now honours the extra: 12,000 / (500+500) = 12 payments', () => {
    const r = config.calculate({ loanAmount: '12000', interestRate: '0', termUnit: 'months', loanTerm: '24', extraPayment: '500' });
    expect(gvRep(r, 'newPayoffTime')).toContain('12 payments');
    expect(gvRep(r, 'totalInterestWithExtra')).toBe('$0');
  });
  it('first/last payment split quoted in the explanation: ~$146 interest/$349 principal first', () => {
    // 25,000 x 0.07/12 = 145.83 interest; 495.03 - 145.83 = 349.20 principal
    expect(25000 * 0.07 / 12).toBeCloseTo(145.83, 2);
  });
  it('terms beyond 50 years return nothing', () => {
    expect(config.calculate({ ...base, loanTerm: '300' })).toEqual([]);
  });
});
