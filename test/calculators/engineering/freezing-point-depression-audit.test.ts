import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/engineering/freezing-point-depression';
import { getValue } from '../../helpers';

const run = (v: Record<string, string>) =>
  config.calculate({ kf: '1.86', molality: '', soluteMass: '', solventMass: '', molarMass: '', vanthoff: '1', solventFp: '', ...v });

// dTf = i Kf m. Hand-derived.
describe('freezing-point-depression audit', () => {
  it('1 molal NaCl (i=2): 3.72 C, new FP -3.72; CaCl2 (i=3): 5.58; sucrose (i=1): 1.86', () => {
    expect(getValue(run({ molality: '1', vanthoff: '2' }), 'deltaTf')).toBe('3.72°C');
    expect(getValue(run({ molality: '1', vanthoff: '2' }), 'newFP')).toBe('-3.72°C');
    expect(getValue(run({ molality: '1', vanthoff: '3' }), 'deltaTf')).toBe('5.58°C');
    expect(getValue(run({ molality: '1' }), 'deltaTf')).toBe('1.86°C');
  });
  it('molality from masses: 58.44 g NaCl / 58.44 g/mol in 1000 g water = 1 molal', () => {
    const r = run({ soluteMass: '58.44', solventMass: '1000', molarMass: '58.44', vanthoff: '2' });
    expect(getValue(r, 'deltaTf')).toBe('3.72°C');
  });
  it('antifreeze 500 g EG (62.07) in 500 g water: m = 16.11, ideal dTf = 29.97', () => {
    const r = run({ soluteMass: '500', solventMass: '500', molarMass: '62.07' });
    // 500/62.07 = 8.0554 mol; /0.5 kg = 16.1108; x 1.86 = 29.966
    expect(getValue(r, 'deltaTf')).toBe('29.97°C');
  });
  it('cryoscopy FAQ: 2 C in camphor Kf 40 -> m 0.05; 10 mg in 1 g -> 200 g/mol', () => {
    const m = 2 / 40;
    expect(m).toBeCloseTo(0.05, 10);
    expect(0.01 / (m * 0.001)).toBeCloseTo(200, 6);
    expect(getValue(run({ kf: '40', molality: '0.05' }), 'deltaTf')).toBe('2°C');
  });
  it('new freezing point uses the solvent freezing point (benzene 5.5 C, Kf 5.12, 0.5 m)', () => {
    const r = run({ kf: '5.12', molality: '0.5', solventFp: '5.5' });
    expect(getValue(r, 'deltaTf')).toBe('2.56°C');
    expect(getValue(r, 'newFP')).toBe('2.94°C'); // 5.5 - 2.56
  });
  it('invalid input returns []', () => {
    expect(run({ kf: '', molality: '1' })).toEqual([]);
    expect(run({ molality: '' })).toEqual([]);
    expect(run({ molality: '-1' })).toEqual([]);
  });
});
