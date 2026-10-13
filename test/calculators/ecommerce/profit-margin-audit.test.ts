import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/ecommerce/profit-margin/index';
import { getValue, parseMoney, near } from '../../helpers';

const run = (v: Record<string, string>) => config.calculate({ mode: 'margin', cost: '', revenue: '', targetPct: '', ...v });

// margin = (R-C)/R, markup = (R-C)/C; hand-derived.
describe('profit-margin audit', () => {
  it('Jenny: 8.50 -> 18.99 is 55.24% margin / $10.49 profit; 60% margin target needs $21.25', () => {
    const r = run({ cost: '8.50', revenue: '18.99' });
    expect(getValue(r, 'primary')).toBe('55.24%');
    near(parseMoney(getValue(r, 'profit')), 10.49);
    const t = run({ mode: 'price_from_margin', cost: '8.50', targetPct: '60' });
    near(parseMoney(getValue(t, 'price')), 21.25);
    near(parseMoney(getValue(t, 'profit')), 12.75);
  });
  it('Marcus: cost 120 at $240 is 50% margin / 100% markup; $180 is only 33.33% margin', () => {
    const r = run({ cost: '120', revenue: '240' });
    expect(getValue(r, 'margin')).toBe('50.00%');
    expect(getValue(r, 'markup')).toBe('100.00%');
    expect(getValue(run({ cost: '120', revenue: '180' }), 'margin')).toBe('33.33%');
  });
  it('Sophia: 4.20 -> 12.00 is 65% / 185.71%; sale at 10.20 is 58.82% with $6.00 profit; floor 9.33 is 55%', () => {
    const r = run({ cost: '4.20', revenue: '12' });
    expect(getValue(r, 'margin')).toBe('65.00%');
    expect(getValue(r, 'markup')).toBe('185.71%');
    const sale = run({ cost: '4.20', revenue: '10.20' });
    expect(getValue(sale, 'margin')).toBe('58.82%');
    near(parseMoney(getValue(sale, 'profit')), 6);
    near(parseMoney(getValue(run({ mode: 'price_from_margin', cost: '4.20', targetPct: '55' }), 'price')), 9.33);
  });
  it('furniture/restaurant: 50% markup on $200 -> $300 and 33.33% margin; 300% markup on $8 -> $32, 75% margin', () => {
    const f = run({ mode: 'price_from_markup', cost: '200', targetPct: '50' });
    near(parseMoney(getValue(f, 'price')), 300);
    expect(getValue(f, 'margin')).toBe('33.33%');
    const r = run({ mode: 'price_from_markup', cost: '8', targetPct: '300' });
    near(parseMoney(getValue(r, 'price')), 32);
    expect(getValue(r, 'margin')).toBe('75.00%');
  });
  it('FAQ: $75 @ 40% -> $125; $60 @ 25% -> $80; discount example 40% -> 25%', () => {
    near(parseMoney(getValue(run({ mode: 'price_from_margin', cost: '75', targetPct: '40' }), 'price')), 125);
    near(parseMoney(getValue(run({ mode: 'price_from_margin', cost: '60', targetPct: '25' }), 'price')), 80);
    expect(getValue(run({ cost: '100', revenue: '133.33' }), 'margin')).toBe('25.00%');
  });
  it('zero cost: markup is N/A, not 0%', () => {
    expect(getValue(run({ cost: '0', revenue: '10' }), 'markup')).toBe('N/A (cost is zero)');
  });
  it('invalid input returns []', () => {
    expect(run({ cost: '5' })).toEqual([]);
    expect(run({ mode: 'price_from_margin', cost: '5', targetPct: '100' })).toEqual([]);
    expect(run({ mode: 'price_from_margin', cost: '5' })).toEqual([]);
  });
});
