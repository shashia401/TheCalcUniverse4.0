import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/compound-interest/index';

describe('principal', () => {
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

describe('compound-interest – audit regressions', () => {
  const fvOf = (v: Record<string, string>) => parseFloat(config.calculate(v).find((r: any) => r.id === 'futureValue')!.value.replace(/[$,]/g, ''));
  it('monthly deposits follow the chosen compounding: $100/mo, 12% annual compounding, 1 yr -> monthly rate 1.12^(1/12)-1, FV = $1,264.65 (was $1,268.25 using r/12)', () => {
    expect(fvOf({ principal: '0', monthlyContribution: '100', rate: '12', years: '1', compoundFrequency: '1' })).toBeCloseTo(1264.65, 2);
  });
  it('quarterly: $10,000 + $200/mo, 8%, 5 yrs -> 10000*1.02^20 + 200*((1+i)^60-1)/i, i=1.02^(1/3)-1 = $29,534.66', () => {
    expect(fvOf({ principal: '10000', monthlyContribution: '200', rate: '8', years: '5', compoundFrequency: '4' })).toBeCloseTo(29534.66, 2);
  });
  it('monthly compounding is unchanged: $500/mo for 30y at 7% = $609,985 (not the $606,000 once quoted in the FAQ)', () => {
    expect(fvOf({ principal: '0', monthlyContribution: '500', rate: '7', years: '30', compoundFrequency: '12' })).toBeCloseTo(609985.5, 0);
  });
  it('0% rate with contributions never prints "Infinity" in the interpretation', () => {
    const r = config.calculate({ principal: '1000', monthlyContribution: '100', rate: '0', years: '5', compoundFrequency: '12' });
    expect(JSON.stringify(r)).not.toMatch(/Infinity|NaN/);
  });
});
