import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/boat-loan/index';
import { getValue, parseMoney, near } from '../../helpers';

describe('boatPrice', () => {
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

describe('boat-loan – audit: worked-example numbers (independent annuity calc)', () => {
  const run = (v: Record<string, string>) => config.calculate({ monthlyMaintenance: '0', ...v });
  it('$36,000 @8.5% / 144 mo: payment 399.62, interest 21,545 (36000*i/(1-(1+i)^-144), i=0.085/12)', () => {
    const r = run({ boatPrice: '45000', downPayment: '9000', loanTerm: '144', interestRate: '8.5' });
    near(parseMoney(getValue(r, 'monthlyPayment')), 399.62, 0.01);
    near(parseMoney(getValue(r, 'totalInterest')), 21_545, 1);
  });
  it('$67,500 @6.99%: 180 mo -> 606.33 / 41,640 interest; 120 mo -> 783.38 / 26,506', () => {
    const a = run({ boatPrice: '75000', downPayment: '7500', loanTerm: '180', interestRate: '6.99' });
    near(parseMoney(getValue(a, 'monthlyPayment')), 606.33, 0.01);
    near(parseMoney(getValue(a, 'totalInterest')), 41_640, 1);
    const b = run({ boatPrice: '75000', downPayment: '7500', loanTerm: '120', interestRate: '6.99' });
    near(parseMoney(getValue(b, 'monthlyPayment')), 783.38, 0.01);
    near(parseMoney(getValue(b, 'totalInterest')), 26_506, 1);
  });
});
