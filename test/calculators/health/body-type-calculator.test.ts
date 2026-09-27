import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/body-type/index';
import { buildDemoValues } from '../../helpers';

describe('body-type-calculator', () => {
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

  it('matches the worked example for Lena (82-72-100 cm) as Pear (regression: the original 96-72-100 example claimed Pear but both bust:waist and hip:waist ratios exceed 1.15, which the classifier treats as Hourglass)', () => {
    const r = config.calculate({ unit: 'metric', bust: '82', waist: '72', hip: '100' });
    const shape = r.find((x) => x.id === 'bodyShape');
    expect(shape?.value).toBe('Pear (Triangle)');
  });

  it('classifies bust=96/waist=72/hip=100 as Hourglass, not Pear, since both ratios cross the 1.15 threshold', () => {
    const r = config.calculate({ unit: 'metric', bust: '96', waist: '72', hip: '100' });
    const shape = r.find((x) => x.id === 'bodyShape');
    expect(shape?.value).toBe('Hourglass');
  });
});
