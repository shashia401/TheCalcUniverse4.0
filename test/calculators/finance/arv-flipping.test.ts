import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/arv-flipping/index';

describe('afterRepairValue', () => {
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

describe('arv-flipping – audit regressions', () => {
  const g = (r: any[], id: string) => r.find((x) => x.id === id)!;
  it('MAO = ARV(1-20%) - repairs - holding = 300000*0.8 - 50000 - 15000 = 175,000; profit 60,000; ROI 60000/240000 = 25%', () => {
    const r = config.calculate({ afterRepairValue: '300000', repairCosts: '50000', holdingCosts: '15000', targetProfitMargin: '20' });
    expect(g(r, 'mao').value).toBe('$175,000');
    expect(g(r, 'estimatedProfit').value).toBe('$60,000');
    expect(g(r, 'roiPercent').value).toBe('25.0%');
    expect(g(r, 'seventyPercentRule').value).toBe('$160,000'); // 300000*0.7-50000
  });
  it('flags a deal where costs exceed the ARV left after the profit target (raw MAO < 0)', () => {
    const r = config.calculate({ afterRepairValue: '100000', repairCosts: '60000', holdingCosts: '30000', targetProfitMargin: '20' });
    // 100000*0.8 - 90000 = -10000 -> no workable offer
    expect(g(r, 'mao').value).toBe('$0');
    expect(g(r, 'mao').color).toBe('negative');
    expect(g(r, 'mao').interpretation).toMatch(/no purchase price works/);
  });
});
