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
});
