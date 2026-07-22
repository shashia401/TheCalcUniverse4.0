import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/gdp/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('GDP calculator', () => {
  it('calculates nominal GDP correctly — C+I+G+(X-M)', () => {
    const r = config.calculate({
      mode: 'nominal',
      consumption: '17500000000000',
      investment: '4200000000000',
      governmentSpending: '3800000000000',
      exports: '2500000000000',
      imports: '3200000000000',
    });
    expect(r.length).toBeGreaterThan(0);
    // NX = 2.5T - 3.2T = -0.7T
    // GDP = 17.5T + 4.2T + 3.8T + (-0.7T) = 24.8T
    near(parseNumber(getValue(r, 'gdpNumeric')), 24800000000000, 1e9);
    expect(getValue(r, 'gdp')).toContain('trillion');
    expect(getValue(r, 'gdpType')).toBe('Nominal GDP');
  });

  it('calculates real GDP with deflator', () => {
    const r = config.calculate({
      mode: 'real',
      consumption: '17500000000000',
      investment: '4200000000000',
      governmentSpending: '3800000000000',
      exports: '2500000000000',
      imports: '3200000000000',
      gdpDeflator: '125',
    });
    expect(r.length).toBeGreaterThan(0);
    // Nominal GDP = 24.8T
    // Real GDP = 24.8T / (125/100) = 19.84T
    near(parseNumber(getValue(r, 'gdpNumeric')), 19840000000000, 1e9);
    expect(getValue(r, 'gdpType')).toBe('Real GDP');
    expect(getValue(r, 'deflatorNote')).toBeTruthy();
    expect(getValue(r, 'deflatorNote')).toContain('125.0');
  });

  it('handles negative net exports (trade deficit)', () => {
    const r = config.calculate({
      mode: 'nominal',
      consumption: '10000000000000',
      investment: '2000000000000',
      governmentSpending: '1500000000000',
      exports: '1000000000000',
      imports: '3000000000000',
    });
    // NX = 1T - 3T = -2T
    // GDP = 10T + 2T + 1.5T + (-2T) = 11.5T
    near(parseNumber(getValue(r, 'gdpNumeric')), 11500000000000, 1e9);
    expect(getValue(r, 'netExports')).toContain('-');
  });

  it('handles trade surplus (positive net exports)', () => {
    const r = config.calculate({
      consumption: '10000000000000',
      investment: '2000000000000',
      governmentSpending: '1500000000000',
      exports: '3000000000000',
      imports: '1000000000000',
    });
    // NX = 3T - 1T = 2T
    // GDP = 10T + 2T + 1.5T + 2T = 15.5T
    near(parseNumber(getValue(r, 'gdpNumeric')), 15500000000000, 1e9);
    expect(getValue(r, 'netExports')).not.toContain('-');
  });

  it('returns empty for missing input fields', () => {
    const r = config.calculate({
      consumption: '10000000000000',
      investment: '2000000000000',
      // missing governmentSpending
      exports: '1000000000000',
      imports: '500000000000',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for missing deflator in real mode', () => {
    const r = config.calculate({
      mode: 'real',
      consumption: '10000000000000',
      investment: '2000000000000',
      governmentSpending: '1500000000000',
      exports: '1000000000000',
      imports: '500000000000',
      // missing gdpDeflator
    });
    expect(r).toEqual([]);
  });

  it('all component shares sum to ~100%', () => {
    const r = config.calculate({
      consumption: '17500000000000',
      investment: '4200000000000',
      governmentSpending: '3800000000000',
      exports: '2500000000000',
      imports: '3200000000000',
    });
    const cShare = parseFloat(getValue(r, 'consumptionShare'));
    const iShare = parseFloat(getValue(r, 'investmentShare'));
    const gShare = parseFloat(getValue(r, 'governmentShare'));
    const nxShare = parseFloat(getValue(r, 'netExportShare'));
    const total = cShare + iShare + gShare + nxShare;
    near(total, 100, 0.5);
  });

  it('formats large GDP values as trillions', () => {
    const r = config.calculate({
      consumption: '17500000000000',
      investment: '4200000000000',
      governmentSpending: '3800000000000',
      exports: '2500000000000',
      imports: '3200000000000',
    });
    const gdpValue = getValue(r, 'gdp');
    expect(gdpValue).toMatch(/^\$[\d,]+\.\d+ trillion$/);
  });

  it('formats smaller GDP values as billions', () => {
    const r = config.calculate({
      consumption: '500000000000',
      investment: '100000000000',
      governmentSpending: '80000000000',
      exports: '50000000000',
      imports: '30000000000',
    });
    // GDP = 500B + 100B + 80B + (50B-30B) = 700B
    const gdpValue = getValue(r, 'gdp');
    expect(gdpValue).toMatch(/^\$[\d,]+\.\d+ billion$/);
  });

  it('includes formula breakdown with all components', () => {
    const r = config.calculate({
      consumption: '10000000000000',
      investment: '2000000000000',
      governmentSpending: '1500000000000',
      exports: '1000000000000',
      imports: '500000000000',
    });
    const formula = getValue(r, 'gdpFormula');
    expect(formula).toContain('C =');
    expect(formula).toContain('I =');
    expect(formula).toContain('G =');
    expect(formula).toContain('X =');
    expect(formula).toContain('M =');
    expect(formula).toContain('X−M =');
  });

  it('shows deflatorNote only in real mode', () => {
    const nominalR = config.calculate({
      mode: 'nominal',
      consumption: '10000000000000',
      investment: '2000000000000',
      governmentSpending: '1500000000000',
      exports: '1000000000000',
      imports: '500000000000',
    });
    const deflatorInNominal = nominalR.find((x) => x.id === 'deflatorNote');
    expect(deflatorInNominal).toBeUndefined();

    const realR = config.calculate({
      mode: 'real',
      consumption: '10000000000000',
      investment: '2000000000000',
      governmentSpending: '1500000000000',
      exports: '1000000000000',
      imports: '500000000000',
      gdpDeflator: '110',
    });
    const deflatorInReal = realR.find((x) => x.id === 'deflatorNote');
    expect(deflatorInReal).toBeDefined();
  });

  it('handles zero deflator in real mode (returns empty)', () => {
    const r = config.calculate({
      mode: 'real',
      consumption: '10000000000000',
      investment: '2000000000000',
      governmentSpending: '1500000000000',
      exports: '1000000000000',
      imports: '500000000000',
      gdpDeflator: '0',
    });
    expect(r).toEqual([]);
  });

  it('outputs netExports as a separate result', () => {
    const r = config.calculate({
      consumption: '10000000000000',
      investment: '2000000000000',
      governmentSpending: '1500000000000',
      exports: '3000000000000',
      imports: '1000000000000',
    });
    expect(getValue(r, 'netExports')).toContain('$');
    near(parseNumber(getValue(r, 'netExportsNumeric')), 2000000000000, 1e9);
  });
});
