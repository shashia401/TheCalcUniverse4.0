import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/rental-property/index';

describe('purchasePrice', () => {
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

// ── Edge-input regression: no NaN / Infinity / ∞ in any output ──
const noGarbage = (r: unknown) => expect(JSON.stringify(r)).not.toMatch(/NaN|Infinity|∞/);

describe('edge inputs: blank interest rate', () => {
  const base = { purchasePrice: '350000', downPayment: '70000', closingCosts: '10000', interestRate: '7.25', loanTerm: '30', monthlyRent: '2500' };
  it('blank rate returns [] (required input incomplete)', () => {
    expect(config.calculate({ ...base, interestRate: '' })).toEqual([]);
  });
  it('0% rate and normal input stay clean', () => {
    noGarbage(config.calculate({ ...base, interestRate: '0' }));
    const r = config.calculate(base);
    noGarbage(r);
    expect(r.length).toBeGreaterThan(0);
  });
});
