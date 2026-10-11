import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/amortization/index';

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

describe('amortization – audit: educational example numbers (independent month-by-month schedule)', () => {
  it('$250K @6.5% 30y + $200/mo extra: 265 months (22y 1m), ~$97,618 interest saved, 95 payments saved', () => {
    const r = config.calculate({ loanAmount: '250000', interestRate: '6.5', termUnit: 'years', loanTerm: '30', extraMonthly: '200', extraAnnual: '0' });
    expect(r.find((x: any) => x.id === 'newTerm')!.value).toBe('22 yrs 1 mo');
    expect(r.find((x: any) => x.id === 'timeSaved')!.value).toBe('7 years and 11 months');
    expect(parseFloat(r.find((x: any) => x.id === 'interestSaved')!.value.replace(/[$,]/g, ''))).toBeCloseTo(97618.12, 1);
  });
});
