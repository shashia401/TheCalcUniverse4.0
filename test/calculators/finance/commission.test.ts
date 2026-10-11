import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/commission/index';

describe('structure', () => {
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

describe('commission – audit regressions', () => {
  it('tiered with no Tier 2 rate: excess earns $0 and says so (not silently dropped); 5% x $50K = $2,500', () => {
    const r = config.calculate({ structure: 'tiered', saleAmount: '100000', tier1Limit: '50000', tier1Rate: '5' });
    expect(r.find((x: any) => x.id === 'net')!.value).toBe('$2,500.00');
    const line = r.find((x: any) => x.label.startsWith('Above Tier 1'));
    expect(line).toBeDefined();
    expect(line!.value).toContain('$0.00');
  });
  it('3 tiers: $200K = 50K*5% + 100K*8% + 50K*12% = 2,500 + 8,000 + 6,000 = $16,500; blended 8.25%', () => {
    const r = config.calculate({ structure: 'tiered', saleAmount: '200000', tier1Limit: '50000', tier1Rate: '5', tier2Limit: '150000', tier2Rate: '8', tier3Rate: '12' });
    expect(r.find((x: any) => x.id === 'net')!.value).toBe('$16,500.00');
    expect(r.find((x: any) => x.id === 'effective')!.value).toBe('8.25%');
  });
  it('real estate waterfall: $500K x 6% /2 = 15,000 side; -6% franchise = 14,100; x60% = $8,460', () => {
    const r = config.calculate({ structure: 'realestate', saleAmount: '500000', reGrossPct: '6', reAgentSplitPct: '60', reFranchisePct: '6' });
    expect(r.find((x: any) => x.id === 'net')!.value).toBe('$8,460.00');
  });
});
