import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/weight/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Weight Calculator', () => {
  it('calculates weight from mass and gravity (Earth)', () => {
    const results = config.calculate({
      mode: 'calcWeight',
      mass: '70',
      massUnit: 'kg',
      gravitySelect: 'Earth',
      gravityCustom: '',
      weight: '',
    });
    const weight = parseNumber(getValue(results, 'result'));
    near(weight, 686.7); // 70 * 9.81 = 686.7
    expect(getValue(results, 'formula')).toBe('W = m × g');
  });

  it('calculates weight on the Moon', () => {
    const results = config.calculate({
      mode: 'calcWeight',
      mass: '70',
      massUnit: 'kg',
      gravitySelect: 'Moon',
      gravityCustom: '',
      weight: '',
    });
    const weight = parseNumber(getValue(results, 'result'));
    near(weight, 113.4); // 70 * 1.62 = 113.4
  });

  it('calculates weight on Mars', () => {
    const results = config.calculate({
      mode: 'calcWeight',
      mass: '70',
      massUnit: 'kg',
      gravitySelect: 'Mars',
      gravityCustom: '',
      weight: '',
    });
    const weight = parseNumber(getValue(results, 'result'));
    near(weight, 259.7); // 70 * 3.71 = 259.7
  });

  it('calculates mass from weight and gravity', () => {
    const results = config.calculate({
      mode: 'calcMass',
      mass: '',
      massUnit: 'kg',
      gravitySelect: 'Earth',
      gravityCustom: '',
      weight: '686.7',
    });
    const mass = parseNumber(getValue(results, 'result'));
    near(mass, 70); // 686.7 / 9.81 = 70
    expect(getValue(results, 'formula')).toBe('m = W / g');
  });

  it('calculates gravity from mass and weight', () => {
    const results = config.calculate({
      mode: 'calcGravity',
      mass: '70',
      massUnit: 'kg',
      gravitySelect: 'Earth',
      gravityCustom: '',
      weight: '686.7',
    });
    const g = parseNumber(getValue(results, 'result'));
    near(g, 9.81);
    expect(getValue(results, 'formula')).toBe('g = W / m');
  });

  it('handles custom gravity value', () => {
    const results = config.calculate({
      mode: 'calcWeight',
      mass: '10',
      massUnit: 'kg',
      gravitySelect: 'custom',
      gravityCustom: '5.0',
      weight: '',
    });
    const weight = parseNumber(getValue(results, 'result'));
    near(weight, 50); // 10 * 5 = 50
  });

  it('returns empty for missing required inputs (calcWeight)', () => {
    const results = config.calculate({
      mode: 'calcWeight',
      mass: '',
      massUnit: 'kg',
      gravitySelect: 'Earth',
      gravityCustom: '',
      weight: '',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for zero gravity in custom mode', () => {
    const results = config.calculate({
      mode: 'calcWeight',
      mass: '70',
      massUnit: 'kg',
      gravitySelect: 'custom',
      gravityCustom: '0',
      weight: '',
    });
    expect(results).toEqual([]);
  });

  it('converts pounds to kg for mass input', () => {
    const results = config.calculate({
      mode: 'calcWeight',
      mass: '154.3',
      massUnit: 'lb',
      gravitySelect: 'Earth',
      gravityCustom: '',
      weight: '',
    });
    // 154.3 lb ≈ 70 kg, weight = 70 * 9.81 ≈ 686.7 (allow 0.5 tolerance for lb→kg rounding)
    const weight = parseNumber(getValue(results, 'result'));
    near(weight, 686.7, 0.5);
  });

  it('returns error for zero mass in calcGravity', () => {
    const results = config.calculate({
      mode: 'calcGravity',
      mass: '0',
      massUnit: 'kg',
      gravitySelect: 'Earth',
      gravityCustom: '',
      weight: '686.7',
    });
    expect(getValue(results, 'error')).toContain('greater than 0');
  });
});
