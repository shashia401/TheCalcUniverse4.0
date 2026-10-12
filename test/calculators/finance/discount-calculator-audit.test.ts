import { describe, it, expect } from 'vitest';
import config, { applyDiscounts } from '../../../src/calculators/finance/discount-calculator/index';
import { getValue } from '../../helpers';

describe('discount-calculator audit', () => {
  it('20% + 10% on $100 = $72.00 (28% off, not 30%)', () => {
    const r = config.calculate({ originalPrice: '100', discount1: '20', discount2: '10' });
    expect(getValue(r, 'finalPrice')).toBe('$72.00');
    expect(getValue(r, 'totalSavings')).toBe('$28.00 (28.0% off)');
  });

  it('quick-reference rows: 30%+20% off $100 = $56, 50%+20% = $40, $50 +10% +8% tax = $48.60', () => {
    expect(getValue(config.calculate({ originalPrice: '100', discount1: '30', discount2: '20' }), 'finalPrice')).toBe('$56.00');
    expect(getValue(config.calculate({ originalPrice: '100', discount1: '50', discount2: '20' }), 'finalPrice')).toBe('$40.00');
    expect(getValue(config.calculate({ originalPrice: '50', discount1: '10', salesTaxRate: '8' }), 'finalPrice')).toBe('$48.60');
  });

  it('FAQ tax example: $100 at 20% off + 8% tax = $86.40 (vs $108 undiscounted)', () => {
    const r = config.calculate({ originalPrice: '100', discount1: '20', salesTaxRate: '8' });
    expect(getValue(r, 'finalPrice')).toBe('$86.40');
    expect(108 - 86.4).toBeCloseTo(21.6, 10);
  });

  it('FAQ $500 example: stacked 20+10 saves $140 vs $150 for a true 30%', () => {
    expect(applyDiscounts(500, 0.2, 0.1, 0).savings).toBeCloseTo(140, 10);
    expect(applyDiscounts(500, 0.3, 0, 0).savings).toBeCloseTo(150, 10);
  });

  it('cart helper (used by the bulk panel) matches the calculator: 49.99 with 20% off and 8.25% tax', () => {
    const c = applyDiscounts(49.99, 0.2, 0, 0.0825);
    expect(c.afterDiscount).toBeCloseTo(39.992, 6);
    expect(c.afterTax).toBeCloseTo(43.29134, 5);
    const r = config.calculate({ originalPrice: '49.99', discount1: '20', discount2: '0', salesTaxRate: '8.25' });
    expect(getValue(r, 'finalPrice')).toBe('$43.29');
  });

  it('incomplete input returns []; 100% off gives a $0 price', () => {
    expect(config.calculate({ originalPrice: '100' })).toEqual([]);
    expect(getValue(config.calculate({ originalPrice: '100', discount1: '100' }), 'finalPrice')).toBe('$0.00');
  });
});
