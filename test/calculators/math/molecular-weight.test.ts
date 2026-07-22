import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/molecular-weight/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Molecular Weight Calculator', () => {
  it('calculates H2O = 18.015 g/mol', () => {
    const r = config.calculate({ formula: 'H2O' });
    near(parseNumber(getValue(r, 'molecularWeight')), 18.015, 0.01);
    // unit is separate from value in CalculatorResult
  });

  it('calculates NaCl = 58.44 g/mol', () => {
    const r = config.calculate({ formula: 'NaCl' });
    near(parseNumber(getValue(r, 'molecularWeight')), 58.44, 0.1);
    expect(getValue(r, 'formula')).toContain('NaCl');
  });

  it('calculates CO2 = 44.01 g/mol', () => {
    const r = config.calculate({ formula: 'CO2' });
    near(parseNumber(getValue(r, 'molecularWeight')), 44.01, 0.1);
  });

  it('calculates glucose C6H12O6 = 180.16 g/mol', () => {
    const r = config.calculate({ formula: 'C6H12O6' });
    near(parseNumber(getValue(r, 'molecularWeight')), 180.16, 0.1);
  });

  it('handles parentheses: Mg(OH)2', () => {
    const r = config.calculate({ formula: 'Mg(OH)2' });
    // Mg = 24.305, O = 15.999*2 = 31.998, H = 1.008*2 = 2.016
    // Total = 24.305 + 31.998 + 2.016 = 58.319
    near(parseNumber(getValue(r, 'molecularWeight')), 58.32, 0.1);
  });

  it('handles nested parentheses: Fe2(SO4)3', () => {
    const r = config.calculate({ formula: 'Fe2(SO4)3' });
    // Fe = 55.845*2 = 111.69, S = 32.065*3 = 96.195, O = 15.999*12 = 191.988
    // Total = 111.69 + 96.195 + 191.988 = 399.873
    near(parseNumber(getValue(r, 'molecularWeight')), 399.87, 0.5);
  });

  it('handles hydrates: CuSO4.5H2O', () => {
    const r = config.calculate({ formula: 'CuSO4.5H2O' });
    // Cu=63.546, S=32.065, O4=63.996, 5H2O=90.075
    // Total = 63.546 + 32.065 + 63.996 + 90.075 = 249.682
    near(parseNumber(getValue(r, 'molecularWeight')), 249.68, 0.5);
    expect(getValue(r, 'formulaUnits')).toContain('H₂O');
  });

  it('handles · notation for hydrates: CuSO4·5H2O', () => {
    const r = config.calculate({ formula: 'CuSO4·5H2O' });
    near(parseNumber(getValue(r, 'molecularWeight')), 249.68, 0.5);
  });

  it('handles Unicode subscripts: H₂O', () => {
    const r = config.calculate({ formula: 'H₂O' });
    near(parseNumber(getValue(r, 'molecularWeight')), 18.015, 0.1);
  });

  it('returns element breakdown with percentages', () => {
    const r = config.calculate({ formula: 'H2O' });
    const breakdown = getValue(r, 'elementBreakdown');
    expect(breakdown).toContain('H');
    expect(breakdown).toContain('O');
  });

  it('shows total atoms count', () => {
    const r = config.calculate({ formula: 'H2O' });
    expect(getValue(r, 'totalAtoms')).toBe('3');
  });

  it('returns empty for empty formula', () => {
    const r = config.calculate({ formula: '' });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid formula', () => {
    const r = config.calculate({ formula: 'XxYy' });
    expect(r).toEqual([]);
  });

  it('returns empty for unmatched bracket', () => {
    const r = config.calculate({ formula: 'Mg(OH' });
    expect(r).toEqual([]);
  });

  it('handles ethanol C2H5OH', () => {
    const r = config.calculate({ formula: 'C2H5OH' });
    // C2=24.022, H6=6.048, O=15.999 => 46.069
    near(parseNumber(getValue(r, 'molecularWeight')), 46.07, 0.1);
  });

  it('calculates H2SO4 = 98.08 g/mol', () => {
    const r = config.calculate({ formula: 'H2SO4' });
    // H2=2.016, S=32.065, O4=63.996 => 98.077
    near(parseNumber(getValue(r, 'molecularWeight')), 98.08, 0.1);
  });

  it('calculates CaCO3 = 100.09 g/mol', () => {
    const r = config.calculate({ formula: 'CaCO3' });
    // Ca=40.078, C=12.011, O3=47.997 => 100.086
    near(parseNumber(getValue(r, 'molecularWeight')), 100.09, 0.1);
  });

  it('calculates CH3COOH (acetic acid) = 60.05 g/mol', () => {
    const r = config.calculate({ formula: 'CH3COOH' });
    // C2=24.022, H4=4.032, O2=31.998 => 60.052
    near(parseNumber(getValue(r, 'molecularWeight')), 60.05, 0.1);
  });

  it('handles square brackets: K3[Fe(CN)6]', () => {
    const r = config.calculate({ formula: 'K3[Fe(CN)6]' });
    // K3=117.294, Fe=55.845, C6=72.066, N6=84.042 => 329.247
    near(parseNumber(getValue(r, 'molecularWeight')), 329.25, 1);
  });
});
