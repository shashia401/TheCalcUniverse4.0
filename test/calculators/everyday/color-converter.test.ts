import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/color-converter';
import { getValue, parseNumber, near } from '../../helpers';

describe('color converter input showWhen', () => {
  it('shows hex field only when format is hex', () => {
    const hexField = config.inputs.find((i) => i.id === 'hex')!;
    expect(hexField.showWhen!({ format: 'hex' })).toBe(true);
    expect(hexField.showWhen!({ format: 'rgb' })).toBe(false);
    expect(hexField.showWhen!({ format: 'hsl' })).toBe(false);
  });

  it('shows rgb fields only when format is rgb', () => {
    const redField = config.inputs.find((i) => i.id === 'red')!;
    expect(redField.showWhen!({ format: 'rgb' })).toBe(true);
    expect(redField.showWhen!({ format: 'hex' })).toBe(false);
  });

  it('shows all three rgb channel fields together', () => {
    const greenField = config.inputs.find((i) => i.id === 'green')!;
    const blueField = config.inputs.find((i) => i.id === 'blue')!;
    expect(greenField.showWhen!({ format: 'rgb' })).toBe(true);
    expect(greenField.showWhen!({ format: 'hsl' })).toBe(false);
    expect(blueField.showWhen!({ format: 'rgb' })).toBe(true);
    expect(blueField.showWhen!({ format: 'hex' })).toBe(false);
  });

  it('shows all three hsl fields together', () => {
    const hueField = config.inputs.find((i) => i.id === 'hue')!;
    const satField = config.inputs.find((i) => i.id === 'saturation')!;
    const lightField = config.inputs.find((i) => i.id === 'lightness')!;
    expect(hueField.showWhen!({ format: 'hsl' })).toBe(true);
    expect(hueField.showWhen!({ format: 'rgb' })).toBe(false);
    expect(satField.showWhen!({ format: 'hsl' })).toBe(true);
    expect(satField.showWhen!({ format: 'hex' })).toBe(false);
    expect(lightField.showWhen!({ format: 'hsl' })).toBe(true);
    expect(lightField.showWhen!({ format: 'rgb' })).toBe(false);
  });
});

