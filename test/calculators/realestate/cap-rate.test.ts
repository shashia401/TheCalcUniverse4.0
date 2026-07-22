import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/realestate/cap-rate/index';
import { getValue, parseMoney, parseNumber, near } from '../../helpers';

describe('Cap Rate Calculator', () => {
  it('calculates cap rate from rental income and expenses', () => {
    const results = config.calculate({
      propertyValue: '300000',
      annualRent: '36000',
      vacancyRate: '7',
      propertyTax: '3600',
      insurance: '1200',
      hoa: '0',
      maintenance: '2000',
      propertyManagement: '2520',
      otherExpenses: '500',
    });
    // Effective Gross Income = 36000 * (1 - 0.07) = 33480
    // Total Expenses = 3600+1200+2000+2520+500 = 9820
    // NOI = 33480 - 9820 = 23660
    // Cap Rate = 23660/300000 * 100 = 7.89%
    const capRate = parseNumber(getValue(results, 'capRate'));
    near(capRate, 7.89, 0.05);
  });

  it('calculates NOI correctly', () => {
    const results = config.calculate({
      propertyValue: '300000',
      annualRent: '36000',
      vacancyRate: '7',
      propertyTax: '3600',
      insurance: '1200',
      hoa: '0',
      maintenance: '2000',
      propertyManagement: '2520',
      otherExpenses: '500',
    });
    const noi = parseNumber(getValue(results, 'noi'));
    near(noi, 23660);
  });

  it('calculates gross rent multiplier', () => {
    const results = config.calculate({
      propertyValue: '300000',
      annualRent: '36000',
      vacancyRate: '7',
      propertyTax: '',
      insurance: '',
      hoa: '',
      maintenance: '',
      propertyManagement: '',
      otherExpenses: '',
    });
    // GRM = 300000 / 36000 = 8.33x
    const grm = parseNumber(getValue(results, 'grm'));
    near(grm, 8.33, 0.05);
  });

  it('calculates vacancy loss', () => {
    const results = config.calculate({
      propertyValue: '300000',
      annualRent: '36000',
      vacancyRate: '7',
      propertyTax: '3600',
      insurance: '1200',
      hoa: '0',
      maintenance: '2000',
      propertyManagement: '2520',
      otherExpenses: '500',
    });
    const loss = parseNumber(getValue(results, 'vacancyLoss'));
    near(loss, 2520); // 36000 * 0.07
  });

  it('shows expense ratio as N/A when no expenses entered', () => {
    const results = config.calculate({
      propertyValue: '300000',
      annualRent: '36000',
      vacancyRate: '7',
      propertyTax: '',
      insurance: '',
      hoa: '',
      maintenance: '',
      propertyManagement: '',
      otherExpenses: '',
    });
    expect(getValue(results, 'expenseRatio')).toBe('N/A');
  });

  it('returns empty for missing required inputs', () => {
    const results = config.calculate({
      propertyValue: '',
      annualRent: '',
      vacancyRate: '',
      propertyTax: '',
      insurance: '',
      hoa: '',
      maintenance: '',
      propertyManagement: '',
      otherExpenses: '',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for zero property value', () => {
    const results = config.calculate({
      propertyValue: '0',
      annualRent: '36000',
      vacancyRate: '7',
      propertyTax: '',
      insurance: '',
      hoa: '',
      maintenance: '',
      propertyManagement: '',
      otherExpenses: '',
    });
    expect(results).toEqual([]);
  });
});
