import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/rental-property/index';
import { getValue, parseMoney, parseNumber } from '../../helpers';

describe('rental property calculator', () => {
  it('calculates cash flow and cap rate for a profitable property', () => {
    const r = config.calculate({
      purchasePrice: '350000',
      downPayment: '70000',
      closingCosts: '5000',
      interestRate: '7.25',
      loanTerm: '30',
      monthlyRent: '3000',
      vacancyRate: '5',
      propertyTax: '4200',
      insurance: '1800',
      hoaFees: '0',
      maintenancePct: '10',
      propertyMgmtPct: '0',
    });
    const cashFlow = parseMoney(getValue(r, 'monthlyCashFlow'));
    const capRate = parseNumber(getValue(r, 'capRate'));
    expect(capRate).toBeGreaterThan(0);
    // Cash flow should be positive for this scenario
    expect(cashFlow).toBeGreaterThan(0);
  });

  it('auto-fills property tax from state rate', () => {
    const r = config.calculate({
      purchasePrice: '350000',
      downPayment: '70000',
      closingCosts: '5000',
      interestRate: '7.25',
      loanTerm: '30',
      monthlyRent: '3000',
      vacancyRate: '5',
      propertyTax: '',
      insurance: '1800',
      hoaFees: '0',
      maintenancePct: '10',
      propertyMgmtPct: '0',
      propertyTaxState: 'tx',
    });
    // Texas avg rate = 1.63% → 350K * 0.0163 = 5705
    const rateUsed = getValue(r, 'propertyTaxRate');
    expect(rateUsed).toContain('Texas');
    expect(rateUsed).toContain('%');
  });

  it('calculates DSCR ratio', () => {
    const r = config.calculate({
      purchasePrice: '350000',
      downPayment: '70000',
      closingCosts: '0',
      interestRate: '7.25',
      loanTerm: '30',
      monthlyRent: '3000',
      vacancyRate: '5',
      propertyTax: '4200',
      insurance: '1800',
      hoaFees: '0',
      maintenancePct: '10',
      propertyMgmtPct: '0',
    });
    const dscr = parseNumber(getValue(r, 'dscr'));
    expect(dscr).toBeGreaterThan(0.5);
  });

  it('returns empty for invalid inputs', () => {
    const r = config.calculate({
      purchasePrice: '',
      downPayment: '0',
      closingCosts: '0',
      interestRate: '7.25',
      loanTerm: '30',
      monthlyRent: '3000',
      vacancyRate: '5',
      propertyTax: '4200',
      insurance: '1800',
      hoaFees: '0',
      maintenancePct: '10',
      propertyMgmtPct: '0',
    });
    expect(r).toEqual([]);
  });
});
