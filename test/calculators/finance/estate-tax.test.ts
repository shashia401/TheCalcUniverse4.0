import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/estate-tax/index';
import { getValue, getResult, parseNumber, parseMoney, near } from '../../helpers';

describe('estate-tax', () => {
  it('calculates tax for large estate over exemption', () => {
    const r = config.calculate({
      totalAssets: '20000000',
      debtsDeductions: '200000',
      filingStatus: 'single',
      spouseEstate: '0',
      stateResidence: 'none',
    });
    expect(r.length).toBeGreaterThanOrEqual(6);
    expect(getValue(r, 'notice')).toContain('$13.99M');
    near(parseMoney(getValue(r, 'adjustedEstate')), 19800000, 100);
    expect(parseMoney(getValue(r, 'federalTax'))).toBeGreaterThan(0);
    expect(parseMoney(getValue(r, 'totalTax'))).toBeGreaterThan(0);
    expect(parseMoney(getValue(r, 'netToHeirs'))).toBeGreaterThan(0);
  });

  it('returns empty for zero total assets', () => {
    const r = config.calculate({
      totalAssets: '0',
      filingStatus: 'single',
      stateResidence: 'none',
    });
    expect(r).toHaveLength(0);
  });

  it('shows below exemption when estate is under federal limit', () => {
    const r = config.calculate({
      totalAssets: '5000000',
      debtsDeductions: '100000',
      filingStatus: 'single',
      stateResidence: 'none',
    });
    expect(r.length).toBeGreaterThanOrEqual(5);
    expect(getValue(r, 'federalTaxableEstate')).toContain('Below exemption');
    near(parseMoney(getValue(r, 'federalTax')), 0);
  });

  it('doubles exemption for married filing jointly', () => {
    const r = config.calculate({
      totalAssets: '30000000',
      debtsDeductions: '0',
      filingStatus: 'married',
      spouseEstate: '0',
      stateResidence: 'none',
    });
    // Label should reference married couple filing, value shows exemption amount
    expect(getResult(r, 'notice').label).toContain('Married Couple');
    expect(getValue(r, 'notice')).toContain('$27.98M');
  });

  it('includes state tax details for Washington (estate tax state)', () => {
    const r = config.calculate({
      totalAssets: '15000000',
      debtsDeductions: '0',
      filingStatus: 'single',
      stateResidence: 'WA',
    });
    const stateTaxResult = r.find(x => x.id === 'stateTax');
    expect(stateTaxResult).toBeDefined();
    expect(parseMoney(getValue(r, 'totalTax'))).toBeGreaterThan(0);
  });

  it('includes effective rate when total tax is positive', () => {
    const r = config.calculate({
      totalAssets: '25000000',
      debtsDeductions: '0',
      filingStatus: 'single',
      stateResidence: 'none',
    });
    const effectiveRateResult = r.find(x => x.id === 'effectiveRate');
    expect(effectiveRateResult).toBeDefined();
    expect(effectiveRateResult?.value).toContain('%');
  });

  it('omits state tax section for states without estate tax', () => {
    const r = config.calculate({
      totalAssets: '20000000',
      debtsDeductions: '0',
      filingStatus: 'single',
      stateResidence: 'none',
    });
    const stateTaxResult = r.find(x => x.id === 'stateTax');
    expect(stateTaxResult).toBeUndefined();
  });
});
