import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/automotive/gas-mileage/index';
import { buildDemoValues } from '../../helpers';

describe('fuel-cost-calculator', () => {
  it('should export valid config', () => {
    expect(config).toBeDefined();
    expect(config.inputs).toBeDefined();
    expect(typeof config.calculate).toBe('function');
  });
  it('returns array for empty inputs', () => {
    const v = {};
    config.inputs.forEach((i) => { v[i.id] = ''; });
    expect(Array.isArray(config.calculate(v))).toBe(true);
  });
  it('works with demo values', () => {
    const v = buildDemoValues(config.inputs);
    const r = config.calculate(v);
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBeGreaterThan(0);
  });
});
