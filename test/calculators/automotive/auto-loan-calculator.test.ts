import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/automotive/auto-loan/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('auto-loan', () => {
  it('calculates a basic 60-month loan with down payment and trade-in', () => {
    const r = config.calculate({
      vehiclePrice: '35000',
      loanTerm: '60',
      interestRate: '6.9',
      downPayment: '5000',
      tradeInValue: '8000',
      tradeInOwed: '5000',
      salesTaxPct: '8',
      titleRegFees: '500',
    });
    expect(r).toHaveLength(7);

    // Net trade-in = 8000 - 5000 = +3000 (positive equity)
    // Sales-tax credit is for the trade-in VALUE (allowance), not just the equity: taxable = 35000 - 8000 = 27000
    // Sales tax = 27000 * 0.08 = 2160
    // Out-the-door = 35000 + 2160 + 500 = 37660
    // Loan amount = 37660 - 5000 - 3000 = 29660
    // Monthly payment on $29660 @ 6.9% / 60mo = 585.91 (closed-form PMT)
    near(parseNumber(getValue(r, 'outTheDoor')), 37660);
    near(parseNumber(getValue(r, 'totalFinanced')), 29660);
    near(parseNumber(getValue(r, 'monthlyPayment')), 585.91, 0.01);
    near(parseNumber(getValue(r, 'totalInterest')), 5494.31, 0.05);
    near(parseNumber(getValue(r, 'totalCost')), 43154.31, 0.05);
    expect(getValue(r, 'salesTaxLine')).toContain('2,160.00');
    expect(getValue(r, 'feesLine')).toContain('500');
  });

  it('handles 0% APR correctly', () => {
    const r = config.calculate({
      vehiclePrice: '35000',
      loanTerm: '60',
      interestRate: '0',
      downPayment: '0',
      salesTaxPct: '0',
      titleRegFees: '0',
    });
    expect(r).toHaveLength(7);

    // Loan amount = 35000
    // Monthly payment = 35000 / 60 = 583.33
    // Total interest = 0
    near(parseNumber(getValue(r, 'monthlyPayment')), 583.33, 0.5);
    near(parseNumber(getValue(r, 'totalFinanced')), 35000);
    near(parseNumber(getValue(r, 'totalInterest')), 0);
    near(parseNumber(getValue(r, 'totalCost')), 35000);
  });

  it('handles different loan terms (36 months)', () => {
    const r = config.calculate({
      vehiclePrice: '35000',
      loanTerm: '36',
      interestRate: '6.9',
      downPayment: '0',
      salesTaxPct: '0',
      titleRegFees: '0',
    });
    expect(r).toHaveLength(7);

    // Monthly payment on $35000 @ 6.9% / 36mo ≈ 1079.12
    near(parseNumber(getValue(r, 'monthlyPayment')), 1079.12, 1);
    near(parseNumber(getValue(r, 'totalFinanced')), 35000);
  });

  it('handles down payment reducing loan amount', () => {
    const r = config.calculate({
      vehiclePrice: '35000',
      loanTerm: '60',
      interestRate: '6.9',
      downPayment: '10000',
      salesTaxPct: '0',
      titleRegFees: '0',
    });
    expect(r).toHaveLength(7);

    // Loan amount = 35000 - 10000 = 25000
    near(parseNumber(getValue(r, 'totalFinanced')), 25000);
    near(parseNumber(getValue(r, 'monthlyPayment')), 493.83, 1);
  });

  it('handles negative equity rolled into loan', () => {
    const r = config.calculate({
      vehiclePrice: '35000',
      loanTerm: '60',
      interestRate: '6.9',
      downPayment: '0',
      tradeInValue: '8000',
      tradeInOwed: '10000',
      salesTaxPct: '0',
      titleRegFees: '0',
    });
    // 7 standard results + 1 negative equity result = 8
    expect(r.length).toBeGreaterThanOrEqual(7);

    // Net trade-in = 8000 - 10000 = -2000
    // Negative equity = 2000
    // Loan amount = 35000 + 2000 = 37000
    near(parseNumber(getValue(r, 'totalFinanced')), 37000);
    expect(getValue(r, 'negativeEquity')).toContain('2,000.00');
  });

  it('returns paid status when cash/trade covers full price', () => {
    const r = config.calculate({
      vehiclePrice: '35000',
      loanTerm: '60',
      interestRate: '5',
      downPayment: '35000',
      salesTaxPct: '0',
      titleRegFees: '0',
    });
    expect(r).toHaveLength(1);
    expect(getValue(r, 'paid')).toContain('No loan needed');
  });

  it('returns empty for zero price', () => {
    const r = config.calculate({
      vehiclePrice: '0',
      loanTerm: '60',
      interestRate: '6.9',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for empty inputs', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty for missing interest rate', () => {
    const r = config.calculate({
      vehiclePrice: '35000',
      loanTerm: '60',
    });
    expect(r).toHaveLength(0);
  });

  it('handles sales tax correctly with trade-in credit', () => {
    const r = config.calculate({
      vehiclePrice: '40000',
      loanTerm: '60',
      interestRate: '5',
      downPayment: '0',
      tradeInValue: '10000',
      tradeInOwed: '0',
      salesTaxPct: '7',
      titleRegFees: '300',
    });
    expect(r).toHaveLength(7);

    // Positive trade-in = 10000
    // Taxable amount = 40000 - 10000 = 30000
    // Sales tax = 30000 * 0.07 = 2100
    // Out-the-door = 40000 + 2100 + 300 = 42400
    // Loan amount = 42400 - 10000 = 32400
    near(parseNumber(getValue(r, 'totalFinanced')), 32400);
    near(parseNumber(getValue(r, 'outTheDoor')), 42400);
    expect(getValue(r, 'salesTaxLine')).toContain('2,100.00');
  });
});
