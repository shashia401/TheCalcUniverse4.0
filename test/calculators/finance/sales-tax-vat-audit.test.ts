import { describe, it, expect } from 'vitest';
import sales from '../../../src/calculators/finance/sales-tax/index';
import vat from '../../../src/calculators/finance/vat-calculator/index';
import { salesTaxFigures } from '../../../src/calculators/finance/sales-tax/salesTaxMath';
import { VAT_RATES } from '../../../src/utils/taxData';
import { getValue } from '../../helpers';

describe('sales-tax audit', () => {
  it('worked example: extract $2,376 at 8.25% -> net 2,194.92, tax 181.08, 7.62% of total', () => {
    // 2376 / 1.0825 = 2194.9192...; 2376 - 2194.92 = 181.08; 181.08 / 2376 = 7.62%
    const r = sales.calculate({ mode: 'extract', amount: '2376', taxRate: '8.25' });
    expect(getValue(r, 'netPrice')).toBe('$2,194.92');
    expect(getValue(r, 'taxAmount')).toBe('$181.08');
    expect(getValue(r, 'effectiveRate')).toBe('7.621%');
  });

  it('worked examples: add 49.99 @10.25% = 5.12 tax, 55.11 total; 89.99 @8.875% = 7.99, 97.98', () => {
    const a = sales.calculate({ mode: 'add', amount: '49.99', taxRate: '10.25' }); // 49.99 x .1025 = 5.1240
    expect(getValue(a, 'taxAmount')).toBe('$5.12');
    expect(getValue(a, 'grossPrice')).toBe('$55.11');
    const b = sales.calculate({ mode: 'add', amount: '89.99', taxRate: '8.875' }); // 7.98666
    expect(getValue(b, 'taxAmount')).toBe('$7.99');
    expect(getValue(b, 'grossPrice')).toBe('$97.98');
  });

  it('FAQ: $100 total at 8% -> net 92.59, tax 7.41', () => {
    const r = sales.calculate({ mode: 'extract', amount: '100', taxRate: '8' });
    expect(getValue(r, 'netPrice')).toBe('$92.59');
    expect(getValue(r, 'taxAmount')).toBe('$7.41');
  });

  it('lines always add up to the cent (regression: unrounded tax could show a 1c gap)', () => {
    for (const [amt, rate] of [[0.45, 0.1], [10.01, 0.0825], [33.33, 0.0825], [19.99, 0.07], [1234.56, 0.0625]]) {
      const add = salesTaxFigures('add', amt, rate);
      expect(Math.round((add.net + add.tax) * 100)).toBe(Math.round(add.gross * 100));
      expect(Math.round(add.tax * 100)).toBe(Math.round(add.tax * 100));
      const ext = salesTaxFigures('extract', amt, rate);
      expect(Math.round((ext.net + ext.tax) * 100)).toBe(Math.round(amt * 100));
    }
    // 0.45 x 10% = 0.045 -> rounds to 0.05; total 0.50
    expect(salesTaxFigures('add', 0.45, 0.1).tax).toBe(0.05);
  });

  it('zero rate: no tax; invalid input -> []', () => {
    expect(getValue(sales.calculate({ mode: 'add', amount: '50', taxRate: '0' }), 'taxAmount')).toBe('$0.00');
    expect(sales.calculate({ mode: 'add', amount: '', taxRate: '5' })).toEqual([]);
  });
});

describe('vat-calculator audit', () => {
  it('add 20% to 100 = 120; remove 20% from 120 = 100 net, 20 VAT, VAT is 16.7% of gross', () => {
    const a = vat.calculate({ calcMode: 'add', amount: '100', vatRate: '20' });
    expect(getValue(a, 'grossAmount')).toBe('$120.00');
    const r = vat.calculate({ calcMode: 'remove', amount: '120', vatRate: '20' });
    expect(getValue(r, 'netAmount')).toBe('$100.00');
    expect(getValue(r, 'vatAmount')).toBe('$20.00');
    expect(getValue(r, 'vatShare')).toBe('16.7%'); // 20/120
  });

  it('country alone supplies the standard rate; a typed rate overrides it (regression: the country select did nothing)', () => {
    const de = vat.calculate({ calcMode: 'add', amount: '100', country: 'DE', vatRate: '' });
    expect(getValue(de, 'grossAmount')).toBe('$119.00'); // Germany 19%
    const reduced = vat.calculate({ calcMode: 'add', amount: '100', country: 'DE', vatRate: '7' });
    expect(getValue(reduced, 'grossAmount')).toBe('$107.00');
    expect(vat.calculate({ calcMode: 'add', amount: '100', country: '', vatRate: '' })).toEqual([]);
  });

  it('2026 rate fixes: Romania 21% (from Aug 2025), Estonia 24% (from Jul 2025); no invented Brazil VAT', () => {
    expect(VAT_RATES.RO.standard).toBe(21);
    expect(VAT_RATES.EE.standard).toBe(24);
    expect(VAT_RATES.BR).toBeUndefined();
    expect(VAT_RATES.FI.standard).toBe(25.5);
    expect(VAT_RATES.HU.standard).toBe(27);
  });

  it('VAT is rounded to the cent so net + VAT = gross', () => {
    const r = vat.calculate({ calcMode: 'remove', amount: '99.99', vatRate: '21' });
    // 99.99 / 1.21 = 82.6364 -> 82.64; VAT 99.99 - 82.64 = 17.35
    expect(getValue(r, 'netAmount')).toBe('$82.64');
    expect(getValue(r, 'vatAmount')).toBe('$17.35');
  });
});
