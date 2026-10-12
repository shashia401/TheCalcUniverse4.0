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
    // $400,000 loan in NYC: Form MT-15 total 2.05% = $8,200; lender pays 0.25% ($1,000); borrower pays 1.80% = $7,200.
    expect(parseMoney(getValue(r, 'recordingTax'))).toBe(7200);
  });

  it('shows STAR savings when basic STAR eligible', () => {
    const r = config.calculate({ ...defaultInputs, starEligible: 'basic' });
    expect(getValue(r, 'starSavings')).not.toBe('Not eligible');
  });

  it('computes basic STAR savings for Maria\'s worked example ($400K, 0.9% tax) as ~$162/yr, not $600/yr', () => {
    const r = config.calculate({
      homePrice: '400000',
      downPayment: '80000',
      interestRate: '6.7',
      loanTerm: '30',
      propertyTaxRate: '0.9',
      starEligible: 'basic',
    });
    const starSavings = parseFloat(getValue(r, 'starSavings').replace(/[$,/yr]/g, ''));
    expect(starSavings).toBeCloseTo(162, 0);
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

describe('NY taxes audit (NYS Form MT-15 rev. 1/25, STAR 2026-27)', () => {
  const base = { homePrice: '400000', downPayment: '80000', interestRate: '6.7', loanTerm: '30', propertyTaxRate: '0.9', starEligible: 'basic' };
  // Independent: P&I = 320000 * (r(1+r)^360)/((1+r)^360-1), r = 0.067/12 -> 2064.89; tax 400000*0.9%/12 = 300
  it("Maria's worked example: P&I $2,064.89, total $2,364.89, STAR $162, recording tax $5,760", () => {
    const r = config.calculate({ ...base, mrtRegion: 'nyc' });
    expect(getValue(r, 'monthlyPayment')).toBe('$2,064.89');
    expect(getValue(r, 'totalMonthly')).toBe('$2,364.89');
    expect(getValue(r, 'starSavings')).toBe('$162/yr');
    expect(getValue(r, 'recordingTax')).toBe('$5,760.00');
  });
  it("Johnsons' example: 10% down adds PMI $93.75; upstate recording tax 0.75% of $225,000 = $1,687.50", () => {
    const r = config.calculate({ homePrice: '250000', downPayment: '25000', interestRate: '6.7', loanTerm: '30', propertyTaxRate: '2.4', starEligible: 'basic', mrtRegion: 'upstate' });
    expect(getValue(r, 'totalMonthly')).toBe('$2,045.63'); // 1451.88 + 500 + 93.75
    expect(getValue(r, 'recordingTax')).toBe('$1,687.50');
  });
  it('NYC loans of $500K+ use 2.175% total (borrower 1.925%): $500K -> $9,625', () => {
    const r = config.calculate({ homePrice: '625000', downPayment: '125000', interestRate: '6.7', loanTerm: '30', propertyTaxRate: '1', mrtRegion: 'nyc' });
    expect(getValue(r, 'recordingTax')).toBe('$9,625.00');
  });
  it('other regions: Nassau/Suffolk 1.05% total -> 0.80% borrower; Westchester 1.30% -> 1.05% (on $400K)', () => {
    expect(getValue(config.calculate({ ...base, mrtRegion: 'mctd' }), 'recordingTax')).toBe('$2,560.00');
    expect(getValue(config.calculate({ ...base, mrtRegion: 'westchester' }), 'recordingTax')).toBe('$3,360.00');
  });
  it('Enhanced STAR covers the first $88,500: 88,500 x (0.9% x 60% school share) = $477.90', () => {
    expect(getValue(config.calculate({ ...base, starEligible: 'enhanced' }), 'starSavings')).toBe('$478/yr');
  });
  it('mansion tax is 1% from $1,000,000 and absent below it', () => {
    const below = config.calculate({ ...base, homePrice: '999999', downPayment: '200000' });
    expect(getValue(below, 'mansionTax')).toContain('Not applicable');
    const at = config.calculate({ ...base, homePrice: '1000000', downPayment: '200000' });
    expect(getValue(at, 'mansionTax')).toBe('$10,000.00');
  });
  it('a 19.96% down payment (displays as 20.0%) still pays PMI', () => {
    // 19.96% of 500,000 = 99,800; PMI = 400,200 * 0.5% / 12 = 166.75
    const r = config.calculate({ homePrice: '500000', downPayment: '99800', interestRate: '6.7', loanTerm: '30', propertyTaxRate: '0' });
    const pi = parseMoney(getValue(r, 'monthlyPayment'));
    expect(parseMoney(getValue(r, 'totalMonthly')) - pi).toBeCloseTo(166.75, 1);
  });
});
