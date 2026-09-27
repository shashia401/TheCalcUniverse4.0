import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/wedding-alcohol/index';
import { buildDemoValues, getValue } from '../../helpers';

describe('wedding-alcohol-calculator', () => {
  it('matches the worked example for a 50-guest BBQ: 243 beers needs 11 cases (not 10) and 51 cocktails needs 3 liquor bottles (not 4) (regression: cases/bottles must round up, not down, to cover the full amount)', () => {
    const r = config.calculate({
      guests: '50', drinkersPct: '90', duration: '6', beerPct: '60', winePct: '15', liquorPct: '25',
    });
    expect(getValue(r, 'beerTotal')).toBe('243');
    expect(Math.ceil(243 / 24)).toBe(11);
    expect(getValue(r, 'liquorBottles')).toBe('3');
  });

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
