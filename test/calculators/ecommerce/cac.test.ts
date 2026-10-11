import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/ecommerce/cac/index';

describe('totalMarketingSpend', () => {
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

describe('edge inputs: zero marketing spend', () => {
  const base = { totalMarketingSpend: '50000', newCustomers: '500', ltv: '400' };
  it('zero spend shows N/A, not Infinity', () => {
    const r = config.calculate({ ...base, totalMarketingSpend: '0' });
    noGarbage(r);
    expect(r.find((x) => x.id === 'ltvCac')?.value).toBe('N/A (no spend)');
  });
  it('normal input unchanged', () => {
    const r = config.calculate(base);
    expect(r.find((x) => x.id === 'ltvCac')?.value).toBe('4.00x');
  });
});
