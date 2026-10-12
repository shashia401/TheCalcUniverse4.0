import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/rental-property/index';

describe('purchasePrice', () => {
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

// ── Edge-input regression: no NaN / Infinity / ∞ in any output ──
const noGarbage = (r: unknown) => expect(JSON.stringify(r)).not.toMatch(/NaN|Infinity|∞/);

describe('edge inputs: blank interest rate', () => {
  const base = { purchasePrice: '350000', downPayment: '70000', closingCosts: '10000', interestRate: '7.25', loanTerm: '30', monthlyRent: '2500' };
  it('blank rate returns [] (required input incomplete)', () => {
    expect(config.calculate({ ...base, interestRate: '' })).toEqual([]);
  });
  it('0% rate and normal input stay clean', () => {
    noGarbage(config.calculate({ ...base, interestRate: '0' }));
    const r = config.calculate(base);
    noGarbage(r);
    expect(r.length).toBeGreaterThan(0);
  });
});

import { getValue as gvRp } from '../../helpers';
describe('rental-property audit', () => {
  // Independent (node): Vanessa NOI 21,425; mortgage 1,910.0936; cash flow -1,496.12/yr (-124.68/mo); CoC -1.87%; cap 6.12%; DSCR 0.9347; GRM 11.67
  const vanessa = { purchasePrice: '350000', downPayment: '70000', closingCosts: '10000', interestRate: '7.25', loanTerm: '30', monthlyRent: '2500',
    vacancyRate: '5', propertyTaxState: 'tn', insurance: '1800', hoaFees: '0', maintenancePct: '10', propertyMgmtPct: '0' };
  it('worked example 1 (Vanessa, Tennessee 0.65%)', () => {
    const r = config.calculate(vanessa);
    expect(gvRp(r, 'monthlyCashFlow')).toBe('-$124.68');
    expect(gvRp(r, 'annualCashFlow')).toBe('-$1,496');
    expect(gvRp(r, 'cashOnCash')).toBe('-1.87%');
    expect(gvRp(r, 'capRate')).toBe('6.12%');
    expect(gvRp(r, 'noi')).toBe('$21,425/yr');
    expect(gvRp(r, 'dscr')).toBe('0.93x');
    expect(gvRp(r, 'grm')).toBe('11.7x');
    expect(gvRp(r, 'monthlyMortgage')).toBe('$1,910.09');
  });
  // Derek: NOI 6,390.24; mortgage 1,048.8218; cash flow -6,195.62 (-516.30/mo); CoC -10.87%; cap 3.20%; DSCR 0.51; GRM 9.3
  it('worked example 2 (Derek, Illinois 1.95%, HOA $350, 8% management)', () => {
    const r = config.calculate({ ...vanessa, purchasePrice: '200000', downPayment: '50000', closingCosts: '7000', interestRate: '7.5', monthlyRent: '1800', vacancyRate: '8',
      propertyTaxState: 'il', insurance: '1200', hoaFees: '350', maintenancePct: '12', propertyMgmtPct: '8' });
    expect(gvRp(r, 'monthlyCashFlow')).toBe('-$516.30');
    expect(gvRp(r, 'cashOnCash')).toBe('-10.87%');
    expect(gvRp(r, 'capRate')).toBe('3.20%');
    expect(gvRp(r, 'dscr')).toBe('0.51x');
  });
  it('insight claims: 6.5% rate or a $320k price turns Vanessa positive (+$187.51/yr, +$663.54/yr)', () => {
    expect(gvRp(config.calculate({ ...vanessa, interestRate: '6.5' }), 'annualCashFlow')).toBe('$188');
    expect(gvRp(config.calculate({ ...vanessa, purchasePrice: '320000', downPayment: '64000' }), 'annualCashFlow')).toBe('$664');
  });
  it('explicit 0% vacancy and 0% maintenance are respected (used to become 5% / 10%)', () => {
    // NOI = 30,000 - 2,275 (tax) - 1,800 (insurance) = 25,925
    const r = config.calculate({ ...vanessa, vacancyRate: '0', maintenancePct: '0' });
    expect(gvRp(r, 'noi')).toBe('$25,925/yr');
  });
  it('down payment above the price returns nothing', () => {
    expect(config.calculate({ ...vanessa, downPayment: '400000' })).toEqual([]);
  });
});
