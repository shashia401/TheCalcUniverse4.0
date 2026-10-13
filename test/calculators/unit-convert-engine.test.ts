import { describe, it, expect } from 'vitest';
import { convertUnits, formatQty, parseQty, runConversion, GAL_US_L, LBF_N, FTLBF_J, type UnitDef } from '../../src/utils/unitConvert';

const m: UnitDef = { value: 'm', label: 'Meter', shortLabel: 'm', factor: 1 };
const ft: UnitDef = { value: 'ft', label: 'Foot', shortLabel: 'ft', factor: 0.3048 };
const c: UnitDef = { value: 'c', label: 'C', shortLabel: 'C', factor: 1, toBase: (v) => v + 273.15, fromBase: (k) => k - 273.15 };
const f: UnitDef = { value: 'f', label: 'F', shortLabel: 'F', factor: 1, toBase: (v) => ((v + 459.67) * 5) / 9, fromBase: (k) => (k * 9) / 5 - 459.67 };

describe('unitConvert engine', () => {
  it('converts linear units through the base unit', () => {
    expect(convertUnits(1, ft, m)).toBeCloseTo(0.3048, 12); // 1 ft = 0.3048 m exactly (1959 agreement)
    expect(convertUnits(10, m, ft)).toBeCloseTo(32.8083989501, 9);
  });
  it('converts affine units', () => {
    expect(convertUnits(100, c, f)).toBeCloseTo(212, 9);
    expect(convertUnits(-40, c, f)).toBeCloseTo(-40, 9);
  });
  it('exact defining constants (NIST SP 811)', () => {
    expect(GAL_US_L).toBeCloseTo(3.785411784, 12);
    expect(LBF_N).toBeCloseTo(4.4482216152605, 12);
    expect(FTLBF_J).toBeCloseTo(1.3558179483314004, 12);
  });
  it('parseQty is strict', () => {
    expect(parseQty('12abc')).toBeNull();
    expect(parseQty('')).toBeNull();
    expect(parseQty(' 1e3 ')).toBe(1000);
    expect(parseQty('1e999')).toBeNull();
    expect(parseQty(undefined)).toBeNull();
  });
  it('formatQty: noise stripped, whole numbers exact, tiny numbers in scientific notation', () => {
    expect(formatQty(212.00000000000006)).toBe('212');
    expect(formatQty(1099511627776)).toBe('1,099,511,627,776');
    expect(formatQty(1 / 3)).toBe('0.33333333');
    expect(formatQty(1.602176634e-19)).toBe('1.602177e-19');
    expect(formatQty(0)).toBe('0');
    expect(formatQty(NaN)).toBe('');
  });
  it('runConversion returns null for unknown units / overflow', () => {
    expect(runConversion('1', [m, ft], 'm', 'zz')).toBeNull();
    expect(runConversion('1e308', [{ ...m, factor: 1e10 }, m], 'm', 'm')).toBeNull();
    expect(runConversion('2', [m, ft], 'ft', 'm')?.result).toBeCloseTo(0.6096, 12);
  });
});
