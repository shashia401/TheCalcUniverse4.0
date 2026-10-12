import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/retirement/index';

describe('currentAge', () => {
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

import { getValue as gvRt } from '../../helpers';
describe('retirement audit (re-verification, independent closed forms)', () => {
  const anna = { currentAge: '30', retirementAge: '65', currentSavings: '50000', monthlyContribution: '500', annualReturn: '7', inflationRate: '3', desiredIncome: '60000' };
  // FV = 50,000 x 1.005833^420 + 500 x (1.005833^420 - 1)/0.005833 = 1,475,835 ; real = /1.03^35 = 524,487
  it("Anna: $1,475,835 nominal, $524,487 in today's dollars, contributed 260,000, growth 1,215,835, 5.7x", () => {
    const r = config.calculate(anna);
    expect(gvRt(r, 'futureValue')).toBe('$1.48M');
    expect(gvRt(r, 'inflationAdjusted')).toBe('$524,487');
    expect(gvRt(r, 'totalContributed')).toBe('$260,000');
    expect(gvRt(r, 'growthMultiple')).toBe('5.7×');
  });
  // goal: 60,000 x 1.03^35 = 168,832 -> /0.04 = 4,220,794 nest egg
  it('goal check: shortfall against the inflation-adjusted 4% target', () => {
    const r = config.calculate(anna);
    expect(gvRt(r, 'goalStatus')).toContain('Gap');
  });
  // Robert: 120,000 x 1.004167^264 + 800 x ... = 743,160 ; required monthly to reach 70,000 x 1.03^22 / 0.04 = 3,353,181 -> $6,245
  it('Robert: required monthly contribution is $6,245', () => {
    const r = config.calculate({ currentAge: '45', retirementAge: '67', currentSavings: '120000', monthlyContribution: '800', annualReturn: '5', inflationRate: '3', desiredIncome: '70000' });
    expect(gvRt(r, 'requiredContribution')).toBe('$6,245/month');
  });
  it('explicit 0% inflation is respected (real value equals nominal)', () => {
    const r = config.calculate({ ...anna, inflationRate: '0' });
    expect(gvRt(r, 'inflationAdjusted')).toBe(gvRt(r, 'futureValue'));
  });
});
