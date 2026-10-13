import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/ecommerce/margin-calculator/index';
import { marginFromMarkup, markupFromMargin } from '../../../src/calculators/ecommerce/margin-calculator/marginMath';
import { getResult, getValue, parseMoney, near } from '../../helpers';

const run = (v: Record<string, string>) =>
  config.calculate({ solveFor: 'margin', costInput: '', revenueInput: '', marginInput: '', markupInput: '', ...v });

// margin = (R-C)/R, markup = (R-C)/C. All expected values hand-derived.
describe('margin-calculator audit', () => {
  it('cost 50, price 90 -> margin 44.4444%, markup 80%, profit 40', () => {
    const r = run({ costInput: '50', revenueInput: '90' });
    expect(getValue(r, 'solvedValue')).toBe('44.4444%');
    expect(getValue(r, 'markupResult')).toBe('80%');
    near(parseMoney(getValue(r, 'grossProfit')), 40);
  });
  it('markup mode headline is the markup', () => {
    const r = run({ solveFor: 'markup', costInput: '50', revenueInput: '90' });
    expect(getResult(r, 'solvedValue').label).toBe('Markup (%)');
    expect(getValue(r, 'solvedValue')).toBe('80%');
  });
  it('50% markup on $50 = $75 price = 33.3% margin (explanation text)', () => {
    const r = run({ solveFor: 'revenue', costInput: '50', markupInput: '50' });
    near(parseMoney(getValue(r, 'revenueResult')), 75);
    expect(getValue(r, 'marginResult')).toBe('33.3333%');
    near(marginFromMarkup(50), 33.3333, 1e-3);
    near(markupFromMargin(50), 100, 1e-9);
    near(marginFromMarkup(80), 44.4444, 1e-3);
  });
  it('Mike: cost 200 @ 50% margin -> $400, profit $200, markup 100%', () => {
    const r = run({ solveFor: 'revenue', costInput: '200', marginInput: '50' });
    near(parseMoney(getValue(r, 'solvedValue')), 400);
    near(parseMoney(getValue(r, 'grossProfit')), 200);
    expect(getValue(r, 'markupResult')).toBe('100%');
  });
  it('Nadia: price 34.99 @ 35% margin -> max cost 22.74; cost 24.50 is ~30% margin; 21.90 is 37.4%', () => {
    const r = run({ solveFor: 'cost', revenueInput: '34.99', marginInput: '35' });
    near(parseMoney(getValue(r, 'solvedValue')), 22.7435, 0.006);
    expect(parseFloat(getValue(run({ costInput: '24.5', revenueInput: '34.99' }), 'solvedValue'))).toBeCloseTo(29.98, 1);
    expect(parseFloat(getValue(run({ costInput: '21.9', revenueInput: '34.99' }), 'solvedValue'))).toBeCloseTo(37.41, 1);
  });
  it('Raj: cost 28 at $64.99 -> margin 56.9%, profit 36.99, markup 132.1%', () => {
    const r = run({ costInput: '28', revenueInput: '64.99' });
    expect(parseFloat(getValue(r, 'solvedValue'))).toBeCloseTo(56.92, 1);
    near(parseMoney(getValue(r, 'grossProfit')), 36.99);
    expect(parseFloat(getValue(r, 'markupResult'))).toBeCloseTo(132.11, 1);
  });
  it('cost mode from markup: price 150 at 50% markup -> cost 100', () => {
    const r = run({ solveFor: 'cost', revenueInput: '150', markupInput: '50' });
    near(parseMoney(getValue(r, 'solvedValue')), 100);
  });
  it('margin wins when margin and markup are both filled; margin 100 is rejected', () => {
    const r = run({ solveFor: 'revenue', costInput: '60', marginInput: '40', markupInput: '999' });
    near(parseMoney(getValue(r, 'solvedValue')), 100);
    expect(run({ solveFor: 'revenue', costInput: '60', marginInput: '100' })).toEqual([]);
  });
  it('zero cost: markup is N/A (not 0%); loss shows negative margin', () => {
    expect(getValue(run({ costInput: '0', revenueInput: '10' }), 'markupResult')).toBe('N/A (cost is zero)');
    const loss = run({ costInput: '100', revenueInput: '80' });
    expect(getValue(loss, 'solvedValue')).toBe('-25%');
    expect(getResult(loss, 'solvedValue').color).toBe('negative');
  });
  it('break-even shows 0% not -0%', () => {
    expect(getValue(run({ costInput: '100', revenueInput: '100.00000001' }), 'solvedValue')).toBe('0%');
  });
  it('incomplete input returns []', () => {
    expect(run({ costInput: '5' })).toEqual([]);
    expect(run({ solveFor: 'revenue', costInput: '0', marginInput: '30' })).toEqual([]);
  });
});
