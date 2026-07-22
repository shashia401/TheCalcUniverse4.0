import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/ph-calculator/index';

describe('pH Calculator', () => {
  // ─── [H⁺] → pH ──────────────────────────────────────────

  it('converts [H⁺] = 0.0001 to pH 4.00', () => {
    const r = config.calculate({ mode: 'h-to-ph', hconcentration: '0.0001' });
    const ph = r.find((res) => res.id === 'phValue');
    expect(ph?.value).toBe('4.00');
  });

  it('converts [H⁺] = 1e-7 to pH 7.00', () => {
    const r = config.calculate({ mode: 'h-to-ph', hconcentration: '1e-7' });
    const ph = r.find((res) => res.id === 'phValue');
    expect(ph?.value).toBe('7.00');
  });

  it('converts [H⁺] = 1e-14 to pH 14.00', () => {
    const r = config.calculate({ mode: 'h-to-ph', hconcentration: '1e-14' });
    const ph = r.find((res) => res.id === 'phValue');
    expect(ph?.value).toBe('14.00');
  });

  it('converts [H⁺] = 0.001 to pH 3.00', () => {
    const r = config.calculate({ mode: 'h-to-ph', hconcentration: '0.001' });
    const ph = r.find((res) => res.id === 'phValue');
    expect(ph?.value).toBe('3.00');
  });

  // ─── pH → [H⁺] ──────────────────────────────────────────

  it('converts pH 7 to [H⁺] = 1e-7', () => {
    const r = config.calculate({ mode: 'ph-to-h', phInput: '7' });
    const hConc = r.find((res) => res.id === 'hConcentration');
    expect(hConc?.value).toContain('e-7');
  });

  it('converts pH 4 to [H⁺] = 0.0001', () => {
    const r = config.calculate({ mode: 'ph-to-h', phInput: '4' });
    const hConc = r.find((res) => res.id === 'hConcentration');
    expect(parseFloat(hConc!.value)).toBeCloseTo(0.0001, 4);
  });

  it('converts pH 10 to pOH 4', () => {
    const r = config.calculate({ mode: 'ph-to-poh', phInput: '10' });
    const poh = r.find((res) => res.id === 'pohValue');
    expect(poh?.value).toBe('4.00');
  });

  // ─── pOH → pH ──────────────────────────────────────────

  it('converts pOH 4 to pH 10', () => {
    const r = config.calculate({ mode: 'poh-to-ph', pohInput: '4' });
    const ph = r.find((res) => res.id === 'phValue');
    expect(ph?.value).toBe('10.00');
  });

  it('converts pOH 7 to pH 7', () => {
    const r = config.calculate({ mode: 'poh-to-ph', pohInput: '7' });
    const ph = r.find((res) => res.id === 'phValue');
    expect(ph?.value).toBe('7.00');
  });

  // ─── Classification ─────────────────────────────────────

  it('classifies pH 1 as Strong acid', () => {
    const r = config.calculate({ mode: 'ph-to-h', phInput: '1' });
    const cls = r.find((res) => res.id === 'classification');
    expect(cls?.value).toBe('Strong acid');
  });

  it('classifies pH 5 as Weak acid', () => {
    const r = config.calculate({ mode: 'ph-to-h', phInput: '5' });
    const cls = r.find((res) => res.id === 'classification');
    expect(cls?.value).toBe('Weak acid');
  });

  it('classifies pH 7 as Neutral', () => {
    const r = config.calculate({ mode: 'ph-to-h', phInput: '7' });
    const cls = r.find((res) => res.id === 'classification');
    expect(cls?.value).toBe('Neutral');
  });

  it('classifies pH 9 as Weak base', () => {
    const r = config.calculate({ mode: 'ph-to-h', phInput: '9' });
    const cls = r.find((res) => res.id === 'classification');
    expect(cls?.value).toBe('Weak base');
  });

  it('classifies pH 13 as Strong base', () => {
    const r = config.calculate({ mode: 'ph-to-h', phInput: '13' });
    const cls = r.find((res) => res.id === 'classification');
    expect(cls?.value).toBe('Strong base');
  });

  // ─── Indicator Color ────────────────────────────────────

  it('returns Red indicator for pH 1', () => {
    const r = config.calculate({ mode: 'ph-to-h', phInput: '1' });
    const color = r.find((res) => res.id === 'hColor');
    expect(color?.value).toBe('Red');
  });

  it('returns Green indicator for pH 7', () => {
    const r = config.calculate({ mode: 'ph-to-h', phInput: '7' });
    const color = r.find((res) => res.id === 'hColor');
    expect(color?.value).toBe('Green');
  });

  it('returns Purple indicator for pH 13', () => {
    const r = config.calculate({ mode: 'ph-to-h', phInput: '13' });
    const color = r.find((res) => res.id === 'hColor');
    expect(color?.value).toBe('Purple');
  });

  // ─── Validation ─────────────────────────────────────────

  it('returns empty for negative H+ concentration', () => {
    expect(config.calculate({ mode: 'h-to-ph', hconcentration: '-1' })).toEqual([]);
  });

  it('returns empty for zero H+ concentration', () => {
    expect(config.calculate({ mode: 'h-to-ph', hconcentration: '0' })).toEqual([]);
  });

  it('returns empty for pH below 0', () => {
    expect(config.calculate({ mode: 'ph-to-h', phInput: '-1' })).toEqual([]);
  });

  it('returns empty for pH above 14', () => {
    expect(config.calculate({ mode: 'ph-to-h', phInput: '15' })).toEqual([]);
  });

  it('returns empty for pOH below 0', () => {
    expect(config.calculate({ mode: 'poh-to-ph', pohInput: '-1' })).toEqual([]);
  });

  it('returns empty for pOH above 14', () => {
    expect(config.calculate({ mode: 'poh-to-ph', pohInput: '15' })).toEqual([]);
  });

  it('returns empty for missing mode', () => {
    expect(config.calculate({})).toEqual([]);
  });

  it('returns empty for invalid hconcentration', () => {
    expect(config.calculate({ mode: 'h-to-ph', hconcentration: 'abc' })).toEqual([]);
  });

  it('returns empty for invalid phInput', () => {
    expect(config.calculate({ mode: 'ph-to-h', phInput: 'abc' })).toEqual([]);
  });

  // ─── pH → pOH ──────────────────────────────────────────

  it('converts pH 7 to pOH 7', () => {
    const r = config.calculate({ mode: 'ph-to-poh', phInput: '7' });
    const poh = r.find((res) => res.id === 'pohValue');
    expect(poh?.value).toBe('7.00');
  });

  it('converts pH 2 to pOH 12', () => {
    const r = config.calculate({ mode: 'ph-to-poh', phInput: '2' });
    const poh = r.find((res) => res.id === 'pohValue');
    expect(poh?.value).toBe('12.00');
  });

  // ─── Educational Content ──────────────────────────────

  it('has educational content', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.formulaDescription!.length).toBeGreaterThan(100);
    expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.howToUse!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(2);
    expect(config.educational.citations!.length).toBeGreaterThanOrEqual(1);
    expect(config.educational.explanation!.length).toBeGreaterThan(300);
  });
});
