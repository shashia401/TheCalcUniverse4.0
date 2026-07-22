import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/va-mortgage/index';
import { getValue, parseMoney, parseNumber, near, pmtFormula } from '../../helpers';

describe('va-mortgage', () => {
  it('0% down first-time use, funding fee rolled in', () => {
    const r = config.calculate({
      homePrice: '400000',
      downPaymentType: 'dollar',
      downPaymentValue: '0',
      loanTerm: '30',
      interestRate: '6.75',
      vaUseType: 'first',
      fundingFeeExempt: 'no',
      fundingFeePaidUpfront: 'rolled',
      annualPropertyTax: '4800',
      annualInsurance: '1800',
      monthlyHOA: '0',
    });
    // Base loan = 400000
    // Funding fee = 400000 * 0.0215 = 8600
    // Total loan = 408600
    const totalLoan = 408600;
    const expectedPI = pmtFormula(totalLoan, 6.75, 360);
    near(parseMoney(getValue(r, 'principalAndInterest')), expectedPI, 0.1);
    // Monthly tax = 4800/12 = 400
    // Monthly insurance = 1800/12 = 150
    const totalMonthly = expectedPI + 400 + 150;
    near(parseMoney(getValue(r, 'totalMonthlyPayment')), totalMonthly, 0.5);
    near(parseMoney(getValue(r, 'monthlyTaxResult')), 400);
    near(parseMoney(getValue(r, 'monthlyInsuranceResult')), 150);
    near(parseMoney(getValue(r, 'totalLoanAmountResult')), totalLoan);
  });

  it('funding fee exemption (disabled veteran)', () => {
    const r = config.calculate({
      homePrice: '400000',
      downPaymentType: 'dollar',
      downPaymentValue: '0',
      loanTerm: '30',
      interestRate: '6.75',
      vaUseType: 'first',
      fundingFeeExempt: 'yes',
      fundingFeePaidUpfront: 'rolled',
      annualPropertyTax: '4800',
      annualInsurance: '1800',
      monthlyHOA: '0',
    });
    // No funding fee, total loan = 400000
    const expectedPI = pmtFormula(400000, 6.75, 360);
    near(parseMoney(getValue(r, 'principalAndInterest')), expectedPI, 0.1);
    near(parseMoney(getValue(r, 'fundingFeeResult')), 0);
    expect(getValue(r, 'fundingFeeResult')).toContain('$0');
    near(parseMoney(getValue(r, 'totalLoanAmountResult')), 400000);
  });

  it('subsequent use with 0% down = 3.30% funding fee', () => {
    const r = config.calculate({
      homePrice: '300000',
      downPaymentType: 'dollar',
      downPaymentValue: '0',
      loanTerm: '30',
      interestRate: '6.5',
      vaUseType: 'subsequent',
      fundingFeeExempt: 'no',
      fundingFeePaidUpfront: 'rolled',
    });
    // Fee = 300000 * 0.033 = 9900
    near(parseMoney(getValue(r, 'fundingFeeResult')), 9900);
    const totalLoan = 309900;
    near(parseMoney(getValue(r, 'totalLoanAmountResult')), totalLoan);
    const expectedPI = pmtFormula(totalLoan, 6.5, 360);
    near(parseMoney(getValue(r, 'principalAndInterest')), expectedPI, 0.1);
  });

  it('10%+ down reduces fee to 1.25%', () => {
    const r = config.calculate({
      homePrice: '400000',
      downPaymentType: 'percent',
      downPaymentValue: '10',
      loanTerm: '30',
      interestRate: '6.75',
      vaUseType: 'first',
      fundingFeeExempt: 'no',
      fundingFeePaidUpfront: 'rolled',
    });
    // Down payment = 40000
    // Base loan = 360000
    // Fee = 360000 * 0.0125 = 4500
    near(parseMoney(getValue(r, 'fundingFeeResult')), 4500);
    near(parseMoney(getValue(r, 'totalLoanAmountResult')), 364500);
  });

  it('5-9.99% down reduces fee to 1.50%', () => {
    const r = config.calculate({
      homePrice: '400000',
      downPaymentType: 'percent',
      downPaymentValue: '5',
      loanTerm: '30',
      interestRate: '6.75',
      vaUseType: 'first',
      fundingFeeExempt: 'no',
      fundingFeePaidUpfront: 'rolled',
    });
    // Down = 20000, base = 380000
    // Fee = 380000 * 0.015 = 5700
    near(parseMoney(getValue(r, 'fundingFeeResult')), 5700);
    near(parseMoney(getValue(r, 'totalLoanAmountResult')), 385700);
  });

  it('funding fee paid upfront (not rolled in)', () => {
    const r = config.calculate({
      homePrice: '400000',
      downPaymentType: 'dollar',
      downPaymentValue: '0',
      loanTerm: '30',
      interestRate: '6.75',
      vaUseType: 'first',
      fundingFeeExempt: 'no',
      fundingFeePaidUpfront: 'upfront',
    });
    // Fee = 8600, but NOT rolled in
    // totalLoan = 400000 (only base)
    near(parseMoney(getValue(r, 'totalLoanAmountResult')), 400000);
    const expectedPI = pmtFormula(400000, 6.75, 360);
    near(parseMoney(getValue(r, 'principalAndInterest')), expectedPI, 0.1);
  });

  it('15-year term produces higher payment but lower total interest', () => {
    const r30 = config.calculate({
      homePrice: '300000', downPaymentType: 'dollar', downPaymentValue: '0',
      loanTerm: '30', interestRate: '6.5', vaUseType: 'first',
      fundingFeeExempt: 'no', fundingFeePaidUpfront: 'rolled',
    });
    const r15 = config.calculate({
      homePrice: '300000', downPaymentType: 'dollar', downPaymentValue: '0',
      loanTerm: '15', interestRate: '6.5', vaUseType: 'first',
      fundingFeeExempt: 'no', fundingFeePaidUpfront: 'rolled',
    });
    // 15-year P&I should be higher than 30-year
    const pi30 = parseMoney(getValue(r30, 'principalAndInterest'));
    const pi15 = parseMoney(getValue(r15, 'principalAndInterest'));
    expect(pi15).toBeGreaterThan(pi30);
  });

  it('15-year: same funding fee logic as 30-year', () => {
    const r = config.calculate({
      homePrice: '300000',
      downPaymentType: 'dollar',
      downPaymentValue: '0',
      loanTerm: '15',
      interestRate: '6.5',
      vaUseType: 'first',
      fundingFeeExempt: 'no',
      fundingFeePaidUpfront: 'rolled',
    });
    // Fee = 300000 * 0.0215 = 6450
    near(parseMoney(getValue(r, 'fundingFeeResult')), 6450);
  });

  it('zero interest rate handling', () => {
    const r = config.calculate({
      homePrice: '120000',
      downPaymentType: 'dollar',
      downPaymentValue: '0',
      loanTerm: '30',
      interestRate: '0',
      vaUseType: 'first',
      fundingFeeExempt: 'yes',
    });
    // 120000 / 360 = 333.33
    near(parseMoney(getValue(r, 'principalAndInterest')), 120000 / 360, 0.01);
  });

  it('no PMI on VA loans', () => {
    const r = config.calculate({
      homePrice: '400000',
      downPaymentType: 'dollar',
      downPaymentValue: '0',
      loanTerm: '30',
      interestRate: '6.75',
      vaUseType: 'first',
      fundingFeeExempt: 'no',
    });
    expect(getValue(r, 'noPMINote')).toContain('$0.00');
  });

  it('includes HOA in total monthly', () => {
    const r = config.calculate({
      homePrice: '400000',
      downPaymentType: 'dollar',
      downPaymentValue: '0',
      loanTerm: '30',
      interestRate: '6.75',
      vaUseType: 'first',
      fundingFeeExempt: 'yes',
      annualPropertyTax: '0',
      annualInsurance: '0',
      monthlyHOA: '250',
    });
    const pi = parseMoney(getValue(r, 'principalAndInterest'));
    near(parseMoney(getValue(r, 'totalMonthlyPayment')), pi + 250, 0.1);
  });

  it('returns empty for empty inputs', () => {
    const r = config.calculate({});
    expect(r).toHaveLength(0);
  });

  it('returns empty for zero home price', () => {
    const r = config.calculate({
      homePrice: '0',
      interestRate: '6.75',
      loanTerm: '30',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for missing home price', () => {
    const r = config.calculate({
      homePrice: '',
      interestRate: '6.75',
      loanTerm: '30',
    });
    expect(r).toHaveLength(0);
  });

  it('handles NaN on all numeric inputs gracefully', () => {
    const r = config.calculate({
      homePrice: '400000',
      downPaymentType: 'dollar',
      downPaymentValue: 'abc', // NaN becomes 0 via || 0
      loanTerm: '30',
      interestRate: '6.75',
      vaUseType: 'first',
      fundingFeeExempt: 'no',
      fundingFeePaidUpfront: 'rolled',
      annualPropertyTax: 'xyz', // NaN becomes 0
      annualInsurance: '---', // NaN becomes 0
      monthlyHOA: 'nope', // NaN becomes 0
    });
    // Should not crash — all NaN parseFloat values fall back to 0
    expect(r.length).toBeGreaterThan(0);
    // Down payment of 0 means base loan = 400000
    near(parseMoney(getValue(r, 'totalLoanAmountResult')), 408600);
  });

  it('has 7+ FAQs', () => {
    const faqs = config.educational?.faqs;
    expect(faqs).toBeDefined();
    expect(faqs!.length).toBeGreaterThanOrEqual(7);
  });

  it('has 3+ worked examples with scenario, inputs, result, insight', () => {
    const examples = config.educational?.workedExamples;
    expect(examples).toBeDefined();
    expect(examples!.length).toBeGreaterThanOrEqual(3);
    for (const ex of examples!) {
      expect(ex.scenario).toBeTruthy();
      expect(Object.keys(ex.inputs).length).toBeGreaterThan(0);
      expect(ex.result).toBeTruthy();
      expect(ex.insight).toBeTruthy();
    }
  });

  it('has 4+ pro tips', () => {
    const tips = config.educational?.proTips;
    expect(tips).toBeDefined();
    expect(tips!.length).toBeGreaterThanOrEqual(4);
  });

  it('has 3+ limitations', () => {
    const limits = config.educational?.limitations;
    expect(limits).toBeDefined();
    expect(limits!.length).toBeGreaterThanOrEqual(3);
  });

  it('explanation is 350+ words', () => {
    const text = config.educational?.explanation;
    expect(text).toBeDefined();
    const wordCount = text!.split(/\s+/).filter(Boolean).length;
    expect(wordCount).toBeGreaterThanOrEqual(350);
  });

  it('all inputs have helpText', () => {
    const inputs = config.inputs;
    for (const inp of inputs) {
      expect(inp.helpText).toBeTruthy();
    }
  });
});