describe('color converter', () => {
  // ── HEX to RGB / HSL ─────────────────────────────────────────────────────

  it('converts HEX #FF5733 to RGB(255,87,51)', () => {
    const r = config.calculate({ format: 'hex', hex: '#FF5733' });
    expect(getValue(r, 'hex')).toBe('#FF5733');
    expect(getValue(r, 'rgb')).toBe('rgb(255, 87, 51)');
    expect(getValue(r, 'colorPreview')).toBe('#FF5733');

    // HSL hue will be ~10.6 which rounds to 11
    // Verify components via parseNumber
    const hsl = getValue(r, 'hsl');
    const h = parseNumber(hsl);
    near(h, 11, 1);
    expect(hsl).toMatch(/hsl\(/);
    expect(hsl).toContain('100%');
    expect(hsl).toContain('60%');
  });

  // ── RGB to HEX / HSL ─────────────────────────────────────────────────────

  it('converts RGB(255,87,51) to HEX #FF5733', () => {
    const r = config.calculate({
      format: 'rgb',
      red: '255',
      green: '87',
      blue: '51',
    });
    expect(getValue(r, 'hex')).toBe('#FF5733');
    expect(getValue(r, 'rgb')).toBe('rgb(255, 87, 51)');
  });

  it('converts RGB(0,128,255) to HEX #0080FF', () => {
    const r = config.calculate({
      format: 'rgb',
      red: '0',
      green: '128',
      blue: '255',
    });
    expect(getValue(r, 'hex')).toBe('#0080FF');
    expect(getValue(r, 'rgb')).toBe('rgb(0, 128, 255)');
  });

  // ── HSL to HEX / RGB ─────────────────────────────────────────────────────

  it('converts HSL(0,100%,50%) to HEX #FF0000 (pure red)', () => {
    const r = config.calculate({
      format: 'hsl',
      hue: '0',
      saturation: '100',
      lightness: '50',
    });
    expect(getValue(r, 'hex')).toBe('#FF0000');
    expect(getValue(r, 'rgb')).toBe('rgb(255, 0, 0)');
  });

  it('converts HSL(120,100%,50%) to HEX #00FF00 (pure green)', () => {
    const r = config.calculate({
      format: 'hsl',
      hue: '120',
      saturation: '100',
      lightness: '50',
    });
    expect(getValue(r, 'hex')).toBe('#00FF00');
    expect(getValue(r, 'rgb')).toBe('rgb(0, 255, 0)');
  });

  // ── Empty / missing input ────────────────────────────────────────────────

  it('returns empty array for empty values object', () => {
    const r = config.calculate({});
    expect(r).toEqual([]);
  });

  it('returns empty array when hex field is empty', () => {
    const r = config.calculate({
      format: 'hex',
      hex: '',
    });
    expect(r).toEqual([]);
  });

  // ── Invalid hex ──────────────────────────────────────────────────────────

  it('returns empty array for invalid hex characters', () => {
    const r = config.calculate({
      format: 'hex',
      hex: '#GGGGGG',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for incomplete hex string', () => {
    const r = config.calculate({
      format: 'hex',
      hex: '#FFF',
    });
    expect(r).toEqual([]);
  });

  // ── Edge cases ───────────────────────────────────────────────────────────

  it('handles black (#000000) correctly', () => {
    const r = config.calculate({ format: 'hex', hex: '#000000' });
    expect(getValue(r, 'hex')).toBe('#000000');
    expect(getValue(r, 'rgb')).toBe('rgb(0, 0, 0)');

    const hsl = getValue(r, 'hsl');
    expect(hsl).toContain('0%');
  });

  it('handles white (#FFFFFF) correctly', () => {
    const r = config.calculate({ format: 'hex', hex: '#FFFFFF' });
    expect(getValue(r, 'hex')).toBe('#FFFFFF');
    expect(getValue(r, 'rgb')).toBe('rgb(255, 255, 255)');

    const hsl = getValue(r, 'hsl');
    expect(hsl).toContain('100%');
  });

  it('handles pure red, green, and blue from RGB input', () => {
    // Pure red
    let r = config.calculate({ format: 'rgb', red: '255', green: '0', blue: '0' });
    expect(getValue(r, 'hex')).toBe('#FF0000');

    // Pure green
    r = config.calculate({ format: 'rgb', red: '0', green: '255', blue: '0' });
    expect(getValue(r, 'hex')).toBe('#00FF00');

    // Pure blue
    r = config.calculate({ format: 'rgb', red: '0', green: '0', blue: '255' });
    expect(getValue(r, 'hex')).toBe('#0000FF');
  });

  // ── HEX without leading # ────────────────────────────────────────────────

  it('accepts hex value without the # prefix', () => {
    const r = config.calculate({ format: 'hex', hex: 'FF5733' });
    expect(getValue(r, 'hex')).toBe('#FF5733');
    expect(getValue(r, 'rgb')).toBe('rgb(255, 87, 51)');
  });

  // ── Round-trip consistency ───────────────────────────────────────────────

  it('round-trips consistently: RGB → HSL → RGB', () => {
    // Convert RGB to HSL, then use that HSL to convert back
    const rgbVals = { red: '70', green: '130', blue: '180' };
    const forward = config.calculate({ format: 'rgb', ...rgbVals });
    const hex = getValue(forward, 'hex');
    const hslStr = getValue(forward, 'hsl');

    // Parse HSL components from e.g. "hsl(206, 44%, 49%)"
    const hslMatch = hslStr.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    expect(hslMatch).not.toBeNull();
    if (!hslMatch) return;

    const backward = config.calculate({
      format: 'hsl',
      hue: hslMatch[1],
      saturation: hslMatch[2],
      lightness: hslMatch[3],
    });

    // Allow ±1 rounding difference per channel
    const backHex = getValue(backward, 'hex');
    const tolerance = 1;
    const r1 = parseInt(hex.slice(1, 3), 16);
    const g1 = parseInt(hex.slice(3, 5), 16);
    const b1 = parseInt(hex.slice(5, 7), 16);
    const r2 = parseInt(backHex.slice(1, 3), 16);
    const g2 = parseInt(backHex.slice(3, 5), 16);
    const b2 = parseInt(backHex.slice(5, 7), 16);

    expect(Math.abs(r1 - r2)).toBeLessThanOrEqual(tolerance);
    expect(Math.abs(g1 - g2)).toBeLessThanOrEqual(tolerance);
    expect(Math.abs(b1 - b2)).toBeLessThanOrEqual(tolerance);
  });

  // ── Additional HSL hue sectors for coverage ──────────────────────────────

  it('handles HSL hue 240° (blue sector: 180-240)', () => {
    const r = config.calculate({
      format: 'hsl',
      hue: '240',
      saturation: '100',
      lightness: '50',
    });
    expect(getValue(r, 'hex')).toBe('#0000FF');
    expect(getValue(r, 'rgb')).toBe('rgb(0, 0, 255)');
  });

  it('handles HSL hue 300° (purple sector: 240-300)', () => {
    const r = config.calculate({
      format: 'hsl',
      hue: '300',
      saturation: '100',
      lightness: '50',
    });
    expect(getValue(r, 'hex')).toBe('#FF00FF');
  });

  it('handles HSL hue 60° (yellow sector: 60-120)', () => {
    const r = config.calculate({
      format: 'hsl',
      hue: '60',
      saturation: '100',
      lightness: '50',
    });
    expect(getValue(r, 'hex')).toBe('#FFFF00');
  });

  it('handles invalid format → returns empty array', () => {
    const r = config.calculate({ format: 'invalid', hex: '#FF5733' });
    expect(r).toEqual([]);
  });

  it('returns empty array for RGB values out of 0-255 range', () => {
    const r1 = config.calculate({ format: 'rgb', red: '300', green: '0', blue: '0' });
    expect(r1).toEqual([]);

    const r2 = config.calculate({ format: 'rgb', red: '-5', green: '100', blue: '100' });
    expect(r2).toEqual([]);
  });

  it('returns empty array for HSL values out of range', () => {
    const r1 = config.calculate({ format: 'hsl', hue: '400', saturation: '100', lightness: '50' });
    expect(r1).toEqual([]);

    const r2 = config.calculate({ format: 'hsl', hue: '200', saturation: '150', lightness: '50' });
    expect(r2).toEqual([]);
  });

  // ── HSL edge: zero saturation (grayscale) ────────────────────────────────

  it('handles grayscale HSL (zero saturation) correctly', () => {
    const r = config.calculate({
      format: 'hsl',
      hue: '0',
      saturation: '0',
      lightness: '50',
    });
    // Zero saturation should produce a gray regardless of hue
    const rgb = getValue(r, 'rgb');
    expect(rgb).toMatch(/rgb\((\d+),\s*\1,\s*\1\)/);
  });
});
