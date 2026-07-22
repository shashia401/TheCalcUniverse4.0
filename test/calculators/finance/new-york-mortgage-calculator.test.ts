import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/new-york-mortgage-calculator/index';
import { getValue, parseMoney, parseNumber, near, pmtFormula } from '../../helpers';

describe('New York Mortgage Calculator', () => {
  const defaultInputs = {
    homePrice: '500000',
    downPayment: '100000',
    interestRate: '6.7',
    loanTerm: '30',
    propertyTaxRate: '1.6',
    starEligible: 'none',
  };

  it('calculates monthly payment for a typical NY home', () => {
    const r = config.calculate(defaultInputs);
    expect(getValue(r, 'monthlyPayment')).toContain('$');
    const payment = parseMoney(getValue(r, 'monthlyPayment'));
    expect(payment).toBeGreaterThan(1000);
    expect(payment).toBeLessThan(5000);
  });

  it('returns empty for zero home price', () => {
    expect(config.calculate({ homePrice: '0', downPayment: '0', interestRate: '6.7', loanTerm: '30' })).toHaveLength(0);
  });

  it('returns empty when down payment exceeds home price', () => {
    expect(config.calculate({ homePrice: '500000', downPayment: '600000', interestRate: '6.7', loanTerm: '30' })).toHaveLength(0);
  });

  it('handles NaN and missing inputs gracefully by returning empty', () => {
    expect(config.calculate({ homePrice: 'abc', downPayment: '0', interestRate: '6.7', loanTerm: '30' })).toHaveLength(0);
  });

  it('shows PMI indicator in down payment line when under 20%', () => {
    const r = config.calculate({ ...defaultInputs, downPayment: '25000' });
    const downPctLine = getValue(r, 'downPercent');
    expect(downPctLine).toContain('%');
    const nyData = JSON.parse(getValue(r, '_nyData'));
    expect(nyData.hasPmi).toBe(true);
  });

  it('applies NY property tax rates correctly for NYC scenario', () => {
    const r = config.calculate({ ...defaultInputs, homePrice: '650000', downPayment: '130000', propertyTaxRate: '0.88' });
    expect(getValue(r, 'propertyTaxNote')).toContain('/yr');
    const taxVal = getValue(r, 'propertyTaxNote').replace(/[$,]/g, '');
    const annualTax = parseFloat(taxVal);
    expect(annualTax).toBeGreaterThan(5000);
    expect(annualTax).toBeLessThan(7000);
  });

  it('handles high upstate property tax rate', () => {
    const r = config.calculate({ ...defaultInputs, homePrice: '220000', downPayment: '11000', propertyTaxRate: '2.3' });
    const totalMonthly = parseMoney(getValue(r, 'totalMonthly'));
    expect(totalMonthly).toBeGreaterThan(1000);
    expect(totalMonthly).toBeLessThan(2500);
  });

  it('computes mortgage recording tax at closing', () => {
    const r = config.calculate(defaultInputs);
    const recordingTax = parseMoney(getValue(r, 'recordingTax'));
    expect(recordingTax).toBeGreaterThan(1500);
    expect(recordingTax).toBeLessThan(3500);
  });

  it('shows STAR savings when basic STAR eligible', () => {
    const r = config.calculate({ ...defaultInputs, starEligible: 'basic' });
    expect(getValue(r, 'starSavings')).not.toBe('Not eligible');
  });

  it('shows no STAR savings when not eligible', () => {
    const r = config.calculate(defaultInputs);
    expect(getValue(r, 'starSavings')).toBe('Not eligible');
  });

  it('enhanced STAR provides savings', () => {
    const r = config.calculate({ ...defaultInputs, starEligible: 'enhanced' });
    expect(getValue(r, 'starSavings')).not.toBe('Not eligible');
  });

  it('15-year term has higher monthly payment than 30-year', () => {
    const r15 = config.calculate({ ...defaultInputs, loanTerm: '15' });
    const r30 = config.calculate(defaultInputs);
    expect(parseMoney(getValue(r15, 'monthlyPayment'))).toBeGreaterThan(parseMoney(getValue(r30, 'monthlyPayment')));
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
