import { describe, it, expect } from 'vitest';
import eng from '../../../src/calculators/engineering/ohms-law';
import twin from '../../../src/calculators/math/ohms-law';
import { solvePair } from '../../../src/calculators/engineering/ohms-law/ohmsMath';
import { getValue, parseNumber, near } from '../../helpers';

const e = (solveFor: string, voltage = '', current = '', resistance = '') => eng.calculate({ solveFor, voltage, current, resistance });
const m = (value1: string, num1: string, value2: string, num2: string) =>
  twin.calculate({ value1, num1, value2, num2, powerOfTen: 'raw' });

describe('ohms-law audit (V = I R, P = V I = I^2 R = V^2 / R)', () => {
  it('educational examples: bulb 60 W @120 V -> 0.5 A, 240 ohm; 100 W -> 0.8333 A, 144 ohm', () => {
    const s = solvePair('V', 120, 'P', 60)!;
    near(s.I, 0.5, 1e-12); near(s.R, 240, 1e-9);
    const t = solvePair('V', 120, 'P', 100)!;
    near(t.I, 0.83333, 1e-4); near(t.R, 144, 1e-9);
  });
  it('LED resistor: (5 - 2) V / 20 mA = 150 ohm, 0.06 W; 100 ohm passes 30 mA', () => {
    const r = e('resistance', '3', '0.02');
    expect(getValue(r, 'resistance')).toBe('150 Ω');
    expect(getValue(r, 'power')).toBe('0.06 W');
    expect(3 / 100).toBeCloseTo(0.03, 10);
    expect(3 / 250).toBeCloseTo(0.012, 10);
  });
  it('food truck: 3,480 W at 120 V = 29 A; existing load 1,980 W = 16.5 A', () => {
    expect(3480 / 120).toBeCloseTo(29, 10);
    expect(1980 / 120).toBeCloseTo(16.5, 10);
    near(parseNumber(getValue(e('current', '120', '', '4.1379310345'), 'current')), 29, 1e-3);
  });
  it('solar shed: 24 + 60 + 45 = 129 W -> 10.75 A at 12 V; 150 W panel at 77% = 9.6 A; 50 Ah / 10.75 = 4.65 h', () => {
    expect(24 + 60 + 45).toBe(129);
    near(parseNumber(getValue(e('power', '12', '10.75'), 'power')), 129, 1e-9);
    expect((150 * 0.77) / 12).toBeCloseTo(9.625, 3);
    expect(50 / 10.75).toBeCloseTo(4.65, 2);
  });
  it('extension-cord FAQ: 14 AWG 2.525 ohm/1000 ft, 200 ft conductor, 10 A -> 5.05 V', () => {
    expect(((2.525 * 200) / 1000) * 10).toBeCloseTo(5.05, 2);
  });
  it('zero inputs: V = 0 with R > 0 gives 0 A; R = 0 and I = 0 are rejected where undefined', () => {
    expect(getValue(e('current', '0', '', '10'), 'current')).toBe('0 A');
    expect(e('current', '10', '', '0')).toEqual([]);
    expect(e('resistance', '10', '0', '')).toEqual([]);
    expect(getValue(e('power', '0', '0'), 'power')).toBe('0 W');
    expect(getValue(e('power', '12', '0'), 'resistance')).toBe('N/A');
  });
  it('TWIN AGREEMENT: engineering and math/ohms-law give identical V, I, R, P on the same physical inputs', () => {
    const cases: [string, number, string, number][] = [
      ['V', 12, 'I', 2], ['V', 120, 'R', 60], ['I', 3, 'R', 4], ['V', 230, 'P', 1000], ['I', 0.5, 'P', 60], ['R', 8, 'P', 100],
    ];
    for (const [a, va, b, vb] of cases) {
      const r = m(a, String(va), b, String(vb));
      const s = solvePair(a as 'V', va, b as 'V', vb)!;
      near(parseNumber(getValue(r, 'voltage')), s.V, 1e-5);
      near(parseNumber(getValue(r, 'current')), s.I, 1e-5);
      near(parseNumber(getValue(r, 'resistance')), s.R, 1e-5);
      near(parseNumber(getValue(r, 'power')), s.P, 1e-5);
    }
    // and the engineering UI path gives the same numbers as the twin for V + R
    const eng2 = e('current', '120', '', '60');
    const twin2 = m('V', '120', 'R', '60');
    expect(getValue(eng2, 'current')).toBe(getValue(twin2, 'current'));
    expect(getValue(eng2, 'power')).toBe(getValue(twin2, 'power'));
  });
  it('math twin still rejects non-positive input and identical variables', () => {
    expect(m('V', '0', 'I', '2')).toEqual([]);
    expect(m('V', '5', 'V', '2')).toEqual([]);
  });
});
