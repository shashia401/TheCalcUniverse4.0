import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/ecommerce/cogs/index';
import { computeCogs } from '../../../src/calculators/ecommerce/cogs/cogsMath';
import { getResult, getValue, parseMoney, near } from '../../helpers';

const run = (b: string, p: string, e: string, rev = '') =>
  config.calculate({ beginningInventory: b, purchases: p, endingInventory: e, revenue: rev });

describe('COGS audit (COGS = begin + purchases - ending)', () => {
  it('clothing brand: 50000 + 120000 - 45000 = 125000; revenue 250000 -> 50% margin', () => {
    const r = run('50000', '120000', '45000', '250000');
    near(parseMoney(getValue(r, 'cogs')), 125000);
    near(parseMoney(getValue(r, 'goodsAvailable')), 170000);
    near(parseMoney(getValue(r, 'grossProfit')), 125000);
    expect(getValue(r, 'grossMargin')).toBe('50.00%');
    expect(getValue(r, 'cogsPct')).toBe('50.00%');
  });
  it('overstated ending inventory ($55k) -> COGS 115000, margin 54%', () => {
    const r = run('50000', '120000', '55000', '250000');
    near(parseMoney(getValue(r, 'cogs')), 115000);
    expect(getValue(r, 'grossMargin')).toBe('54.00%');
  });
  it('FAQ: ending = begin + purchases - COGS = 45000', () => {
    expect(50000 + 120000 - 125000).toBe(45000);
  });
  it('negative gross profit is negative and coloured negative (panel used to show it as positive)', () => {
    const r = run('0', '1000', '0', '400');
    near(parseMoney(getValue(r, 'grossProfit')), -600);
    expect(getResult(r, 'grossProfit').color).toBe('negative');
    expect(getValue(r, 'grossMargin')).toBe('-150.00%');
  });
  it('ending inventory above goods available is flagged, COGS floored at 0', () => {
    const r = run('100', '100', '500');
    near(parseMoney(getValue(r, 'cogs')), 0);
    expect(getResult(r, 'cogs').warning).toMatch(/impossible/);
    expect(computeCogs(100, 100, 500).impossible).toBe(true);
    expect(getResult(run('100', '100', '50'), 'cogs').warning).toBeUndefined();
  });
  it('revenue optional / invalid inputs', () => {
    expect(run('100', '100', '50').map((x) => x.id)).toEqual(['cogs', 'goodsAvailable']);
    expect(run('', '100', '50')).toEqual([]);
    expect(run('-1', '100', '50')).toEqual([]);
  });
});
