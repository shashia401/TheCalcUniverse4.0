import { describe, it, expect } from 'vitest';
import eng from '../../../src/calculators/engineering/ph-calculator';
import twin from '../../../src/calculators/math/ph-calculator';
import { classifyPh } from '../../../src/calculators/engineering/ph-calculator/phMath';
import { getValue } from '../../helpers';

const fromPh = (ph: string) => eng.calculate({ mode: 'ph-to-conc', ph });
const fromH = (hConcentration: string) => eng.calculate({ mode: 'h-to-ph', hConcentration });
const fromOH = (ohConcentration: string) => eng.calculate({ mode: 'oh-to-poh', ohConcentration });

// pH = -log10[H+], pOH = 14 - pH (25 C), [OH-] = 10^-pOH. Hand-derived.
describe('ph-calculator audit', () => {
  it('pH 7: [H+] = [OH-] = 1.00 x 10^-7, neutral', () => {
    const r = fromPh('7');
    expect(getValue(r, 'hConcentration')).toBe('1.00 × 10⁻⁷ M');
    expect(getValue(r, 'ohConcentration')).toBe('1.00 × 10⁻⁷ M');
    expect(getValue(r, 'classification')).toBe('Neutral');
  });
  it('[H+] = 1e-7 is exactly neutral even though pow/log round-trips can leave 7.000000000000001', () => {
    expect(getValue(fromH('1e-7'), 'classification')).toBe('Neutral');
    expect(getValue(fromH('0.0000001'), 'ph')).toBe('7.00');
  });
  it('[OH-] = 1e-3 -> pOH 3, pH 11 (basic, not strongly)', () => {
    const r = fromOH('1e-3');
    expect(getValue(r, 'poh')).toBe('3.00');
    expect(getValue(r, 'ph')).toBe('11.00');
    expect(getValue(r, 'classification')).toBe('Basic');
  });
  it('2 M HCl: pH = -log10(2) = -0.30 and the panel value keeps its minus sign', () => {
    const r = fromH('2');
    expect(getValue(r, 'ph')).toBe('-0.30');
    expect(getValue(r, 'poh')).toBe('14.30');
  });
  it('classification boundaries on the displayed value (2.996 -> 3.00 -> Acidic; 11.004 -> 11.00 -> Basic)', () => {
    expect(classifyPh(2.996)).toBe('Acidic');
    expect(classifyPh(2.99)).toBe('Strongly acidic');
    expect(classifyPh(3)).toBe('Acidic');
    expect(classifyPh(11.004)).toBe('Basic');
    expect(classifyPh(11.01)).toBe('Strongly basic');
    expect(classifyPh(7.004)).toBe('Neutral');
  });
  it('absurd concentrations are rejected instead of printing 10^306 M', () => {
    expect(fromH('1e-320')).toEqual([]);
    expect(fromH('0')).toEqual([]);
    expect(fromPh('15')).toEqual([]);
  });
  it('TWIN AGREEMENT: math/ph-calculator and engineering/ph-calculator give the same pH, pOH, [H+] and class', () => {
    for (const ph of [0, 1.5, 2.99, 3, 5, 6.999, 7, 7.5, 10.5, 11, 12.3, 14]) {
      const e = fromPh(String(ph));
      const m = twin.calculate({ mode: 'ph-to-h', phInput: String(ph) });
      expect(getValue(m, 'phValue')).toBe(getValue(e, 'ph'));
      expect(getValue(m, 'pohValue')).toBe(getValue(e, 'poh'));
      expect(getValue(m, 'classification')).toBe(getValue(e, 'classification'));
    }
    const eH = fromH('1e-3');
    const mH = twin.calculate({ mode: 'h-to-ph', hconcentration: '0.001' });
    expect(getValue(mH, 'phValue')).toBe(getValue(eH, 'ph'));
    expect(getValue(mH, 'classification')).toBe(getValue(eH, 'classification'));
  });
});
