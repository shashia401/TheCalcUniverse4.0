import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/engineering/ph-calculator/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('pH calculator input showWhen', () => {
  it('shows ph field only in ph-to-conc mode', () => {
    const phField = config.inputs.find((i) => i.id === 'ph')!;
    expect(phField.showWhen!({ mode: 'ph-to-conc' })).toBe(true);
    expect(phField.showWhen!({ mode: 'h-to-ph' })).toBe(false);
    expect(phField.showWhen!({ mode: 'oh-to-poh' })).toBe(false);
  });

  it('shows hConcentration field only in h-to-ph mode', () => {
    const hField = config.inputs.find((i) => i.id === 'hConcentration')!;
    expect(hField.showWhen!({ mode: 'h-to-ph' })).toBe(true);
    expect(hField.showWhen!({ mode: 'ph-to-conc' })).toBe(false);
  });

  it('shows ohConcentration field only in oh-to-poh mode', () => {
    const ohField = config.inputs.find((i) => i.id === 'ohConcentration')!;
    expect(ohField.showWhen!({ mode: 'oh-to-poh' })).toBe(true);
    expect(ohField.showWhen!({ mode: 'ph-to-conc' })).toBe(false);
  });
});

describe('pH Calculator', () => {
  it('pH 7 → [H+] = 1e-7, pOH = 7, neutral', () => {
    const results = config.calculate({ mode: 'ph-to-conc', ph: '7' });
    near(parseNumber(getValue(results, 'ph')), 7);
    near(parseNumber(getValue(results, 'poh')), 7);
    expect(getValue(results, 'hConcentration')).toBe('1.00 × 10⁻⁷ M');
    expect(getValue(results, 'ohConcentration')).toBe('1.00 × 10⁻⁷ M');
    expect(getValue(results, 'classification')).toBe('Neutral');
  });

  it('pH 3 → [H+] = 1e-3, acidic', () => {
    const results = config.calculate({ mode: 'ph-to-conc', ph: '3' });
    near(parseNumber(getValue(results, 'ph')), 3);
    expect(getValue(results, 'hConcentration')).toBe('1.00 × 10⁻³ M');
    expect(getValue(results, 'classification')).toContain('Acidic');
  });

  it('[H+] = 0.001 (1e-3) → pH 3', () => {
    const results = config.calculate({ mode: 'h-to-ph', hConcentration: '0.001' });
    near(parseNumber(getValue(results, 'ph')), 3);
    near(parseNumber(getValue(results, 'poh')), 11);
    expect(getValue(results, 'classification')).toContain('Acidic');
  });

  it('[OH-] = 1e-4 → pOH 4, pH 10, basic', () => {
    const results = config.calculate({ mode: 'oh-to-poh', ohConcentration: '1e-4' });
    near(parseNumber(getValue(results, 'poh')), 4);
    near(parseNumber(getValue(results, 'ph')), 10);
    expect(getValue(results, 'classification')).toContain('Basic');
  });

  it('pH 0 → [H+] = 1, extreme acid', () => {
    const results = config.calculate({ mode: 'ph-to-conc', ph: '0' });
    near(parseNumber(getValue(results, 'ph')), 0);
    expect(getValue(results, 'hConcentration')).toBe('1.00 M');
    expect(getValue(results, 'classification')).toContain('Strong Acid');
  });

  it('pH 14 → [H+] = 1e-14, strong base', () => {
    const results = config.calculate({ mode: 'ph-to-conc', ph: '14' });
    near(parseNumber(getValue(results, 'ph')), 14);
    expect(getValue(results, 'hConcentration')).toBe('1.00 × 10⁻¹⁴ M');
    expect(getValue(results, 'classification')).toContain('Strong Base');
  });

  it('empty input → returns []', () => {
    const results = config.calculate({ mode: 'ph-to-conc', ph: '' });
    expect(results).toEqual([]);
  });

  it('bad input (NaN) → returns []', () => {
    const results = config.calculate({ mode: 'h-to-ph', hConcentration: 'abc' });
    expect(results).toEqual([]);
  });

  it('invalid mode → returns []', () => {
    const results = config.calculate({ mode: 'unknown', ph: '7' });
    expect(results).toEqual([]);
  });

  it('pH 12 → strong base classification', () => {
    const results = config.calculate({ mode: 'ph-to-conc', ph: '12' });
    expect(getValue(results, 'classification')).toBe('Basic/Alkaline (Strong Base)');
  });

  it('[H+] = 0 → returns [] (zero concentration)', () => {
    const results = config.calculate({ mode: 'h-to-ph', hConcentration: '0' });
    expect(results).toEqual([]);
  });

  it('[OH-] = 0 → returns [] (zero concentration)', () => {
    const results = config.calculate({ mode: 'oh-to-poh', ohConcentration: '0' });
    expect(results).toEqual([]);
  });

  it('negative pH input → returns []', () => {
    const results = config.calculate({ mode: 'ph-to-conc', ph: '-1' });
    expect(results).toEqual([]);
  });
});
