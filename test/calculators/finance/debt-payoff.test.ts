import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/debt-payoff/index';

describe('extraPayment', () => {
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

import { getValue as getDebtValue } from '../../helpers';

// ── Edge-input regression: no NaN / Infinity / ∞ in any output ──
const noGarbage = (r: unknown) => expect(JSON.stringify(r)).not.toMatch(/NaN|Infinity|∞/);

describe('edge inputs: non-amortizing / huge APR', () => {
  const base = { extraPayment: '200', card1balance: '4500', card1rate: '22.99', card1min: '85', card2balance: '2100', card2rate: '19.99', card2min: '45' };
  it('APR inputs are capped at 100', () => {
    for (const id of ['card1rate', 'card2rate', 'card3rate']) {
      expect(config.inputs.find((i) => i.id === id)?.max).toBe(100);
    }
  });
  it.each(['100', '1000000', '1e9'])('APR %s with payments below interest has no Infinity', (apr) => {
    const r = config.calculate({ ...base, extraPayment: '0', card1rate: apr, card2rate: apr });
    noGarbage(r);
    expect(getDebtValue(r, 'snowballTime')).toContain('50+ years');
  });
  it('normal input unchanged', () => {
    const r = config.calculate(base);
    noGarbage(r);
    expect(getDebtValue(r, 'totalDebt')).toBe('$6,600');
    expect(getDebtValue(r, 'snowballTime')).not.toContain('50+');
    expect(getDebtValue(r, 'avalancheInterest')).toMatch(/^\$[\d,]+$/);
  });
});
