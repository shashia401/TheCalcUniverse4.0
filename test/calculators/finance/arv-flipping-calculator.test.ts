import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/arv-flipping/index';
import { getValue, parseMoney, near } from '../../helpers';

describe('arv-flipping', () => {
  it('calculates MAO correctly for a standard flip', () => {
    const r = config.calculate({
      afterRepairValue: '300000',
      repairCosts: '50000',
      holdingCosts: '15000',
      targetProfitMargin: '20',
    });

    // MAO = (300K * 0.80) - 50K - 15K = 175K
    near(parseMoney(getValue(r, 'mao')), 175000, 1);
    // Total costs = 175K + 50K + 15K = 240K
    near(parseMoney(getValue(r, 'totalCosts')), 240000, 1);
    // Profit = 300K - 240K = 60K
    near(parseMoney(getValue(r, 'estimatedProfit')), 60000, 1);
    // ROI = 60K / 240K * 100 = 25%
    expect(getValue(r, 'roiPercent')).toBe('25.0%');
    // 70% Rule = 300K * 0.70 - 50K = 160K
    near(parseMoney(getValue(r, 'seventyPercentRule')), 160000, 1);
  });

  it('handles zero profit margin (MAO = ARV - costs)', () => {
    const r = config.calculate({
      afterRepairValue: '200000',
      repairCosts: '30000',
      holdingCosts: '10000',
      targetProfitMargin: '0',
    });

    // MAO = 200K * 1.0 - 30K - 10K = 160K
    near(parseMoney(getValue(r, 'mao')), 160000, 1);
    near(parseMoney(getValue(r, 'estimatedProfit')), 0, 1);
    expect(getValue(r, 'roiPercent')).toBe('0.0%');
  });

  it('returns empty array for invalid inputs', () => {
    const r = config.calculate({
      afterRepairValue: '',
      repairCosts: '50000',
      holdingCosts: '15000',
      targetProfitMargin: '20',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for zero ARV', () => {
    const r = config.calculate({
      afterRepairValue: '0',
      repairCosts: '50000',
      holdingCosts: '15000',
      targetProfitMargin: '20',
    });
    expect(r).toEqual([]);
  });

  it('rejects negative profit margin (returns empty array)', () => {
    const r = config.calculate({
      afterRepairValue: '100000',
      repairCosts: '20000',
      holdingCosts: '5000',
      targetProfitMargin: '-10',
    });

    // Negative profit margin is invalid — return empty results
    expect(r).toEqual([]);
  });

  it('handles large ARV scenario (luxury flip)', () => {
    const r = config.calculate({
      afterRepairValue: '1200000',
      repairCosts: '250000',
      holdingCosts: '80000',
      targetProfitMargin: '18',
    });

    // MAO = 1.2M * 0.82 - 250K - 80K = 984K - 250K - 80K = 654K
    near(parseMoney(getValue(r, 'mao')), 654000, 1);
    // Total = 654K + 250K + 80K = 984K
    near(parseMoney(getValue(r, 'totalCosts')), 984000, 1);
    // Profit = 1.2M - 984K = 216K
    near(parseMoney(getValue(r, 'estimatedProfit')), 216000, 1);
    // ROI = 216K / 984K = 21.95...%
    near(parseFloat(getValue(r, 'roiPercent')), 22.0, 0.1);
    // 70% Rule = 1.2M * 0.7 - 250K = 590K
    near(parseMoney(getValue(r, 'seventyPercentRule')), 590000, 1);
  });

  it('handles repair costs exceeding 70% of ARV (negative 70% rule)', () => {
    const r = config.calculate({
      afterRepairValue: '200000',
      repairCosts: '160000',
      holdingCosts: '10000',
      targetProfitMargin: '15',
    });

    // 70% Rule = 200K * 0.7 - 160K = -20K → clamped to 0
    expect(getValue(r, 'seventyPercentRule')).toBe('$0');
    // MAO = 200K * 0.85 - 160K - 10K = 170K - 160K - 10K = 0
    expect(getValue(r, 'mao')).toBe('$0');
  });

  it('returns empty for profit margin above 100%', () => {
    const r = config.calculate({
      afterRepairValue: '300000',
      repairCosts: '50000',
      holdingCosts: '15000',
      targetProfitMargin: '150',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for negative holding costs', () => {
    const r = config.calculate({
      afterRepairValue: '300000',
      repairCosts: '50000',
      holdingCosts: '-1000',
      targetProfitMargin: '20',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for negative repair costs', () => {
    const r = config.calculate({
      afterRepairValue: '300000',
      repairCosts: '-5000',
      holdingCosts: '15000',
      targetProfitMargin: '20',
    });
    expect(r).toEqual([]);
  });

  it('MAO matches ARV when costs and margin are zero', () => {
    const r = config.calculate({
      afterRepairValue: '250000',
      repairCosts: '0',
      holdingCosts: '0',
      targetProfitMargin: '0',
    });

    // MAO = 250K * 1.0 - 0 - 0 = 250K
    near(parseMoney(getValue(r, 'mao')), 250000, 1);
    near(parseMoney(getValue(r, 'estimatedProfit')), 0, 1);
    expect(getValue(r, 'roiPercent')).toBe('0.0%');
  });
});
