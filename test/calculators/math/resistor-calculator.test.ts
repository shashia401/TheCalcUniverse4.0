import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/resistor';
import { getValue, parseNumber, near } from '../../helpers';

describe('Resistor Calculator', () => {
  // ── Forward mode: 4-band ──────────────────────────────────────────────
  it('decodes Brown-Black-Red-Gold as 1 kΩ ±5%', () => {
    const r = config.calculate({
      mode: 'forward', bands: '4',
      band1: 'Brown', band2: 'Black',
      multiplier: 'Red', tolerance: 'Gold (±5%)',
    });
    const val = getValue(r, 'resistance');
    expect(val).toContain('kΩ');
    near(parseNumber(val), 1, 0.01);
    expect(getValue(r, 'tolerance')).toBe('±5%');
  });

  it('decodes Yellow-Violet-Orange-Silver as 47 kΩ ±10%', () => {
    const r = config.calculate({
      mode: 'forward', bands: '4',
      band1: 'Yellow', band2: 'Violet',
      multiplier: 'Orange', tolerance: 'Silver (±10%)',
    });
    near(parseNumber(getValue(r, 'resistance')), 47, 0.1);
    expect(getValue(r, 'tolerance')).toBe('±10%');
  });

  it('decodes Red-Red-Red-Gold as 2.2 kΩ', () => {
    const r = config.calculate({
      mode: 'forward', bands: '4',
      band1: 'Red', band2: 'Red',
      multiplier: 'Red', tolerance: 'Gold (±5%)',
    });
    near(parseNumber(getValue(r, 'resistance')), 2.2, 0.01);
  });

  it('decodes Green-Blue-Yellow-None as 560 kΩ ±20%', () => {
    const r = config.calculate({
      mode: 'forward', bands: '4',
      band1: 'Green', band2: 'Blue',
      multiplier: 'Yellow', tolerance: 'None (±20%)',
    });
    near(parseNumber(getValue(r, 'resistance')), 560, 1);
  });

  // ── Forward mode: 5-band ──────────────────────────────────────────────
  it('decodes Brown-Black-Black-Red-Brown as 10 kΩ ±1% (5-band)', () => {
    const r = config.calculate({
      mode: 'forward', bands: '5',
      band1: 'Brown', band2: 'Black', band3: 'Black',
      multiplier: 'Red', tolerance: 'Brown (±1%)',
    });
    near(parseNumber(getValue(r, 'resistance')), 10, 0.1);
    expect(getValue(r, 'tolerance')).toBe('±1%');
  });

  it('decodes Orange-Orange-Red-Orange-Brown as 33.2 kΩ (5-band)', () => {
    const r = config.calculate({
      mode: 'forward', bands: '5',
      band1: 'Orange', band2: 'Orange', band3: 'Red',
      multiplier: 'Orange', tolerance: 'Brown (±1%)',
    });
    near(parseNumber(getValue(r, 'resistance')), 332, 0.5);
  });

  // ── Forward mode: 6-band ──────────────────────────────────────────────
  it('decodes a 6-band resistor with temp coefficient', () => {
    const r = config.calculate({
      mode: 'forward', bands: '6',
      band1: 'Brown', band2: 'Black', band3: 'Black',
      multiplier: 'Red', tolerance: 'Brown (±1%)',
      tempCo: 'Brown (100)',
    });
    near(parseNumber(getValue(r, 'resistance')), 10, 0.1);
    expect(getValue(r, 'tempCoef')).toContain('100');
  });

  // ── Reverse mode: ohms → colors ───────────────────────────────────────
  it('reverse: 4700 Ω yields Yellow-Violet-Red for 4-band', () => {
    const r = config.calculate({
      mode: 'reverse', targetOhms: '4700', reverseBands: '4',
    });
    const bands = JSON.parse(getValue(r, 'colorBands'));
    expect(bands[0]).toBe('Yellow');
    expect(bands[1]).toBe('Violet');
    expect(bands[2]).toBe('Red'); // x100 multiplier
  });

  it('reverse: 1000 Ω yields Brown-Black-Red for 4-band', () => {
    const r = config.calculate({
      mode: 'reverse', targetOhms: '1000', reverseBands: '4',
    });
    const bands = JSON.parse(getValue(r, 'colorBands'));
    expect(bands[0]).toBe('Brown');
    expect(bands[1]).toBe('Black');
    expect(bands[2]).toBe('Red');
  });

  it('reverse: produces E12 match for 4-band request', () => {
    const r = config.calculate({
      mode: 'reverse', targetOhms: '4700', reverseBands: '4',
    });
    expect(getValue(r, 'closestStandard')).toContain('E12');
  });

  it('reverse: produces E24 match for 5-band request', () => {
    const r = config.calculate({
      mode: 'reverse', targetOhms: '4700', reverseBands: '5',
    });
    expect(getValue(r, 'closestStandard')).toContain('E24');
  });

  // ── Edge cases ────────────────────────────────────────────────────────
  it('returns empty for missing band1 in forward mode', () => {
    const r = config.calculate({
      mode: 'forward', bands: '4',
      band1: '', band2: 'Black',
      multiplier: 'Red', tolerance: 'Gold (±5%)',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for missing band2 in forward mode', () => {
    const r = config.calculate({
      mode: 'forward', bands: '4',
      band1: 'Brown', band2: '',
      multiplier: 'Red', tolerance: 'Gold (±5%)',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for missing targetOhms in reverse mode', () => {
    const r = config.calculate({ mode: 'reverse', targetOhms: '', reverseBands: '4' });
    expect(r).toEqual([]);
  });

  it('returns empty for zero ohms in reverse mode', () => {
    const r = config.calculate({ mode: 'reverse', targetOhms: '0', reverseBands: '4' });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN ohms in reverse mode', () => {
    const r = config.calculate({ mode: 'reverse', targetOhms: 'not-a-number', reverseBands: '4' });
    expect(r).toEqual([]);
  });

  it('returns empty for negative ohms in reverse mode', () => {
    const r = config.calculate({ mode: 'reverse', targetOhms: '-100', reverseBands: '4' });
    expect(r).toEqual([]);
  });

  it('returns min and max resistance values', () => {
    const r = config.calculate({
      mode: 'forward', bands: '4',
      band1: 'Brown', band2: 'Black',
      multiplier: 'Red', tolerance: 'Gold (±5%)',
    });
    expect(getValue(r, 'minResistance')).toBeTruthy();
    expect(getValue(r, 'maxResistance')).toBeTruthy();
  });

  it('returns color sequence as JSON array', () => {
    const r = config.calculate({
      mode: 'forward', bands: '4',
      band1: 'Brown', band2: 'Black',
      multiplier: 'Red', tolerance: 'Gold (±5%)',
    });
    const colors = JSON.parse(getValue(r, 'colorSequence'));
    expect(Array.isArray(colors)).toBe(true);
    expect(colors.length).toBeGreaterThanOrEqual(3);
  });

  // ── result completeness ────────────────────────────────────────────────
  it('returns all expected result ids for forward 4-band', () => {
    const r = config.calculate({
      mode: 'forward', bands: '4',
      band1: 'Brown', band2: 'Black',
      multiplier: 'Red', tolerance: 'Gold (±5%)',
    });
    const ids = r.map((x: { id: string }) => x.id);
    expect(ids).toContain('resistance');
    expect(ids).toContain('tolerance');
    expect(ids).toContain('minResistance');
    expect(ids).toContain('maxResistance');
    expect(ids).toContain('colorSequence');
    expect(ids).toContain('ohmicValue');
  });
});
