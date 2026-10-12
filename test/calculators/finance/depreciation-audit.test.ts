import { describe, it, expect } from 'vitest';
import config, { calcMACRS } from '../../../src/calculators/finance/depreciation/index';
import { getValue, parseMoney } from '../../helpers';

// IRS Publication 946, Table A-1 (half-year convention), percent of cost per recovery year.
const IRS_TABLE_A1: Record<number, number[]> = {
  3: [33.33, 44.45, 14.81, 7.41],
  5: [20.0, 32.0, 19.2, 11.52, 11.52, 5.76],
  7: [14.29, 24.49, 17.49, 12.49, 8.93, 8.92, 8.93, 4.46],
  10: [10.0, 18.0, 14.4, 11.52, 9.22, 7.37, 6.55, 6.55, 6.56, 6.55, 3.28],
  15: [5.0, 9.5, 8.55, 7.7, 6.93, 6.23, 5.9, 5.9, 5.91, 5.9, 5.91, 5.9, 5.91, 5.9, 5.91, 2.95],
  20: [3.75, 7.219, 6.677, 6.177, 5.713, 5.285, 4.888, 4.522, 4.462, 4.461, 4.462, 4.461, 4.462, 4.461, 4.462, 4.461, 4.462, 4.461, 4.462, 4.461, 2.231],
};

describe('depreciation audit', () => {
  for (const [life, table] of Object.entries(IRS_TABLE_A1)) {
    it(`MACRS ${life}-year property reproduces IRS Table A-1 (percent of a $100,000 cost, tables are rounded)`, () => {
      const { schedule } = calcMACRS(100000, Number(life));
      expect(schedule).toHaveLength(table.length);
      schedule.forEach((row, i) => {
        // $100,000 cost: 1 percentage point = $1,000; IRS rounds to 0.01 pt (20-year to 0.001) => 10-ish dollars
        expect(Math.abs(row.depreciationExpense / 1000 - table[i])).toBeLessThanOrEqual(0.0101);
      });
      expect(schedule[schedule.length - 1].bookValue).toBe(0);
    });
  }

  it('MACRS ignores salvage entirely (regression: 5,000 salvage used to cut the basis to 50,000)', () => {
    const withSalvage = config.calculate({ assetCost: '55000', salvageValue: '5000', usefulLife: '7', method: 'macrs' });
    const without = config.calculate({ assetCost: '55000', salvageValue: '0', usefulLife: '7', method: 'macrs' });
    expect(getValue(withSalvage, 'totalDepreciation')).toBe(getValue(without, 'totalDepreciation'));
    expect(parseMoney(getValue(withSalvage, 'totalDepreciation'))).toBe(55000);
    expect(parseMoney(getValue(withSalvage, 'bookValue'))).toBe(0);
  });

  it('Carlos worked example: year 1 $7,857.14, year 2 $13,469.39, year 3 $9,620.99, 8 tax years', () => {
    const { schedule } = calcMACRS(55000, 7);
    expect(schedule).toHaveLength(8);
    expect(schedule[0].depreciationExpense).toBeCloseTo(7857.14, 2);
    expect(schedule[1].depreciationExpense).toBeCloseTo(13469.39, 2);
    expect(schedule[2].depreciationExpense).toBeCloseTo(9620.99, 2);
  });

  it('Rebecca worked example: straight line 12,000 / 1,500 salvage / 5 years = 2,100 per year; MACRS year 1 = 2,400', () => {
    const sl = config.calculate({ assetCost: '12000', salvageValue: '1500', usefulLife: '5', method: 'straight-line' });
    expect(getValue(sl, 'annualDepreciation')).toBe('$2,100.00 / year');
    expect(getValue(sl, 'depreciableBasis')).toBe('$10,500.00');
    expect(getValue(sl, 'bookValue')).toBe('$1,500.00');
    const macrs = config.calculate({ assetCost: '12000', salvageValue: '1500', usefulLife: '5', method: 'macrs' });
    expect(getValue(macrs, 'annualDepreciation')).toBe('$2,400.00');
  });

  it('25+ year lives fall back to straight line with a half-year convention (2% / 4% ... / 2%)', () => {
    const { schedule } = calcMACRS(100000, 25);
    expect(schedule).toHaveLength(26);
    expect(schedule[0].depreciationExpense).toBeCloseTo(2000, 6);
    expect(schedule[1].depreciationExpense).toBeCloseTo(4000, 6);
    expect(schedule[25].depreciationExpense).toBeCloseTo(2000, 6);
  });

  it('method label reflects 150% DB for 15-year property', () => {
    const r = config.calculate({ assetCost: '10000', salvageValue: '0', usefulLife: '15', method: 'macrs' });
    expect(getValue(r, 'method')).toContain('150%');
  });
});
