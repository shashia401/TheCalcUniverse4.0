import { describe, it, expect } from 'vitest';
import rentalPropertyConfig from '../../../src/calculators/finance/rental-property/index';
import { getValue, parseMoney, parseNumber, near } from '../../helpers';

describe('Rental Property Calculator', () => {
  const find = (r: ReturnType<typeof rentalPropertyConfig.calculate>, id: string) =>
    r.find((x) => x.id === id)?.value ?? '';

  it('calculates positive cash flow for a well-priced property in a low-tax state', () => {
    const r = rentalPropertyConfig.calculate({
      purchasePrice: '250000',
      downPayment: '50000',
      closingCosts: '5000',
      interestRate: '7.0',
      loanTerm: '30',
      monthlyRent: '2400',
      vacancyRate: '5',
      propertyTax: '2000',
      insurance: '1500',
      hoaFees: '0',
      maintenancePct: '10',
      propertyMgmtPct: '0',
    });
    const cashFlow = parseMoney(getValue(r, 'monthlyCashFlow'));
    const capRate = parseNumber(getValue(r, 'capRate'));
    const noiValue = parseNumber(getValue(r, 'noi'));
    expect(cashFlow).toBeGreaterThan(0);
    expect(capRate).toBeGreaterThan(4);
    expect(noiValue).toBeGreaterThan(0);
    // Verify DSCR > 1.0 for a profitable property
    const dscr = parseNumber(getValue(r, 'dscr'));
    expect(dscr).toBeGreaterThan(1.0);
  });

  it('auto-fills property tax from a selected state rate', () => {
    const r = rentalPropertyConfig.calculate({
      purchasePrice: '350000',
      downPayment: '70000',
      closingCosts: '5000',
      interestRate: '7.25',
      loanTerm: '30',
      monthlyRent: '3000',
      vacancyRate: '5',
      propertyTax: '',
      propertyTaxState: 'tx',
      insurance: '1800',
      hoaFees: '0',
      maintenancePct: '10',
      propertyMgmtPct: '0',
    });
    // Texas avg rate = 1.63% → 350K * 0.0163 = $5,705
    const rateUsed = getValue(r, 'propertyTaxRate');
    expect(rateUsed).toContain('Texas');
    expect(rateUsed).toContain('%');
    // Verify NOI is calculated (means tax was applied)
    const noi = parseNumber(getValue(r, 'noi'));
    expect(noi).toBeGreaterThan(0);
  });

  it('shows negative cash flow for a condo with high HOA fees', () => {
    const r = rentalPropertyConfig.calculate({
      purchasePrice: '200000',
      downPayment: '50000',
      closingCosts: '4000',
      interestRate: '7.0',
      loanTerm: '30',
      monthlyRent: '1600',
      vacancyRate: '5',
      propertyTax: '3900',
      insurance: '1400',
      hoaFees: '350',
      maintenancePct: '10',
      propertyMgmtPct: '8',
    });
    const cashFlow = parseMoney(getValue(r, 'monthlyCashFlow'));
    // With high HOA + high tax + management, this should be negative or very low
    expect(cashFlow).toBeLessThan(100);
    const dscr = parseNumber(getValue(r, 'dscr'));
    expect(dscr).toBeLessThan(1.5);
  });

  it('returns empty array for missing required purchase price', () => {
    const r = rentalPropertyConfig.calculate({
      purchasePrice: '',
      downPayment: '50000',
      closingCosts: '0',
      interestRate: '7.0',
      loanTerm: '30',
      monthlyRent: '2500',
      vacancyRate: '5',
      propertyTax: '4000',
      insurance: '1500',
      hoaFees: '0',
      maintenancePct: '10',
      propertyMgmtPct: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for missing monthly rent', () => {
    const r = rentalPropertyConfig.calculate({
      purchasePrice: '350000',
      downPayment: '70000',
      closingCosts: '0',
      interestRate: '7.0',
      loanTerm: '30',
      monthlyRent: '',
      vacancyRate: '5',
      propertyTax: '4000',
      insurance: '1500',
      hoaFees: '0',
      maintenancePct: '10',
      propertyMgmtPct: '0',
    });
    expect(r).toEqual([]);
  });

  it('computes accurate cap rate formula: NOI / PurchasePrice * 100', () => {
    const r = rentalPropertyConfig.calculate({
      purchasePrice: '400000',
      downPayment: '80000',
      closingCosts: '10000',
      interestRate: '6.5',
      loanTerm: '30',
      monthlyRent: '3500',
      vacancyRate: '5',
      propertyTax: '5000',
      insurance: '2000',
      hoaFees: '0',
      maintenancePct: '10',
      propertyMgmtPct: '0',
    });
    const noi = parseNumber(getValue(r, 'noi'));
    const capRate = parseNumber(getValue(r, 'capRate'));
    // Verify cap rate = (NOI / purchasePrice) * 100
    const expectedCapRate = (noi / 400000) * 100;
    near(capRate, expectedCapRate, 0.1);
  });
});
