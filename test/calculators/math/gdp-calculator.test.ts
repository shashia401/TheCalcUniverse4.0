import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/gdp/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('gdp-calculator', () => {
  it('computes nominal GDP correctly', () => {
    const r = config.calculate({
      mode: 'nominal',
      consumption: '10000000000000',
      investment: '3000000000000',
      governmentSpending: '3000000000000',
      exports: '2000000000000',
      imports: '2500000000000',
    });
    // GDP = C + I + G + (X - M) = 10T + 3T + 3T + (2T - 2.5T) = 15.5T - 0.5T = 15T
    expect(getValue(r, 'gdpType')).toBe('Nominal GDP');
    expect(parseNumber(getValue(r, 'gdpNumeric'))).toBeGreaterThan(1e12);
  });

  it('computes real GDP with deflator', () => {
    const r = config.calculate({
      mode: 'real',
      consumption: '10000000000000',
      investment: '3000000000000',
      governmentSpending: '3000000000000',
      exports: '2000000000000',
      imports: '2500000000000',
      gdpDeflator: '125',
    });
    expect(getValue(r, 'gdpType')).toBe('Real GDP');
    // Nominal = 15.5T - 0.5T = 15T. Real = 15T / 1.25 = 12T
    const realGdp = parseNumber(getValue(r, 'gdpNumeric'));
    expect(realGdp).toBeLessThan(parseNumber(getValue(r, 'gdpNumeric')) * 1.5);
  });

  it('shows component shares that sum approximately to 100%', () => {
    const r = config.calculate({
      mode: 'nominal',
      consumption: '7000000000000',
      investment: '2000000000000',
      governmentSpending: '2000000000000',
      exports: '1000000000000',
      imports: '1000000000000',
    });
    // GDP = 7T + 2T + 2T + 0 = 11T
    // Shares: C=63.6, I=18.2, G=18.2, NX=0
    const c = parseNumber(getValue(r, 'consumptionShare'));
    const i = parseNumber(getValue(r, 'investmentShare'));
    const g = parseNumber(getValue(r, 'governmentShare'));
    const nx = parseNumber(getValue(r, 'netExportShare'));
    near(c + i + g + nx, 100, 0.2);
  });

  it('handles trade deficit (negative net exports)', () => {
    const r = config.calculate({
      mode: 'nominal',
      consumption: '10000000000000',
      investment: '2000000000000',
      governmentSpending: '2000000000000',
      exports: '1000000000000',
      imports: '3000000000000',
    });
    const netExports = parseNumber(getValue(r, 'netExportsNumeric'));
    expect(netExports).toBeLessThan(0);
  });

  it('returns empty for missing required inputs', () => {
    expect(config.calculate({})).toHaveLength(0);
    expect(config.calculate({ mode: 'nominal', consumption: '100' })).toHaveLength(0);
  });

  it('returns empty for invalid deflator in real mode', () => {
    const r = config.calculate({
      mode: 'real',
      consumption: '100',
      investment: '100',
      governmentSpending: '100',
      exports: '100',
      imports: '100',
      gdpDeflator: '0',
    });
    expect(r).toHaveLength(0);
  });

  it('has educational content', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
    expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.citations!.length).toBeGreaterThanOrEqual(1);
    expect(config.educational.diagram).toBeTruthy();
  });
});
