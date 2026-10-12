import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/rent-affordability/index';

describe('grossIncome', () => {
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

import { getValue as gvRa } from '../../helpers';
describe('rent-affordability audit', () => {
  // 75,000/12 = 6,250 monthly; 30% = 1,875; 25% = 1,562.50; 40x: 75,000/40 = 1,875; remaining = 6,250 - 1,875 - 350 = 4,025
  const base = { grossIncome: '75000', incomeFrequency: 'annual', monthlyDebts: '350', rentRule: '30' };
  it('diagram example: $75K, $350 debts: rent $1,875, remaining $4,025, 40x test passes', () => {
    const r = config.calculate(base);
    expect(gvRa(r, 'maxRent')).toBe('$1,875.00');
    expect(gvRa(r, 'remainingAfterRent')).toBe('$4,025.00/mo');
    expect(gvRa(r, 'landlordRule')).toContain('Yes');
  });
  it('25% rule = $1,562.50 and 40x rule = $1,875.00', () => {
    expect(gvRa(config.calculate({ ...base, rentRule: '25' }), 'maxRent')).toBe('$1,562.50');
    expect(gvRa(config.calculate({ ...base, rentRule: '40x' }), 'maxRent')).toBe('$1,875.00');
  });
  it('30% rule always satisfies the 40x test (float noise used to flip it for ~3% of incomes)', () => {
    for (let g = 20001; g < 200000; g += 997) {
      expect(gvRa(config.calculate({ ...base, grossIncome: String(g) }), 'landlordRule')).toContain('Yes');
    }
  });
  it('custom 35% fails the 40x test and reports the income needed', () => {
    // maxRent = 6,250 x 0.35 = 2,187.50; landlords need 2,187.50 x 40 / 12 = 7,291.67/mo
    const r = config.calculate({ ...base, rentRule: 'custom', customPct: '35' });
    expect(gvRa(r, 'landlordRule')).toContain('$7,291.67');
  });
  it('hourly $25 x 40 x 52 / 12 = 4,333.33/mo; monthly passthrough; unknown rule falls back to 30%', () => {
    expect(gvRa(config.calculate({ ...base, grossIncome: '25', incomeFrequency: 'hourly' }), 'monthlyIncome')).toBe('$4,333.33');
    expect(gvRa(config.calculate({ ...base, grossIncome: '5000', incomeFrequency: 'monthly', rentRule: 'bogus' }), 'maxRent')).toBe('$1,500.00');
  });
});
