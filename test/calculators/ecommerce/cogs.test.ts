import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/ecommerce/cogs/index';
import { getValue, parseMoney, parseNumber, near } from '../../helpers';

describe('COGS Calculator', () => {
  it('calculates COGS from inventory and purchases', () => {
    const results = config.calculate({
      beginningInventory: '50000',
      purchases: '120000',
      endingInventory: '45000',
      revenue: '',
    });
    // COGS = 50000 + 120000 - 45000 = 125000
    const cogs = parseMoney(getValue(results, 'cogs'));
    near(cogs, 125000);
  });

  it('calculates goods available for sale', () => {
    const results = config.calculate({
      beginningInventory: '50000',
      purchases: '120000',
      endingInventory: '45000',
      revenue: '',
    });
    const goods = parseMoney(getValue(results, 'goodsAvailable'));
    near(goods, 170000);
  });

  it('calculates gross profit and margin when revenue is provided', () => {
    const results = config.calculate({
      beginningInventory: '50000',
      purchases: '120000',
      endingInventory: '45000',
      revenue: '250000',
    });
    // COGS = 125000, Gross Profit = 250000 - 125000 = 125000
    const profit = parseMoney(getValue(results, 'grossProfit'));
    near(profit, 125000);
    // Margin = 125000 / 250000 * 100 = 50%
    const margin = parseNumber(getValue(results, 'grossMargin'));
    near(margin, 50);
  });

  it('calculates COGS as percentage of revenue', () => {
    const results = config.calculate({
      beginningInventory: '50000',
      purchases: '120000',
      endingInventory: '45000',
      revenue: '250000',
    });
    const pct = parseNumber(getValue(results, 'cogsPct'));
    near(pct, 50); // 125000 / 250000 * 100 = 50%
  });

  it('returns empty for missing required fields', () => {
    const results = config.calculate({
      beginningInventory: '',
      purchases: '',
      endingInventory: '',
      revenue: '',
    });
    expect(results).toEqual([]);
  });

  it('handles zero beginning inventory', () => {
    const results = config.calculate({
      beginningInventory: '0',
      purchases: '100000',
      endingInventory: '10000',
      revenue: '',
    });
    const cogs = parseMoney(getValue(results, 'cogs'));
    near(cogs, 90000); // 0 + 100000 - 10000 = 90000
  });
});
