import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/self-employment-tax/index';
import { getValue, parseMoney, near } from '../../helpers';

describe('self-employment-tax', () => {
  it('calculates SECA tax correctly for $100K net profit', () => {
    const r = config.calculate({
      netProfit: '100000',
      w2Income: '0',
      qbiDeduction: 'no',
    });

    const seEarnings = 100000 * 0.9235; // 92,350
    // SS: min(92350, 176100) * 12.4% = 92350 * 0.124 = 11,451.40
    const ssExpected = 92350 * 0.124;
    // Medicare: 92350 * 2.9% = 2,678.15
    const medExpected = 92350 * 0.029;
    // Total: 11,451.40 + 2,678.15 = 14,129.55
    const totalExpected = ssExpected + medExpected;

    near(parseMoney(getValue(r, 'secaTax')), totalExpected, 0.01);
    near(parseMoney(getValue(r, 'socialSecurityPortion')), ssExpected, 0.01);
    near(parseMoney(getValue(r, 'medicarePortion')), medExpected, 0.01);
    near(parseMoney(getValue(r, 'deductiblePortion')), totalExpected / 2, 0.01);

    // Effective rate = 14129.55 / 100000 * 100 = 14.12955%
    expect(parseFloat(getValue(r, 'effectiveRate'))).toBeCloseTo(14.13, 1);
  });

  it('accounts for W-2 wages reducing SS wage base', () => {
    const r = config.calculate({
      netProfit: '100000',
      w2Income: '100000',
      qbiDeduction: 'no',
    });

    // Remaining SS wage base = 176100 - 100000 = 76100
    // SS on min(92350, 76100) * 12.4% = 76100 * 0.124 = 9,436.40
    const ssExpected = 76100 * 0.124;
    near(parseMoney(getValue(r, 'socialSecurityPortion')), ssExpected, 0.01);
  });

  it('applies QBI savings when enabled', () => {
    const r = config.calculate({
      netProfit: '100000',
      w2Income: '0',
      qbiDeduction: 'yes',
    });

    // QBI savings = 100000 * 0.20 * 0.22 = 4,400
    near(parseMoney(getValue(r, 'qbiSavings')), 4400, 0.01);
  });

  it('returns zero QBI savings when disabled', () => {
    const r = config.calculate({
      netProfit: '100000',
      w2Income: '0',
      qbiDeduction: 'no',
    });

    expect(getValue(r, 'qbiSavings')).toContain('$0.00');
  });

  it('returns empty for zero net profit', () => {
    const r = config.calculate({
      netProfit: '0',
      w2Income: '0',
      qbiDeduction: 'no',
    });
    expect(r).toEqual([]);
  });

  it('handles W-2 wages exceeding SS wage base (no SS on SE income)', () => {
    const r = config.calculate({
      netProfit: '50000',
      w2Income: '200000',
      qbiDeduction: 'no',
    });

    // Remaining SS base = max(0, 176100 - 200000) = 0
    near(parseMoney(getValue(r, 'socialSecurityPortion')), 0, 0.01);

    // Medicare still applies: 50000 * 0.9235 * 0.029 = 1,339.075
    near(parseMoney(getValue(r, 'medicarePortion')), 50000 * 0.9235 * 0.029, 0.01);
  });

  it('shows total combined income', () => {
    const r = config.calculate({
      netProfit: '75000',
      w2Income: '50000',
      qbiDeduction: 'no',
    });

    near(parseMoney(getValue(r, 'totalIncome')), 125000, 0.01);
  });
});
