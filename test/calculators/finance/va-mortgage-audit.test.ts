import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/va-mortgage/index';
import { getValue, parseMoney, near } from '../../helpers';

// VA funding fee table (va.gov, purchase loans since April 2023): first use <5% down 2.15%, subsequent 3.30%,
// 5%-<10% 1.50%, 10%+ 1.25%. Fee is on the base loan; P&I via the level-payment formula.
const common = { loanTerm: '30', vaUseType: 'first', fundingFeeExempt: 'no', fundingFeePaidUpfront: 'rolled' };

describe('va-mortgage audit', () => {
  it('funding fee table: every tier boundary', () => {
    const fee = (pct: number, use: string) => {
      const r = config.calculate({ ...common, vaUseType: use, homePrice: '100000', downPaymentType: 'percent', downPaymentValue: String(pct), interestRate: '6' });
      return parseMoney(getValue(r, 'fundingFeeResult')) / (100000 * (1 - pct / 100));
    };
    near(fee(0, 'first'), 0.0215, 1e-6);
    near(fee(4.99, 'first'), 0.0215, 1e-6);
    near(fee(5, 'first'), 0.015, 1e-6);
    near(fee(9.99, 'subsequent'), 0.015, 1e-6);
    near(fee(10, 'first'), 0.0125, 1e-6);
    near(fee(0, 'subsequent'), 0.033, 1e-6);
    near(fee(4.99, 'subsequent'), 0.033, 1e-6);
  });

  it('worked example Michael: 350,000, 0% down, 6.25% -> loan 357,525, P&I 2,201.34, total 2,651.34', () => {
    // 350,000 x 1.0215 = 357,525 ; i = 0.0625/12 ; PMT = L i / (1 - (1+i)^-360)
    const r = config.calculate({ ...common, homePrice: '350000', downPaymentType: 'dollar', downPaymentValue: '0', interestRate: '6.25', annualPropertyTax: '4200', annualInsurance: '1200', monthlyHOA: '0' });
    near(parseMoney(getValue(r, 'totalLoanAmountResult')), 357525, 0.01);
    near(parseMoney(getValue(r, 'principalAndInterest')), 2201.34, 0.01);
    near(parseMoney(getValue(r, 'totalMonthlyPayment')), 2651.34, 0.01);
  });

  it('worked example Sarah: exempt, 10% down vs 0% down at 6% -> 3,572.98 vs 3,872.75 (about 300 apart)', () => {
    const base = { ...common, homePrice: '500000', interestRate: '6', fundingFeeExempt: 'yes', annualPropertyTax: '6000', annualInsurance: '1500', monthlyHOA: '250' };
    const ten = config.calculate({ ...base, downPaymentType: 'percent', downPaymentValue: '10' });
    const zero = config.calculate({ ...base, downPaymentType: 'percent', downPaymentValue: '0' });
    near(parseMoney(getValue(ten, 'totalMonthlyPayment')), 3572.98, 0.01);
    near(parseMoney(getValue(zero, 'totalMonthlyPayment')), 3872.75, 0.01);
    expect(getValue(ten, 'fundingFeeResult')).toBe('$0.00');
  });

  it('worked example James: subsequent use, 5% down on 275,000 -> fee 1.5% of 261,250, total 2,117.71; saves 5,156.25 vs 0% down', () => {
    const r = config.calculate({ ...common, vaUseType: 'subsequent', homePrice: '275000', downPaymentType: 'percent', downPaymentValue: '5', interestRate: '6.5', annualPropertyTax: '3300', annualInsurance: '1100', monthlyHOA: '75' });
    near(parseMoney(getValue(r, 'fundingFeeResult')), 3918.75, 0.01);
    near(parseMoney(getValue(r, 'totalMonthlyPayment')), 2117.71, 0.01);
    near(275000 * 0.033 - 3918.75, 5156.25, 0.01);
  });

  it('paying the fee in cash leaves the loan at the base amount', () => {
    const r = config.calculate({ ...common, homePrice: '300000', downPaymentType: 'dollar', downPaymentValue: '0', interestRate: '6', fundingFeePaidUpfront: 'upfront' });
    near(parseMoney(getValue(r, 'totalLoanAmountResult')), 300000, 0.01);
  });

  it('a down payment at or above the price is rejected (regression: negative loan amount)', () => {
    expect(config.calculate({ ...common, homePrice: '300000', downPaymentType: 'dollar', downPaymentValue: '300000', interestRate: '6' })).toEqual([]);
    expect(config.calculate({ ...common, homePrice: '300000', downPaymentType: 'percent', downPaymentValue: '100', interestRate: '6' })).toEqual([]);
  });

  it('zero rate amortizes straight-line', () => {
    const r = config.calculate({ ...common, homePrice: '360000', downPaymentType: 'dollar', downPaymentValue: '0', interestRate: '0', fundingFeeExempt: 'yes' });
    near(parseMoney(getValue(r, 'principalAndInterest')), 1000, 0.01);
  });
});
