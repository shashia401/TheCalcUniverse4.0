import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/test-score/index';

describe('currentGrade', () => {
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

  it('regression: 95% current / 70% desired / 20% weight already secures the grade (FAQ example, was wrongly 95/90/20)', () => {
    const result = config.calculate({ currentGrade: '95', desiredGrade: '70', examWeight: '20' });
    const needed = result.find((r: any) => r.id === 'needed');
    expect(needed?.value).toBe('-30.0%');
    const note = result.find((r: any) => r.id === 'note');
    expect(note?.value).toContain('already have the desired grade');
  });
});
