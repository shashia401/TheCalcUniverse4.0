import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/molarity/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Molarity Calculator', () => {
  it('calcMolarity: 58.44g NaCl in 1L = 1.0 M', () => {
    const r = config.calculate({ mode: 'calcMolarity', compound: 'NaCl', mass: '58.44', volume: '1', volumeUnit: 'L', molarMass: '58.44' });
    near(parseNumber(getValue(r, 'molarityResult')), 1.0, 0.01);
    expect(getValue(r, 'molarityResult')).toBeTruthy();
  });

  it('calcMolarity: shows mole count', () => {
    const r = config.calculate({ mode: 'calcMolarity', compound: 'NaCl', mass: '58.44', volume: '1', volumeUnit: 'L', molarMass: '58.44' });
    near(parseNumber(getValue(r, 'moles')), 1.0, 0.01);
  });

  it('calcMolarity: auto-detects NaCl from compound name', () => {
    const r = config.calculate({ mode: 'calcMolarity', compound: 'NaCl', mass: '58.44', volume: '1', volumeUnit: 'L' });
    expect(getValue(r, 'compoundSource')).toContain('NaCl');
  });

  it('calcMolarity: works with custom molar mass', () => {
    const r = config.calculate({ mode: 'calcMolarity', mass: '98', volume: '1', volumeUnit: 'L', molarMass: '98' });
    near(parseNumber(getValue(r, 'molarityResult')), 1.0, 0.01);
  });

  it('calcMolarity: returns empty for zero volume', () => {
    const r = config.calculate({ mode: 'calcMolarity', mass: '58.44', volume: '0', volumeUnit: 'L', molarMass: '58.44' });
    expect(r).toEqual([]);
  });

  it('calcMolarity: returns empty for missing mass', () => {
    const r = config.calculate({ mode: 'calcMolarity', volume: '1', volumeUnit: 'L', molarMass: '58.44' });
    expect(r).toEqual([]);
  });

  it('calcMolarity: shows step-by-step', () => {
    const r = config.calculate({ mode: 'calcMolarity', mass: '58.44', volume: '1', volumeUnit: 'L', molarMass: '58.44' });
    const steps = getValue(r, '_stepByStep');
    expect(steps).toContain('n = m / MM');
  });

  it('calcMolarity: handles mL volume', () => {
    const r = config.calculate({ mode: 'calcMolarity', mass: '58.44', volume: '500', volumeUnit: 'mL', molarMass: '58.44' });
    // 58.44g / 58.44 g/mol = 1 mol / 0.5 L = 2 M
    near(parseNumber(getValue(r, 'molarityResult')), 2.0, 0.01);
  });

  it('calcMolarity: handles µL volume', () => {
    const r = config.calculate({ mode: 'calcMolarity', mass: '0.05844', volume: '1000', volumeUnit: 'µL', molarMass: '58.44' });
    // 0.05844g / 58.44 = 0.001 mol / 0.001 L = 1 M
    near(parseNumber(getValue(r, 'molarityResult')), 1.0, 0.01);
  });

  it('calcMass: finds mass from molarity and volume', () => {
    const r = config.calculate({ mode: 'calcMass', molarity: '1', volume: '1', volumeUnit: 'L', molarMass: '58.44' });
    near(parseNumber(getValue(r, 'massResult')), 58.44, 0.01);
  });

  it('calcMass: returns empty for zero molarity', () => {
    const r = config.calculate({ mode: 'calcMass', molarity: '0', volume: '1', volumeUnit: 'L', molarMass: '58.44' });
    expect(r).toEqual([]);
  });

  it('calcVolume: finds volume from mass and molarity', () => {
    const r = config.calculate({ mode: 'calcVolume', mass: '58.44', molarity: '1', molarMass: '58.44' });
    near(parseNumber(getValue(r, 'volumeResult')), 1.0, 0.01);
  });

  it('calcVolume: returns empty for zero molarity', () => {
    const r = config.calculate({ mode: 'calcVolume', mass: '58.44', molarity: '0', molarMass: '58.44' });
    expect(r).toEqual([]);
  });

  it('uses compound database to auto-fill molar mass', () => {
    const r = config.calculate({ mode: 'calcMolarity', compound: 'NaOH', mass: '40', volume: '1', volumeUnit: 'L' });
    // NaOH has molar mass 40.00 g/mol, so 40g / 40 = 1 mol / 1L = 1 M
    near(parseNumber(getValue(r, 'molarityResult')), 1.0, 0.01);
  });

  it('returns empty for invalid compound', () => {
    const r = config.calculate({ mode: 'calcMolarity', mass: '10', volume: '1', volumeUnit: 'L' });
    // Missing molarMass and no valid compound
    expect(r).toEqual([]);
  });

  it('returns empty for empty inputs', () => {
    const r = config.calculate({});
    expect(r).toEqual([]);
  });
});
