import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/ohms-law/index';
import { getValue } from '../../helpers';

function getNum(results: {id:string;value:string}[], id:string): number {
  const v = getValue(results, id);
  const m = /([\d.]+)/.exec(v);
  if (!m) throw new Error(`Cannot parse number from "${v}"`);
  return parseFloat(m[1]);
}

function near(actual: number, expected: number, tol = 0.01): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tol);
}

describe('Ohm\'s Law Calculator', () => {
  // ─── V & I → R, P ──────────────────────────────────────────────────────

  it('V=12, I=2 → R=6, P=24', () => {
    const r = config.calculate({ value1: 'V', num1: '12', value2: 'I', num2: '2', powerOfTen: 'raw' });
    near(getNum(r, 'resistance'), 6);
    near(getNum(r, 'power'), 24);
    expect(getValue(r, 'usedFormulas')).toContain('R = V / I');
  });

  // ─── V & R → I, P ──────────────────────────────────────────────────────

  it('V=120, R=60 → I=2, P=240', () => {
    const r = config.calculate({ value1: 'V', num1: '120', value2: 'R', num2: '60', powerOfTen: 'raw' });
    near(getNum(r, 'current'), 2);
    near(getNum(r, 'power'), 240);
    expect(getValue(r, 'usedFormulas')).toContain('I = V / R');
  });

  // ─── V & P → I, R ──────────────────────────────────────────────────────

  it('V=120, P=240 → I=2, R=60', () => {
    const r = config.calculate({ value1: 'V', num1: '120', value2: 'P', num2: '240', powerOfTen: 'raw' });
    near(getNum(r, 'current'), 2);
    near(getNum(r, 'resistance'), 60);
    expect(getValue(r, 'usedFormulas')).toContain('I = P / V');
  });

  // ─── I & R → V, P ──────────────────────────────────────────────────────

  it('I=2, R=60 → V=120, P=240', () => {
    const r = config.calculate({ value1: 'I', num1: '2', value2: 'R', num2: '60', powerOfTen: 'raw' });
    near(getNum(r, 'voltage'), 120);
    near(getNum(r, 'power'), 240);
    expect(getValue(r, 'usedFormulas')).toContain('V = I × R');
  });

  // ─── I & P → V, R ──────────────────────────────────────────────────────

  it('I=2, P=240 → V=120, R=60', () => {
    const r = config.calculate({ value1: 'I', num1: '2', value2: 'P', num2: '240', powerOfTen: 'raw' });
    near(getNum(r, 'voltage'), 120);
    near(getNum(r, 'resistance'), 60);
    expect(getValue(r, 'usedFormulas')).toContain('V = P / I');
  });

  // ─── R & P → V, I ──────────────────────────────────────────────────────

  it('R=60, P=240 → V≈120, I=2', () => {
    const r = config.calculate({ value1: 'R', num1: '60', value2: 'P', num2: '240', powerOfTen: 'raw' });
    near(getNum(r, 'voltage'), 119.99, 0.1);
    near(getNum(r, 'current'), 2);
    expect(getValue(r, 'usedFormulas')).toContain('V = √(P × R)');
  });

  // ─── Invalid: same variable twice ──────────────────────────────────────

  it('returns empty when both values are the same variable', () => {
    const r = config.calculate({ value1: 'V', num1: '12', value2: 'V', num2: '24', powerOfTen: 'raw' });
    expect(r).toEqual([]);
  });

  // ─── Missing values ─────────────────────────────────────────────────────

  it('returns empty when num1 is missing', () => {
    const r = config.calculate({ value1: 'V', value2: 'I', num2: '2', powerOfTen: 'raw' });
    expect(r).toEqual([]);
  });

  it('returns empty when num2 is missing', () => {
    const r = config.calculate({ value1: 'V', num1: '12', value2: 'I', powerOfTen: 'raw' });
    expect(r).toEqual([]);
  });

  // ─── Zero values ────────────────────────────────────────────────────────

  it('returns empty for zero num1', () => {
    const r = config.calculate({ value1: 'V', num1: '0', value2: 'I', num2: '2', powerOfTen: 'raw' });
    expect(r).toEqual([]);
  });

  it('returns empty for zero num2', () => {
    const r = config.calculate({ value1: 'V', num1: '12', value2: 'I', num2: '0', powerOfTen: 'raw' });
    expect(r).toEqual([]);
  });

  // ─── Very small values ─────────────────────────────────────────────────

  it('handles very small values (milliamp range)', () => {
    const r = config.calculate({ value1: 'V', num1: '0.005', value2: 'I', num2: '0.002', powerOfTen: 'auto' });
    expect(r.length).toBeGreaterThan(0);
    expect(getValue(r, 'resistance')).toContain('Ω');
    expect(getValue(r, 'power')).toContain('W');
  });

  // ─── Prefix formatting ──────────────────────────────────────────────────

  it('uses metric prefixes in auto mode for large values', () => {
    const r = config.calculate({ value1: 'V', num1: '10000', value2: 'I', num2: '2', powerOfTen: 'auto' });
    expect(getValue(r, 'power')).toContain('kW');
  });

  it('uses raw mode when selected', () => {
    const r = config.calculate({ value1: 'V', num1: '10000', value2: 'I', num2: '2', powerOfTen: 'raw' });
    expect(getValue(r, 'power')).toContain('W');
    expect(getValue(r, 'power')).not.toContain('kW');
  });

  // ─── Formula text ───────────────────────────────────────────────────────

  it('shows correct formula text for each known pair', () => {
    // V & R
    let r = config.calculate({ value1: 'V', num1: '10', value2: 'R', num2: '5', powerOfTen: 'raw' });
    expect(getValue(r, 'usedFormulas')).toBe('I = V / R, P = V² / R');

    // R & P
    r = config.calculate({ value1: 'R', num1: '10', value2: 'P', num2: '40', powerOfTen: 'raw' });
    expect(getValue(r, 'usedFormulas')).toBe('V = √(P × R), I = √(P / R)');
  });

  // ─── Reversed order ─────────────────────────────────────────────────────

  it('handles reversed input order (I,V instead of V,I)', () => {
    const r = config.calculate({ value1: 'I', num1: '2', value2: 'V', num2: '12', powerOfTen: 'raw' });
    near(getNum(r, 'resistance'), 6);
    near(getNum(r, 'power'), 24);
  });

  // ─── All four values always shown ───────────────────────────────────────

  it('always shows voltage, current, resistance, and power results', () => {
    const r = config.calculate({ value1: 'V', num1: '12', value2: 'I', num2: '2', powerOfTen: 'raw' });
    expect(getValue(r, 'voltage')).toBeTruthy();
    expect(getValue(r, 'current')).toBeTruthy();
    expect(getValue(r, 'resistance')).toBeTruthy();
    expect(getValue(r, 'power')).toBeTruthy();
  });

  // ─── Highlight flags ──────────────────────────────────────────────────

  it('marks computed values as highlight=true', () => {
    const r = config.calculate({ value1: 'V', num1: '12', value2: 'I', num2: '2', powerOfTen: 'raw' });
    const resistance = r.find((x) => x.id === 'resistance');
    const power = r.find((x) => x.id === 'power');
    expect(resistance?.highlight).toBe(true);
    expect(power?.highlight).toBe(true);
    const voltage = r.find((x) => x.id === 'voltage');
    expect(voltage?.highlight).toBe(false);
  });

  // ─── Pie chart data ─────────────────────────────────────────────────────

  it('includes pie chart data with known variables', () => {
    const r = config.calculate({ value1: 'V', num1: '12', value2: 'R', num2: '6', powerOfTen: 'raw' });
    const pie = getValue(r, 'pieData');
    const parsed = JSON.parse(pie);
    expect(parsed).toEqual(['V', 'R']);
  });
});
