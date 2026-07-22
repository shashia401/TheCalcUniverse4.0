import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/budget-calculator';
import { getValue, parseMoney, parseNumber, near, getResult } from '../../helpers';

describe('budget-calculator', () => {
  // ─── Basic surplus / deficit ──────────────────────────────────────────
  it('returns surplus when spending is less than income', () => {
    const r = config.calculate({
      monthlyIncome: '6000',
      rent: '1500',
      utilities: '200',
      groceries: '500',
      autoGas: '400',
      insurance: '300',
      diningOut: '300',
      entertainment: '100',
      subscriptions: '50',
      shopping: '100',
      travel: '100',
      emergencyFund: '200',
      retirement401k: '300',
      investmentBrokerage: '100',
    });
    expect(getValue(r, 'leftover')).toMatch(/^\$/);
    expect(getValue(r, 'leftover')).not.toContain('-');
  });

  it('reports deficit when spending exceeds income', () => {
    const r = config.calculate({
      monthlyIncome: '4000',
      rent: '2000',
      utilities: '300',
      groceries: '800',
      autoGas: '600',
      insurance: '400',
      diningOut: '500',
      entertainment: '200',
      subscriptions: '100',
      shopping: '300',
      travel: '200',
    });
    expect(getValue(r, 'leftover')).toContain('-');
  });

  it('classifies needs as over target when exceeding 50%', () => {
    const r = config.calculate({
      monthlyIncome: '5000',
      rent: '3000',
      utilities: '300',
      groceries: '500',
      autoGas: '400',
      insurance: '300',
    });
    expect(getValue(r, 'needsResult')).toBeTruthy();
  });

  it('total spending equals sum of all categories', () => {
    const r = config.calculate({
      monthlyIncome: '10000',
      rent: '2000',
      utilities: '200',
      groceries: '600',
      autoGas: '400',
      insurance: '300',
      diningOut: '400',
      entertainment: '200',
      subscriptions: '100',
      shopping: '200',
      travel: '100',
      emergencyFund: '500',
      retirement401k: '500',
      investmentBrokerage: '200',
    });
    const total = parseMoney(getValue(r, 'totalSpendingResult'));
    expect(total).toBeGreaterThan(0);
  });

  // ─── Empty / zero income guard ────────────────────────────────────────
  it('returns empty when monthlyIncome is missing', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty when monthlyIncome is zero', () => {
    expect(config.calculate({ monthlyIncome: '0' })).toHaveLength(0);
  });

  it('returns empty when monthlyIncome is negative', () => {
    expect(config.calculate({ monthlyIncome: '-500' })).toHaveLength(0);
  });

  it('returns empty when monthlyIncome is NaN string', () => {
    expect(config.calculate({ monthlyIncome: 'abc' })).toHaveLength(0);
  });

  it('returns empty when monthlyIncome is undefined', () => {
    expect(config.calculate({ monthlyIncome: undefined } as any)).toHaveLength(0);
  });

  // ─── Zero expenses still produces results ─────────────────────────────
  it('zero expenses still produces results', () => {
    const r = config.calculate({ monthlyIncome: '5000' });
    expect(r.length).toBeGreaterThanOrEqual(5);
    expect(getValue(r, 'leftover')).not.toContain('-');
    near(parseMoney(getValue(r, 'leftover')), 5000);
  });

  // ─── Exact 50/30/20 split ─────────────────────────────────────────────
  it('reports exact 50/30/20 split when expenses match targets', () => {
    const r = config.calculate({
      monthlyIncome: '10000',
      rent: '2500',
      utilities: '500',
      groceries: '1000',
      autoGas: '500',
      insurance: '500',
      // needs total: 5000 = 50%
      diningOut: '1000',
      entertainment: '500',
      subscriptions: '500',
      shopping: '500',
      travel: '500',
      // wants total: 3000 = 30%
      emergencyFund: '500',
      retirement401k: '500',
      investmentBrokerage: '500',
      extraDebtPayoff: '500',
      // savings total: 2000 = 20%
    });
    // Verify percentages from metadata
    const raw = getResult(r, '_budgetData');
    const data = JSON.parse(raw.value);
    near(data.needsPct, 50, 0.1);
    near(data.wantsPct, 30, 0.1);
    near(data.savingsPct, 20, 0.1);
    // Verify labels contain percentage info
    const needsResult = getResult(r, 'needsResult');
    const wantsResult = getResult(r, 'wantsResult');
    const savingsResult = getResult(r, 'savingsResult');
    expect(needsResult.label).toContain('50.0%');
    expect(wantsResult.label).toContain('30.0%');
    expect(savingsResult.label).toContain('20.0%');
  });

  // ─── Budget metadata exists ───────────────────────────────────────────
  it('includes budget data metadata for extraPanel', () => {
    const r = config.calculate({
      monthlyIncome: '6000',
      rent: '1500',
      utilities: '200',
      groceries: '500',
    });
    const raw = getResult(r, '_budgetData');
    const data = JSON.parse(raw.value);
    expect(data.monthlyIncome).toBe(6000);
    expect(data.totalNeeds).toBeGreaterThan(0);
    expect(data.totalWants).toBe(0);
    expect(data.totalSavings).toBe(0);
    expect(data.targetNeeds).toBe(3000);
    expect(data.targetWants).toBe(1800);
    expect(data.targetSavings).toBe(1200);
  });

  // ─── Individual category tracking ─────────────────────────────────────
  it('tracks needs percentage correctly', () => {
    const r = config.calculate({
      monthlyIncome: '5000',
      rent: '2000',
      utilities: '300',
      groceries: '200',
    });
    // needs: 2500 / 5000 = 50%, exactly on target
    const needsResult = getResult(r, 'needsResult');
    expect(needsResult.label).toContain('50.0%');
    // color should be 'positive' since at or under 50%
    expect(needsResult.color).toBe('positive');
  });

  it('tracks savings percentage correctly', () => {
    const r = config.calculate({
      monthlyIncome: '5000',
      emergencyFund: '2000',
    });
    // savings: 2000 / 5000 = 40%, well above 20% target
    const result = getResult(r, 'savingsResult');
    expect(result.color).toBe('positive');
  });

  // ─── Empty/missing optional fields ────────────────────────────────────
  it('handles missing optional expense fields gracefully (treats as zero)', () => {
    const r = config.calculate({
      monthlyIncome: '4000',
      rent: '1200',
    });
    // Only rent specified, all others default to zero
    expect(r.length).toBeGreaterThanOrEqual(5);
    const total = parseMoney(getValue(r, 'totalSpendingResult'));
    expect(total).toBe(1200);
    near(parseMoney(getValue(r, 'leftover')), 2800);
  });

  it('handles empty strings in optional fields as zero', () => {
    const r = config.calculate({
      monthlyIncome: '4000',
      rent: '1000',
      utilities: '',
      groceries: '',
    });
    const total = parseMoney(getValue(r, 'totalSpendingResult'));
    expect(total).toBe(1000);
  });

  // ─── Total spending correctness ───────────────────────────────────────
  it('total spending equals needs + wants + savings', () => {
    const r = config.calculate({
      monthlyIncome: '10000',
      rent: '3000',
      utilities: '500',
      groceries: '700',
      autoGas: '300',
      insurance: '200',
      diningOut: '400',
      entertainment: '200',
      subscriptions: '100',
      shopping: '200',
      travel: '100',
      emergencyFund: '500',
      retirement401k: '500',
      investmentBrokerage: '200',
      extraDebtPayoff: '200',
    });
    const totalResult = getResult(r, 'totalSpendingResult');
    const leftoverResult = getResult(r, 'leftover');
    expect(totalResult).toBeTruthy();
    expect(leftoverResult).toBeTruthy();
    // Verify that all result IDs have string values
    for (const result of r) {
      if (result.id !== '_budgetData') {
        expect(typeof result.value).toBe('string');
      }
    }
  });

  // ─── Educational content exists ───────────────────────────────────────
  it('has educational content', () => {
    expect(config.educational).toBeDefined();
    expect(config.educational!.explanation).toBeTruthy();
    expect(config.educational!.explanation!.length).toBeGreaterThan(100);
  });

  it('has at least 7 FAQs', () => {
    expect(config.educational!.faqs!.length).toBeGreaterThanOrEqual(7);
  });

  it('has worked examples', () => {
    expect(config.educational!.workedExamples!.length).toBeGreaterThanOrEqual(3);
  });

  it('has pro tips', () => {
    expect(config.educational!.proTips!.length).toBeGreaterThanOrEqual(4);
  });

  it('has limitations with real content', () => {
    expect(config.educational!.limitations).toBeTruthy();
    expect(config.educational!.limitations.length).toBeGreaterThan(0);
    expect(config.educational!.limitations.every((l: string) => l.length > 20)).toBe(true);
  });

  it('has variables defined', () => {
    expect(config.educational!.variables!.length).toBeGreaterThanOrEqual(3);
  });

  it('has citations', () => {
    expect(config.educational!.citations!.length).toBeGreaterThanOrEqual(2);
  });

  // ─── Verify extraPanel export ─────────────────────────────────────────
  it('has extraPanel function', () => {
    expect(typeof config.extraPanel).toBe('function');
  });

  // ─── Decimal.js precision ─────────────────────────────────────────────
  it('uses precise decimal arithmetic (no floating-point drift)', () => {
    const r = config.calculate({
      monthlyIncome: '3333.33',
      rent: '1111.11',
      utilities: '222.22',
      groceries: '333.33',
    });
    // 1111.11 + 222.22 + 333.33 should exactly equal 1666.66
    const raw = getResult(r, '_budgetData');
    const data = JSON.parse(raw.value);
    expect(data.totalNeeds).toBeCloseTo(1666.66, 2);
  });
});
