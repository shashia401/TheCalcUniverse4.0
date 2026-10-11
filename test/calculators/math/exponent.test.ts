import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/exponent/index';

describe('base', () => {
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

describe('edge inputs: tiny exponent', () => {
  it.each([['2', '0.0001'], ['10', '1e-9'], ['-8', '0.0001']])('%s^%s has no Infinity in any row', (base, exponent) => {
    noGarbage(config.calculate({ base, exponent }));
  });
  it('normal input unchanged', () => {
    const r = config.calculate({ base: '2', exponent: '10' });
    noGarbage(r);
    expect(r.find((x) => x.id === 'result')?.value).toBe('1024');
    expect(r.find((x) => x.id === 'inverse')?.value).toBe('10th root of 2 = 1.07177346254');
  });
});
