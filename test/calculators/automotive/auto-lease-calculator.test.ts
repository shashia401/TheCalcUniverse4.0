import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/automotive/lease-calculator/index';

import { getValue, parseNumber, near } from '../../helpers';

describe('lease-calculator', () => {
  it('basic lease: $45K MSRP, $42.5K negotiated, 36 mo, 55% residual, 0.00125 MF, 8.25% tax', () => {
    const r = config.calculate({
      msrp: '45000',
      negotiatedPrice: '42500',
      downPayment: '2000',
      leaseTerm: '36',
      residualValuePct: '55',
      moneyFactor: '0.00125',
      salesTax: '8.25',
    });
    expect(r.length).toBeGreaterThanOrEqual(8);
    // adjustedCapCost = 42500 - 2000 - 0 + 0 = 40500
    // residualValue = 45000 * 0.55 = 24750
    // monthlyDepreciation = (40500 - 24750) / 36 = 437.50
    // monthlyFinanceCharge = (40500 + 24750) * 0.00125 = 81.5625
    // baseMonthlyPayment = 437.50 + 81.5625 = 519.0625
    // monthlyTax = 519.0625 * 0.0825 = 42.82266
    // totalMonthlyPayment = 519.0625 + 42.82266 = 561.88516
    near(parseNumber(getValue(r, 'totalMonthlyPayment')), 561.89, 0.1);
    near(parseNumber(getValue(r, 'baseMonthlyPayment')), 519.06, 0.1);
    near(parseNumber(getValue(r, 'monthlyDepreciationResult')), 437.50, 0.1);
    near(parseNumber(getValue(r, 'monthlyFinanceChargeResult')), 81.56, 0.1);
    // effectiveAPR = 0.00125 * 2400 = 3.00%
    expect(getValue(r, 'effectiveAPRResult')).toContain('3.00');
    // residualValue = 24750
    near(parseNumber(getValue(r, 'residualValueResult')), 24750, 1);
    // totalLeaseCost = 561.88516 * 36 + 2000 = 22227.86
    near(parseNumber(getValue(r, 'totalLeaseCostResult')), 22227.86, 1);
  });

  it('zero down payment lease', () => {
    const r = config.calculate({
      msrp: '30000',
      negotiatedPrice: '28000',
      leaseTerm: '36',
      residualValuePct: '60',
      moneyFactor: '0.00150',
      salesTax: '0',
    });
    expect(r.length).toBeGreaterThanOrEqual(8);
    // adjustedCapCost = 28000 - 0 = 28000
    // residualValue = 30000 * 0.60 = 18000
    // monthlyDepreciation = (28000 - 18000) / 36 = 277.78
    // monthlyFinanceCharge = (28000 + 18000) * 0.00150 = 69.00
    // baseMonthly = 277.78 + 69.00 = 346.78
    // no tax, totalMonthly = 346.78
    near(parseNumber(getValue(r, 'totalMonthlyPayment')), 346.78, 0.1);
    // totalLeaseCost = 346.78 * 36 = 12484.08
    near(parseNumber(getValue(r, 'totalLeaseCostResult')), 12484, 10);
  });

  it('APR input mode matches money factor input', () => {
    const rMf = config.calculate({
      msrp: '35000',
      negotiatedPrice: '33000',
      leaseTerm: '36',
      residualValuePct: '58',
      rateInputType: 'mf',
      moneyFactor: '0.00125',
      salesTax: '0',
    });
    const rApr = config.calculate({
      msrp: '35000',
      negotiatedPrice: '33000',
      leaseTerm: '36',
      residualValuePct: '58',
      rateInputType: 'apr',
      aprRate: '3.0',
      salesTax: '0',
    });
    // Same MF: 0.00125 and APR: 3.0 (3.0/2400 = 0.00125)
    near(
      parseNumber(getValue(rMf, 'totalMonthlyPayment')),
      parseNumber(getValue(rApr, 'totalMonthlyPayment')),
      0.1,
    );
  });

  it('24-month term with trade-in', () => {
    const r = config.calculate({
      msrp: '40000',
      negotiatedPrice: '38000',
      downPayment: '1000',
      tradeInValue: '3000',
      leaseTerm: '24',
      residualValuePct: '65',
      moneyFactor: '0.00100',
      salesTax: '6',
    });
    expect(r.length).toBeGreaterThanOrEqual(8);
    // adjustedCapCost = 38000 - 1000 - 3000 = 34000
    // residualValue = 40000 * 0.65 = 26000
    // monthlyDepreciation = (34000 - 26000) / 24 = 333.33
    // monthlyFinanceCharge = (34000 + 26000) * 0.00100 = 60.00
    // baseMonthly = 393.33
    // tax = 393.33 * 0.06 = 23.60
    // totalMonthly = 416.93
    near(parseNumber(getValue(r, 'totalMonthlyPayment')), 416.93, 0.1);
    // totalLeaseCost = 416.93 * 24 + 1000 + 3000 = 10006.32 + 4000 = 14006.32
    near(parseNumber(getValue(r, 'totalLeaseCostResult')), 14006, 10);
  });

  it('returns empty for missing MSRP', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty for zero MSRP', () => {
    const r = config.calculate({
      msrp: '0',
      negotiatedPrice: '25000',
      residualValuePct: '55',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for zero residual value percent', () => {
    const r = config.calculate({
      msrp: '30000',
      negotiatedPrice: '28000',
      residualValuePct: '0',
    });
    expect(r).toHaveLength(0);
  });
});
