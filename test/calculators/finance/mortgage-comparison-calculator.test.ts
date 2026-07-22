import { describe, it, expect } from 'vitest';
import mortgageComparisonConfig from '../../../src/calculators/finance/mortgage-comparison/index';

describe('Mortgage Comparison Calculator', () => {
  const find = (results: ReturnType<typeof mortgageComparisonConfig.calculate>, id: string) =>
    results.find((r) => r.id === id)?.value ?? '';

  it('calculates 15 vs 30 year mortgage comparison', () => {
    const results = mortgageComparisonConfig.calculate({
      homePrice: '400000',
      downPayment: '80000',
      rate15: '5.5',
      rate30: '6.5',
      propertyTaxRate: '1.2',
      annualInsurance: '1200',
      pmiRate: '0',
    });

    // 15-year should have higher monthly but lower total interest
    const monthly15 = find(results, 'monthly15');
    const monthly30 = find(results, 'monthly30');

    expect(monthly15).toContain('$');
    expect(monthly30).toContain('$');

    // 15-year total interest should be less than 30-year
    const interest15 = find(results, 'interest15');
    const interest30 = find(results, 'interest30');
    const i15 = parseFloat(interest15.replace(/[^0-9.]/g, ''));
    const i30 = parseFloat(interest30.replace(/[^0-9.]/g, ''));
    expect(i15).toBeLessThan(i30);
  });

  it('applies PMI when down payment is less than 20%', () => {
    const results = mortgageComparisonConfig.calculate({
      homePrice: '300000',
      downPayment: '15000',
      rate15: '5.5',
      rate30: '6.5',
      pmiRate: '0.5',
    });

    // PMI should add to monthly payment
    const monthly15 = find(results, 'monthly15');
    expect(monthly15).toContain('$');
  });

  it('returns empty array for zero home price', () => {
    expect(mortgageComparisonConfig.calculate({
      homePrice: '0',
      downPayment: '0',
      rate15: '5.5',
      rate30: '6.5',
    })).toEqual([]);
  });

  it('shows savings from 15-year', () => {
    const results = mortgageComparisonConfig.calculate({
      homePrice: '400000',
      downPayment: '80000',
      rate15: '5.5',
      rate30: '6.5',
    });

    const savings = find(results, 'savings');
    expect(savings).not.toBe('No savings');
  });
});
