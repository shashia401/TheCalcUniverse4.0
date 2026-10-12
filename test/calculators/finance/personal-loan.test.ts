import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/personal-loan/index';

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

import { getValue as gvPl } from '../../helpers';
describe('personal-loan audit', () => {
  const base = { loanAmount: '20000', loanTerm: '36', interestRate: '11.5', originationFeeType: 'percent', originationFeeValue: '3', feeHandling: 'deducted' };
  // Independent (node): PMT = 659.5201; cash 19,400; repaid 23,742.72; borrowing cost 4,342.72;
  // effective APR solving PV(payments) = 19,400 -> 13.625%
  it('3% fee deducted: cost of borrowing = repaid - cash received (fee not double counted); effective APR 13.63%', () => {
    const r = config.calculate(base);
    expect(gvPl(r, 'actualCashReceived')).toBe('$19,400.00');
    expect(gvPl(r, 'totalCostIncFee')).toBe('$23,742.72');
    expect(gvPl(r, 'costOfBorrowing')).toBe('$4,342.72');
    expect(gvPl(r, 'effectiveApr')).toBe('13.63%');
  });
  it('60-month effective APR is 12.84%', () => {
    expect(gvPl(config.calculate({ ...base, loanTerm: '60' }), 'effectiveApr')).toBe('12.84%');
  });
  it('fee rolled into the balance: cash 20,000, balance 20,600, cost = interest + fee', () => {
    const r = config.calculate({ ...base, feeHandling: 'added' });
    expect(gvPl(r, 'actualCashReceived')).toBe('$20,000.00');
    // payment on 20,600 = 659.5201 x 1.03 = 679.3057 -> repaid 24,455.01 -> borrowing cost 4,455.01
    expect(gvPl(r, 'costOfBorrowing')).toBe('$4,455.01');
  });
  it('no fee: effective APR equals the stated APR', () => {
    expect(gvPl(config.calculate({ ...base, originationFeeType: 'none' }), 'effectiveApr')).toBe('11.50%');
  });
  it('a flat fee larger than the loan returns nothing', () => {
    expect(config.calculate({ ...base, originationFeeType: 'flat', originationFeeValue: '25000' })).toEqual([]);
  });
});
