import { describe, it, expect } from 'vitest';
import mw from '../../../src/calculators/math/molecular-weight';

// Expected sums were worked out by hand from the same standard atomic weights (and re-added in Python).
type R = { id: string; value: string }[];
const run = (formula: string) => mw.calculate({ formula }) as R;
const weight = (formula: string) => run(formula).find((x) => x.id === 'molecularWeight')?.value;
const breakdown = (formula: string) =>
  JSON.parse(run(formula).find((x) => x.id === '_elementBreakdown')!.value) as { element: string; count: number; percentage: number }[];

describe('molecular-weight audit', () => {
  it('textbook compounds', () => {
    expect(weight('H2O')).toBe('18.015');
    expect(weight('C6H12O6')).toBe('180.156'); // glucose, worked example in the text
    expect(weight('(NH4)2SO4')).toBe('132.139');
    expect(weight('Ca(NO3)2')).toBe('164.086');
    expect(weight('Fe4[Fe(CN)6]3')).toBe('859.239'); // nested brackets
  });

  it('hydrates: 5 H2O in CuSO4.5H2O = 249.682 (the text claimed 249.684)', () => {
    for (const f of ['CuSO4·5H2O', 'CuSO4.5H2O', 'CuSO4 + 5H2O', 'CuSO₄·5H₂O']) expect(weight(f)).toBe('249.682');
    const units = run('CuSO4·5H2O').find((x) => x.id === 'formulaUnits')?.value;
    expect(units).toBe('5 H₂O');
  });

  it('double salts with several parts: alum K2SO4·Al2(SO4)3·24H2O = 948.764 (used to return nothing)', () => {
    expect(weight('K2SO4·Al2(SO4)3·24H2O')).toBe('948.764');
    expect(run('K2SO4·Al2(SO4)3·24H2O').find((x) => x.id === 'formulaUnits')?.value).toBe('1 Al₂(SO₄)₃ + 24 H₂O');
  });

  it('elements that were missing from the old 42-element table', () => {
    expect(weight('SnCl2')).toBe('189.616');
    expect(weight('UO2')).toBe('270.027');
    expect(weight('WC')).toBe('195.851');
    expect(weight('GaAs')).toBe('144.645');
  });

  it('repeated elements are merged in the breakdown (acetic acid CH3COOH was listed as C, H, C, O, O, H)', () => {
    const b = breakdown('CH3COOH');
    expect(b.map((x) => x.element)).toEqual(['C', 'H', 'O']);
    expect(b.map((x) => x.count)).toEqual([2, 4, 2]);
    expect(weight('CH3COOH')).toBe('60.052');
    expect(b.reduce((s, x) => s + x.percentage, 0)).toBeCloseTo(100, 9);
  });

  it('hydrate water is merged into the element totals', () => {
    const b = breakdown('CuSO4·5H2O');
    expect(b.find((x) => x.element === 'O')?.count).toBe(9);
    expect(b.find((x) => x.element === 'H')?.count).toBe(10);
  });

  it('rejects what it cannot read instead of guessing', () => {
    for (const bad of ['', 'Xx', 'nacl', 'Mg(OH', 'Mg)OH(', '2H2O', 'H2O·', 'H0', 'C1000001', 'H2O2!', 'Na+', 'D2O']) {
      expect(run(bad)).toEqual([]);
    }
  });
});
