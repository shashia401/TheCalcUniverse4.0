import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/industrial/energy-converter/index';
import { getValue, near } from '../../helpers';

describe('Energy Converter', () => {
  it('converts joules to kilojoules', () => {
    const r = config.calculate({ value: '1000', from: 'j', to: 'kj' });
    expect(getValue(r, 'result')).toContain('1000 J = 1 kJ');
  });

  it('converts kilowatt-hours to BTUs', () => {
    const r = config.calculate({ value: '1', from: 'kwh', to: 'btu' });
    expect(getValue(r, 'result')).toContain('kWh');
    expect(getValue(r, 'result')).toContain('BTU');
  });

  it('converts food calories (kcal) to kilojoules', () => {
    const r = config.calculate({ value: '200', from: 'kcal', to: 'kj' });
    expect(getValue(r, 'result')).toContain('200 kcal');
    expect(getValue(r, 'result')).toContain('kJ');
    // 200 kcal = 200 * 4184 / 1000 = 836.8 kJ
    expect(getValue(r, 'result')).toContain('836.8');
  });

  it('converts BTUs to kilowatt-hours', () => {
    const r = config.calculate({ value: '3412', from: 'btu', to: 'kwh' });
    expect(getValue(r, 'result')).toContain('BTU');
    expect(getValue(r, 'result')).toContain('kWh');
  });

  it('converts electronvolts to joules (very small number)', () => {
    const r = config.calculate({ value: '1', from: 'ev', to: 'j' });
    expect(getValue(r, 'result')).toContain('eV');
    expect(getValue(r, 'result')).toContain('J');
  });

  it('converts therms to kWh', () => {
    const r = config.calculate({ value: '1', from: 'therm', to: 'kwh' });
    expect(getValue(r, 'result')).toContain('therm');
    expect(getValue(r, 'result')).toContain('kWh');
  });

  it('converts TCE to kWh', () => {
    const r = config.calculate({ value: '1', from: 'tce', to: 'kwh' });
    expect(getValue(r, 'result')).toContain('TCE');
    expect(getValue(r, 'result')).toContain('kWh');
  });

  it('same unit conversion returns same value', () => {
    const r = config.calculate({ value: '500', from: 'j', to: 'j' });
    expect(getValue(r, 'result')).toContain('500 J = 500 J');
  });

  it('foot-pounds to joules', () => {
    const r = config.calculate({ value: '10', from: 'ftlb', to: 'j' });
    expect(getValue(r, 'result')).toContain('ft·lb');
  });

  it('shows formula in results', () => {
    const r = config.calculate({ value: '100', from: 'j', to: 'kj' });
    expect(getValue(r, 'formula')).toContain('×');
  });

  it('returns empty array for empty value', () => {
    const r = config.calculate({ value: '', from: 'j', to: 'kj' });
    expect(r).toEqual([]);
  });

  it('returns empty array for invalid value', () => {
    const r = config.calculate({ value: 'abc', from: 'j', to: 'kj' });
    expect(r).toEqual([]);
  });

  it('educational content meets minimum requirements', () => {
    expect(config.educational.formulaDescription.length).toBeGreaterThanOrEqual(100);
    expect(config.educational.variables?.length).toBeGreaterThanOrEqual(4);
    expect(config.educational.howToUse?.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.explanation?.length).toBeGreaterThanOrEqual(300);
    expect(config.educational.faqs?.length).toBeGreaterThanOrEqual(5);
    expect(config.educational.citations?.length).toBeGreaterThanOrEqual(1);
    expect(config.educational.commonUses?.length).toBeGreaterThanOrEqual(2);
    expect(config.educational.quickReference?.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.diagram).toBeDefined();
    expect(config.educational.diagram?.alt).toBeTruthy();
  });
});
