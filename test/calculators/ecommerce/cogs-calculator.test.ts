import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/ecommerce/cogs/index';
import { buildDemoValues } from '../../helpers';

describe('cogs-calculator', () => {
  it('should export a valid calculator config', () => {
    expect(config).toBeDefined();
    expect(config.inputs).toBeDefined();
    expect(Array.isArray(config.inputs)).toBe(true);
    expect(typeof config.calculate).toBe('function');
  });

  it('should return empty array for empty/invalid inputs', () => {
    const emptyValues: Record<string, string> = {};
    config.inputs.forEach((inp: any) => { emptyValues[inp.id] = ''; });
    const result = config.calculate(emptyValues);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle valid demo values', () => {
    const demoValues = buildDemoValues(config.inputs);
    const result = config.calculate(demoValues);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});
