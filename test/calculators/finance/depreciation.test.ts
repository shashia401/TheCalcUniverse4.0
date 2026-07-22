import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/depreciation/index';
import { getValue, parseMoney, parseNumber, near } from '../../helpers';

interface ScheduleRow {
  year: number;
  depreciationExpense: number;
  accumulatedDepreciation: number;
  bookValue: number;
}

function parseSchedule(results: Array<{ id: string; value: string }>): ScheduleRow[] {
  const s = results.find((r) => r.id === 'schedule');
  if (!s) throw new Error('No schedule found');
  return JSON.parse(s.value) as ScheduleRow[];
}

describe('depreciation', () => {
  describe('straight-line', () => {
    it('calculates straight-line depreciation correctly', () => {
      const r = config.calculate({
        assetCost: '50000',
        salvageValue: '5000',
        usefulLife: '5',
        method: 'straight-line',
      });

      // Annual = (50000 - 5000) / 5 = 9000
      near(parseNumber(getValue(r, 'annualDepreciation')), 9000, 0.01);
      near(parseMoney(getValue(r, 'totalDepreciation')), 45000, 0.01);
      near(parseMoney(getValue(r, 'depreciableBasis')), 45000, 0.01);

      const schedule = parseSchedule(r);
      expect(schedule).toHaveLength(5);
      expect(schedule[0].depreciationExpense).toBe(9000);
      expect(schedule[4].bookValue).toBe(5000); // Should equal salvage
    });

    it('handles zero salvage value', () => {
      const r = config.calculate({
        assetCost: '10000',
        salvageValue: '0',
        usefulLife: '4',
        method: 'straight-line',
      });

      // Annual = (10000 - 0) / 4 = 2500
      near(parseNumber(getValue(r, 'annualDepreciation')), 2500, 0.01);
      near(parseMoney(getValue(r, 'totalDepreciation')), 10000, 0.01);
    });

    it('returns empty for invalid inputs', () => {
      const r = config.calculate({
        assetCost: '',
        salvageValue: '0',
        usefulLife: '5',
        method: 'straight-line',
      });
      expect(r).toEqual([]);
    });
  });

  describe('MACRS', () => {
    it('calculates MACRS depreciation with half-year convention', () => {
      const r = config.calculate({
        assetCost: '50000',
        salvageValue: '5000',
        usefulLife: '5',
        method: 'macrs',
      });

      // MACRS 200% DB with half-year convention
      // rate = 2/5 = 0.4
      // Year 1: 50000 * 0.4 * 0.5 = 10000
      near(parseNumber(getValue(r, 'annualDepreciation')), 10000, 0.01);
      near(parseMoney(getValue(r, 'totalDepreciation')), 45000, 0.01); // cost - salvage

      const schedule = parseSchedule(r);
      // Should have 6 years (n+1 due to half-year convention at start)
      expect(schedule.length).toBeGreaterThanOrEqual(5);

      // Year 1 should be half-rate
      expect(schedule[0].depreciationExpense).toBe(10000);
      expect(schedule[0].year).toBe(1);

      // Total all depreciation expenses should equal 45000
      const total = schedule.reduce((s, row) => s + row.depreciationExpense, 0);
      near(total, 45000, 0.01);

      // Final book value should equal salvage
      const finalBV = schedule[schedule.length - 1].bookValue;
      near(finalBV, 5000, 0.01);
    });

    it('handles 3-year asset with MACRS', () => {
      const r = config.calculate({
        assetCost: '10000',
        salvageValue: '0',
        usefulLife: '3',
        method: 'macrs',
      });

      // rate = 2/3 = 0.667
      // Year 1: 10000 * 0.667 * 0.5 = 3333.33
      near(parseNumber(getValue(r, 'annualDepreciation')), 3333.33, 1);
      near(parseMoney(getValue(r, 'totalDepreciation')), 10000, 0.01);

      const schedule = parseSchedule(r);
      const total = schedule.reduce((s, row) => s + row.depreciationExpense, 0);
      near(total, 10000, 0.01);
    });
  });

  it('returns correct depreciation method label', () => {
    const rSl = config.calculate({
      assetCost: '10000',
      salvageValue: '0',
      usefulLife: '5',
      method: 'straight-line',
    });
    expect(getValue(rSl, 'method')).toBe('Straight Line');

    const rMacrs = config.calculate({
      assetCost: '10000',
      salvageValue: '0',
      usefulLife: '5',
      method: 'macrs',
    });
    expect(getValue(rMacrs, 'method')).toContain('MACRS');
  });

  it('returns empty when salvage exceeds cost', () => {
    const r = config.calculate({
      assetCost: '5000',
      salvageValue: '10000',
      usefulLife: '5',
      method: 'straight-line',
    });
    expect(r).toEqual([]);
  });
});
