import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/percent-off';
import { getValue, parseMoney, parsePercent, near } from '../../helpers';

describe('percent-off', () => {
  it('single discount: $100 @ 25% off = $75 final, $25 saved', () => {
    const r = config.calculate({
      price: '100',
      discount1: '25',
      discount2: '',
      tax: '',
    });
    near(parseMoney(getValue(r, 'final')), 75);
    near(parseMoney(getValue(r, 'saved')), 25);
    near(parsePercent(getValue(r, 'effective')), 25);
  });

  it('stacked discounts compound, not add: 20% then 30% on $100 = $56.00', () => {
    const r = config.calculate({
      price: '100',
      discount1: '20',
      discount2: '30',
      tax: '',
    });
    // 100 × 0.80 × 0.70 = 56
    near(parseMoney(getValue(r, 'final')), 56);
    // Effective discount is 44%, NOT the naive sum of 50%
    near(parsePercent(getValue(r, 'effective')), 44);
  });

  it('with sales tax: $100 @ 10% off + 8.875% NYC tax', () => {
    const r = config.calculate({
      price: '100',
      discount1: '10',
      discount2: '',
      tax: '8.875',
    });
    // 100 × 0.90 = 90; tax on 90 = 7.9875; final = 97.9875
    near(parseMoney(getValue(r, 'final')), 97.9875, 0.005);
  });

  it('rejects discount > 100%', () => {
    const r = config.calculate({
      price: '100',
      discount1: '150',
      discount2: '',
      tax: '',
    });
    // Returns an error row, not empty array
    expect(r.find((x) => x.id === 'err')).toBeDefined();
  });

  it('returns empty for invalid price', () => {
    const r = config.calculate({
      price: '',
      discount1: '10',
      discount2: '',
      tax: '',
    });
    expect(r).toEqual([]);
  });
});

describe('percent-off audit', () => {
  // Independent: 200 x 0.60 x 0.70 = 84.00; tax 8.25% -> 90.93; saved 116.00; effective 58%; gap 12 points
  it('Black Friday example: $90.93 final, 58% effective, gap 12', () => {
    const r = config.calculate({ price: '200', discount1: '40', discount2: '30', tax: '8.25' });
    expect(getValue(r, 'final')).toBe('$90.93');
    expect(getValue(r, 'saved')).toBe('$116.00');
    expect(getValue(r, 'effective')).toBe('58.00%');
    expect(getValue(r, 'gap')).toContain('12.00 percentage points');
  });
  it('clearance FAQ: $200, 50% then 30% -> $70.00, 65%', () => {
    const r = config.calculate({ price: '200', discount1: '50', discount2: '30' });
    expect(getValue(r, 'final')).toBe('$70.00');
    expect(getValue(r, 'effective')).toBe('65.00%');
  });
  it('tax FAQ: $100, 25% off, 8% tax -> $81.00', () => {
    expect(getValue(config.calculate({ price: '100', discount1: '25', tax: '8' }), 'final')).toBe('$81.00');
  });
  it('out-of-range percentages return the input-error row', () => {
    expect(config.calculate({ price: '100', discount1: '120' })[0].id).toBe('err');
  });
});
