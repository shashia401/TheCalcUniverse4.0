import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/social-security/index';

describe('birthYear', () => {
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

describe('edge inputs: zero income', () => {
  const base = { birthYear: '1965', annualIncome: '85000', maritalStatus: 'single', retirementAge: '67' };
  it('zero income gives $0 benefits with no NaN', () => {
    for (const retirementAge of ['62', '67', '70']) {
      for (const maritalStatus of ['single', 'married']) {
        const r = config.calculate({ ...base, annualIncome: '0', retirementAge, maritalStatus });
        noGarbage(r);
        expect(r.find((x) => x.id === 'at62')?.value).toBe('$0/mo');
      }
    }
  });
  it('normal input keeps the percent-of-FRA text', () => {
    const r = config.calculate(base);
    noGarbage(r);
    expect(r.find((x) => x.id === 'at62')?.value).toMatch(/^\$[\d,]+\/mo \(\d+% of FRA benefit\)$/);
  });
});
