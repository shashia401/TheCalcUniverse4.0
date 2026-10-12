import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/mortgage-comparison/index';
import { getValue } from '../../helpers';

describe('homePrice', () => {
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

describe('mortgage comparison audit', () => {
  const ex1 = { homePrice: '400000', downPayment: '80000', rate15: '5.5', rate30: '6.5', propertyTaxRate: '0.8', annualInsurance: '1200', pmiRate: '0.5' };
  // Independent (node): 15y P&I 2614.667 -> monthly 2981.33; 30y P&I 2022.618 -> 2389.28;
  // interest 150,640.07 and 408,142.36 -> savings 257,502.29 (taxes/insurance excluded: owed under either loan)
  it('Example 1: payments and savings exclude property tax/insurance', () => {
    const r = config.calculate(ex1);
    expect(getValue(r, 'monthly15')).toBe('$2,981.33');
    expect(getValue(r, 'monthly30')).toBe('$2,389.28');
    expect(getValue(r, 'interest15')).toBe('$150,640');
    expect(getValue(r, 'interest30')).toBe('$408,142');
    expect(getValue(r, 'savings')).toBe('$257,502');
  });
  // 5% down: PMI 0.5% of 237,500 = $98.96/mo; drops when balance <= 80% of 250,000 = 200,000.
  // Month-by-month simulation (node): 41 months on the 15y, 127 on the 30y.
  // finance cost 15y = 117,500.31 + 98.958*41 = 121,557.60; 30y = 317,051.37 + 98.958*127 = 329,619.08 -> savings 208,061.48
  it('Example 2: PMI stops at 80% of price; savings include PMI actually paid', () => {
    const r = config.calculate({ homePrice: '250000', downPayment: '12500', rate15: '5.75', rate30: '6.75', propertyTaxRate: '1.4', annualInsurance: '900', pmiRate: '0.5' });
    expect(getValue(r, 'monthly15')).toBe('$2,437.85');
    expect(getValue(r, 'pmiDuration')).toBe('3.4 yrs / 10.6 yrs');
    expect(getValue(r, 'savings')).toBe('$208,061');
  });
  it('blank rate returns nothing instead of a 0% mortgage', () => {
    expect(config.calculate({ ...ex1, rate15: '' })).toEqual([]);
  });
});
