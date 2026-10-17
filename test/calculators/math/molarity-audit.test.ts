import { describe, it, expect } from 'vitest';
import molarity from '../../../src/calculators/math/molarity';

// Expected values recomputed by hand / Python from the standard molar masses.
type R = { id: string; value: string }[];
const val = (r: R, id: string) => r.find((x) => x.id === id)?.value;
const run = (o: Record<string, string>) => molarity.calculate({ mode: 'calcMolarity', volumeUnit: 'L', ...o }) as R;

describe('molarity audit', () => {
  it('the compound box now drives the molar mass (a stale 58.44 default used to override H2SO4)', () => {
    expect(val(run({ compound: 'NaCl', mass: '5.844', volume: '1' }), 'molarityResult')).toBe('0.1000');
    expect(val(run({ compound: 'H2SO4', mass: '9.808', volume: '1' }), 'molarityResult')).toBe('0.1000');
    expect(val(run({ compound: 'H2SO4', mass: '9.808', volume: '1' }), 'molarMassUsed')).toBe('98.0800');
  });

  it('a molar mass you type still overrides the compound', () => {
    expect(val(run({ compound: 'NaCl', molarMass: '100', mass: '10', volume: '1' }), 'molarityResult')).toBe('0.1000');
  });

  it('any formula works, including hydrates (CuSO4·5H2O = 249.682 g/mol)', () => {
    const r = run({ compound: 'CuSO4·5H2O', mass: '24.968', volume: '1000', volumeUnit: 'mL' });
    expect(val(r, 'molarMassUsed')).toBe('249.6820');
    expect(val(r, 'molarityResult')).toBe('0.1000');
    expect(val(run({ compound: 'Ca(OH)2', mass: '7.4093', volume: '1' }), 'molarityResult')).toBe('0.1000'); // 74.093 g/mol
  });

  it('mass for 500 mL of 0.1 M NaCl is 2.922 g (the worked example)', () => {
    const r = molarity.calculate({ mode: 'calcMass', compound: 'NaCl', molarity: '0.1', volume: '500', volumeUnit: 'mL' }) as R;
    expect(val(r, 'massResult')).toBe('2.9220');
  });

  it('volume of 0.2 M that 5.844 g of NaCl makes is 0.5 L', () => {
    const r = molarity.calculate({ mode: 'calcVolume', compound: 'NaCl', molarity: '0.2', mass: '5.844' }) as R;
    expect(val(r, 'volumeResult')).toBe('0.500000');
  });

  it('dilute solutions keep significant digits instead of printing 0.0000', () => {
    expect(val(run({ compound: 'NaCl', mass: '0.0058', volume: '1' }), 'molarityResult')).toBe('0.00009925');
  });

  it('rejects negatives, junk and an unknown compound with no molar mass', () => {
    expect(run({ compound: 'NaCl', mass: '-5', volume: '1' })).toEqual([]);
    expect(run({ compound: 'NaCl', mass: '5g', volume: '1' })).toEqual([]);
    expect(run({ compound: 'Foo', mass: '5', volume: '1' })).toEqual([]);
    expect(run({ compound: 'NaCl', mass: '5', volume: '0' })).toEqual([]);
  });
});
