import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/discount-calculator/index';
import { getValue, parseMoney } from '../../helpers';

describe('discount calculator', () => {
  it('applies single discount', () => {
    const r = config.calculate({
      originalPrice: '100',
      discount1: '20',
      discount2: '0',
      salesTaxRate: '0',
    });
    expect(parseMoney(getValue(r, 'finalPrice'))).toBeCloseTo(80, 0);
    // totalSavings is "$20.00 (20.0% off)" — verify the money portion
    const savingsStr = getValue(r, 'totalSavings');
    expect(savingsStr).toContain('20.0');
    expect(savingsStr).toContain('% off');
  });

  it('stacks discounts sequentially (not additive)', () => {
    const r = config.calculate({
      originalPrice: '100',
      discount1: '20',
      discount2: '10',
      salesTaxRate: '0',
    });
    // 20% + 10% stack = $100 * 0.8 * 0.9 = $72, not $70
    expect(parseMoney(getValue(r, 'finalPrice'))).toBeCloseTo(72, 0);
  });

  it('applies sales tax', () => {
    const r = config.calculate({
      originalPrice: '100',
      discount1: '0',
      discount2: '0',
      salesTaxRate: '8.25',
    });
    expect(parseMoney(getValue(r, 'finalPrice'))).toBeCloseTo(108.25, 0);
  });

  it('returns empty for invalid inputs', () => {
    const r = config.calculate({
      originalPrice: '',
      discount1: '20',
      discount2: '0',
      salesTaxRate: '0',
    });
    expect(r).toEqual([]);
  });
});
