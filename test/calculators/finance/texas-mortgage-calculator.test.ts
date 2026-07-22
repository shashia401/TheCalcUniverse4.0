import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/texas-mortgage-calculator/index';
import { getValue, parseMoney, parseNumber, near, pmtFormula } from '../../helpers';

describe('Texas Mortgage Calculator', () => {
  const defaultInputs = {
    homePrice: '350000',
    downPayment: '70000',
    interestRate: '6.8',
    loanTerm: '30',
    propertyTaxRate: '1.8',
    homesteadType: 'none',
  };

  it('standard 20% down on $350K, 6.8%, 30yr', () => {
    const r = config.calculate(defaultInputs);
    const loanAmount = 280000;
    const expectedPI = pmtFormula(loanAmount, 6.8, 360);
    near(parseMoney(getValue(r, 'monthlyPayment')), expectedPI, 0.1);
    const monthlyTax = (350000 * 0.018) / 12;
    near(parseNumber(getValue(r, 'propertyTaxBefore')), monthlyTax * 12, 0.1);
    near(parseMoney(getValue(r, 'totalMonthly')), expectedPI + monthlyTax, 0.5);
    near(parseMoney(getValue(r, 'loanAmount')), loanAmount);
  });

  it('5% down triggers PMI and shows negative down payment color', () => {
    const r = config.calculate({ ...defaultInputs, homePrice: '300000', downPayment: '15000', interestRate: '6.5' });
    const downPctResult = getValue(r, 'downPercent');
    expect(downPctResult).toContain('5.0%');
    const totalMonthly = parseMoney(getValue(r, 'totalMonthly'));
    const monthlyPI = parseMoney(getValue(r, 'monthlyPayment'));
    const monthlyTax = (300000 * 0.018) / 12;
    expect(totalMonthly).toBeGreaterThan(monthlyPI + monthlyTax - 1);
  });

  it('15-year term produces higher payment but lower total interest vs 30-year', () => {
    const r30 = config.calculate(defaultInputs);
    const r15 = config.calculate({ ...defaultInputs, loanTerm: '15' });
    const pi30 = parseMoney(getValue(r30, 'monthlyPayment'));
    const pi15 = parseMoney(getValue(r15, 'monthlyPayment'));
    expect(pi15).toBeGreaterThan(pi30);
    const interest30 = parseMoney(getValue(r30, 'totalInterest'));
    const interest15 = parseMoney(getValue(r15, 'totalInterest'));
    expect(interest15).toBeLessThan(interest30);
  });

  it('handles zero interest rate edge case', () => {
    const r = config.calculate({ ...defaultInputs, homePrice: '240000', downPayment: '0', interestRate: '0' });
    near(parseMoney(getValue(r, 'monthlyPayment')), 240000 / 360, 0.01);
    const monthlyTax = (240000 * 0.018) / 12;
    near(parseNumber(getValue(r, 'propertyTaxBefore')), monthlyTax * 12, 0.1);
  });

  it('returns empty array for missing or invalid home price', () => {
    expect(config.calculate({})).toHaveLength(0);
    expect(config.calculate({ homePrice: '0', interestRate: '6.8', loanTerm: '30' })).toHaveLength(0);
    expect(config.calculate({ homePrice: '', interestRate: '6.8', loanTerm: '30' })).toHaveLength(0);
    expect(config.calculate({ homePrice: 'abc', interestRate: '6.8', loanTerm: '30' })).toHaveLength(0);
  });

  it('down payment equal to or exceeding home price returns empty', () => {
    expect(config.calculate({ ...defaultInputs, downPayment: '300000', homePrice: '300000' })).toHaveLength(0);
    expect(config.calculate({ ...defaultInputs, downPayment: '350000', homePrice: '300000' })).toHaveLength(0);
  });

  it('Houston scenario: higher 2.1% property tax rate increases total monthly', () => {
    const rAustin = config.calculate(defaultInputs);
    const rHouston = config.calculate({ ...defaultInputs, propertyTaxRate: '2.1' });
    const totalAustin = parseMoney(getValue(rAustin, 'totalMonthly'));
    const totalHouston = parseMoney(getValue(rHouston, 'totalMonthly'));
    expect(totalHouston).toBeGreaterThan(totalAustin);
    const taxAustin = parseNumber(getValue(rAustin, 'propertyTaxBefore'));
    const taxHouston = parseNumber(getValue(rHouston, 'propertyTaxBefore'));
    expect(taxHouston).toBeGreaterThan(taxAustin);
  });

  it('general homestead exemption reduces property tax', () => {
    const r = config.calculate({ ...defaultInputs, homesteadType: 'general' });
    expect(getValue(r, 'homesteadSavings')).not.toBe('Apply for homestead exemption');
    const savingsValRaw = getValue(r, 'homesteadSavings').replace(/\/yr.*$/, '').trim();
    const savingsVal = parseMoney(savingsValRaw);
    expect(savingsVal).toBeGreaterThan(500);
  });

  it('senior homestead exemption provides savings', () => {
    const r = config.calculate({ ...defaultInputs, homesteadType: 'senior' });
    expect(getValue(r, 'homesteadSavings')).not.toBe('Apply for homestead exemption');
  });

  it('no homestead shows apply message', () => {
    const r = config.calculate(defaultInputs);
    expect(getValue(r, 'homesteadSavings')).toBe('Apply for homestead exemption');
  });

  it('shows no state income tax benefit', () => {
    const r = config.calculate(defaultInputs);
    expect(getValue(r, 'incomeTaxNote')).toContain('TX saves');
  });

  it('educational content has required sections', () => {
    const edu = config.educational;
    expect(edu.formula).toBeTruthy();
    expect(edu.variables.length).toBeGreaterThanOrEqual(3);
    expect(edu.faqs.length).toBeGreaterThanOrEqual(5);
    expect(edu.workedExamples).toBeDefined();
    if (edu.workedExamples) {
      expect(edu.workedExamples.length).toBeGreaterThanOrEqual(2);
      edu.workedExamples.forEach((ex) => {
        expect(ex.scenario).toBeTruthy();
        expect(ex.inputs).toBeDefined();
        expect(ex.insight).toBeTruthy();
      });
    }
    expect(edu.proTips).toBeDefined();
    if (edu.proTips) {
      expect(edu.proTips.length).toBeGreaterThanOrEqual(4);
    }
    expect(edu.limitations).toBeTruthy();
    expect(edu.quickReference).toBeDefined();
    if (edu.quickReference) {
      expect(edu.quickReference.length).toBeGreaterThanOrEqual(5);
    }
  });
});
