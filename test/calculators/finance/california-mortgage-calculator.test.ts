import { describe, it, expect } from 'vitest';
import caConfig from '../../../src/calculators/finance/california-mortgage-calculator/index';

describe('California Mortgage Calculator', () => {
  const find = (r: ReturnType<typeof caConfig.calculate>, id: string) => r.find(x => x.id === id)?.value ?? '';

  it('calculates monthly payment for CA home', () => {
    const r = caConfig.calculate({ homePrice: '750000', downPayment: '150000', interestRate: '6.9', loanTerm: '30', propertyTaxRate: '0.77' });
    expect(find(r, 'monthlyPayment')).toContain('$');
  });

  it('returns empty for zero home price', () => {
    expect(caConfig.calculate({ homePrice: '0', downPayment: '0' })).toEqual([]);
  });

  it('returns empty when down payment exceeds home price', () => {
    expect(caConfig.calculate({ homePrice: '500000', downPayment: '600000', interestRate: '6.9' })).toEqual([]);
  });

  it('matches the "LA first-time buyer" worked example P&I (regression: educational text previously overstated it by ~$3.50/mo)', () => {
    const r = caConfig.calculate({ homePrice: '750000', downPayment: '37500', interestRate: '7.25', loanTerm: '30', propertyTaxRate: '0.85' });
    const monthlyPayment = parseFloat(find(r, 'monthlyPayment').replace(/[$,]/g, ''));
    expect(Math.abs(monthlyPayment - 4860.51)).toBeLessThan(0.5);
  });
});

describe('california-mortgage – audit regressions', () => {
  const g = (r: any[], id: string) => r.find((x) => x.id === id)!.value as string;
  it('Garcia example: $520k @6.9% 30y -> P&I $3,424.72; +tax 650000*0.77%/12 = $417.08 -> $3,841.80', () => {
    const r = caConfig.calculate({ homePrice: '650000', downPayment: '130000', interestRate: '6.9', loanTerm: '30', propertyTaxRate: '0.77' });
    expect(g(r, 'monthlyPayment')).toBe('$3,424.72');
    expect(g(r, 'totalMonthly')).toBe('$3,841.80');
  });
  it('PMI still applies at 19.96% down (display rounds to 20.0%)', () => {
    // 749,999... use 750,000 home, 149,700 down = 19.96%; PMI = 600,300*0.5%/12 = 250.13
    const r = caConfig.calculate({ homePrice: '750000', downPayment: '149700', interestRate: '0', loanTerm: '30', propertyTaxRate: '0' });
    // zero rate: P&I = 600300/360 = 1667.50; + PMI 250.125 = 1917.625
    expect(g(r, 'totalMonthly')).toBe('$1,917.63');
  });
});
