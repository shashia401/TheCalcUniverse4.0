import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/present-value/index';

describe('futureValue', () => {
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

import { getValue as gvPv } from '../../helpers';
describe('present-value audit (worked examples, independent closed forms)', () => {
  const run = (fv: string, n: string, r: string, m: string) =>
    config.calculate({ futureValue: fv, periods: n, discountRate: r, compoundingFrequency: m });
  it('example 1: $100k in 15y at 7% annual -> $36,244.60; at 9% -> $27,453.80', () => {
    expect(gvPv(run('100000', '15', '7', '1'), 'presentValueResult')).toBe('$36,244.60');
    expect(gvPv(run('100000', '15', '9', '1'), 'presentValueResult')).toBe('$27,453.80');
  });
  it('example 2: $50k in 8y at 5% quarterly -> $33,599.20', () => {
    expect(gvPv(run('50000', '8', '5', '4'), 'presentValueResult')).toBe('$33,599.20');
  });
  it('example 3: $500k in 20y at 6% -> $155,902.36; at 4% -> $228,193.47', () => {
    expect(gvPv(run('500000', '20', '6', '1'), 'presentValueResult')).toBe('$155,902.36');
    expect(gvPv(run('500000', '20', '4', '1'), 'presentValueResult')).toBe('$228,193.47');
  });
  it('quick reference: $100k 10y 7% = $50,835; $100k 20y = $25,842; $1M 30y = $131,367', () => {
    expect(gvPv(run('100000', '10', '7', '1'), 'presentValueResult')).toBe('$50,834.93');
    expect(gvPv(run('100000', '20', '7', '1'), 'presentValueResult')).toBe('$25,841.90');
    expect(gvPv(run('1000000', '30', '7', '1'), 'presentValueResult')).toBe('$131,367.12');
  });
  it('7% monthly has an effective annual rate of 7.2290%', () => {
    expect(gvPv(run('100000', '10', '7', '12'), 'effectiveAnnualRateResult')).toBe('7.2290%');
  });
  it('0% discount: PV equals FV', () => {
    expect(gvPv(run('1000', '5', '0', '1'), 'presentValueResult')).toBe('$1,000.00');
  });
});
