import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/engineering/wire-gauge';
import { AMPACITY, OHMS_PER_KFT, AWG_SIZES, conduitDerating } from '../../../src/calculators/engineering/wire-gauge/awgData';
import { getResult, getValue } from '../../helpers';

const run = (v: Record<string, string>) =>
  config.calculate({ current: '', loadType: 'normal', conductorMaterial: 'copper', insulationType: '75', numConductors: '1', ...v });

// Ampacity: NEC Table 310.16; small-conductor caps: NEC 240.4(D); derating: NEC 310.15(C)(1); continuous 125%.
describe('wire-gauge audit', () => {
  it('table spot checks against NEC 310.16 (copper 90C 3 AWG = 115, 1 AWG = 145; 4/0 = 195/230/260; Al 4/0 = 180)', () => {
    expect(AMPACITY.copper90['3']).toBe(115);
    expect(AMPACITY.copper90['1']).toBe(145);
    expect([AMPACITY.copper60['4/0'], AMPACITY.copper75['4/0'], AMPACITY.copper90['4/0'], AMPACITY.aluminum75['4/0']]).toEqual([195, 230, 260, 180]);
  });
  it('resistances equal NEC Chapter 9 Table 8 (stranded Cu 12 AWG 1.98, Al 12 AWG 3.25, no 14 AWG Al)', () => {
    expect(OHMS_PER_KFT.copper['12']).toBe(1.98);
    expect(OHMS_PER_KFT.aluminum['12']).toBe(3.25);
    expect(OHMS_PER_KFT.aluminum['14']).toBeUndefined();
    expect(AWG_SIZES.length).toBe(13);
  });
  it('20 A at 75C copper: 12 AWG (14 AWG is 20A on paper but capped at 15A by 240.4(D))', () => {
    expect(getValue(run({ current: '20' }), 'recommended')).toContain('12 AWG');
    expect(getValue(run({ current: '15' }), 'recommended')).toContain('14 AWG');
  });
  it('worked example 1: 20A, 4 conductors -> design 25A, 12 AWG', () => {
    const r = run({ current: '20', numConductors: '4' });
    expect(getValue(r, 'designCurrent')).toBe('25.0 A');
    expect(getValue(r, 'recommended')).toContain('12 AWG');
  });
  it('worked example 2: 50A continuous EV circuit -> 62.5A design -> 6 AWG (65A); non-continuous would be 8 AWG', () => {
    const c = run({ current: '50', loadType: 'continuous' });
    expect(getValue(c, 'designCurrent')).toContain('62.5 A');
    expect(getValue(c, 'recommended')).toContain('6 AWG (copper) — 65A');
    expect(getValue(run({ current: '50' }), 'recommended')).toContain('8 AWG');
  });
  it('worked example 3: 30A aluminum with 4 conductors -> 37.5A -> 8 AWG Al (40A)', () => {
    const r = run({ current: '30', conductorMaterial: 'aluminum', numConductors: '4' });
    expect(getValue(r, 'designCurrent')).toBe('37.5 A');
    expect(getValue(r, 'recommended')).toContain('8 AWG (aluminum) — 40A');
  });
  it('explanation: 50A, 4-6 conductors -> 52A ok on 6 AWG; 7 conductors -> 45.5A needs 4 AWG', () => {
    expect(65 * 0.8).toBeCloseTo(52, 10);
    expect(65 * 0.7).toBeCloseTo(45.5, 10);
    expect(getValue(run({ current: '50', numConductors: '4' }), 'recommended')).toContain('6 AWG');
    expect(getValue(run({ current: '50', numConductors: '7' }), 'recommended')).toContain('4 AWG');
  });
  it('derating steps 310.15(C)(1)', () => {
    expect([1, 3, 4, 6, 7, 9, 10, 20, 21, 30, 31, 40, 41].map(conduitDerating)).toEqual([1, 1, 0.8, 0.8, 0.7, 0.7, 0.5, 0.5, 0.45, 0.45, 0.4, 0.4, 0.35]);
    expect(getValue(run({ current: '20', numConductors: '41' }), 'derating')).toBe('35%');
  });
  it('90C column carries a terminal-temperature warning', () => {
    expect(getResult(run({ current: '30', insulationType: '90' }), 'recommended').warning).toMatch(/110.14/);
    expect(getResult(run({ current: '30' }), 'recommended').warning).toBeUndefined();
  });
  it('too large for 4/0 gives the error row; invalid input returns []', () => {
    expect(getValue(run({ current: '400' }), 'error')).toMatch(/4\/0/);
    expect(run({ current: '0' })).toEqual([]);
  });
});
