import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/bsa/index';
import { getValue } from '../../helpers';

describe('BSA calculator', () => {
  it('calculates BSA using Mosteller formula metric', () => {
    const r = config.calculate({
      unit: 'metric', weight: '70', heightFt: '', heightIn: '', heightCm: '175',
    });
    const bsa = parseFloat(getValue(r, 'bsaMosteller'));
    expect(bsa).toBeGreaterThan(1.5);
    expect(bsa).toBeLessThan(2.2);
    expect(getValue(r, 'bsaMosteller')).toContain('m²');
  });

  it('calculates BSA using imperial units', () => {
    const r = config.calculate({
      unit: 'imperial', weight: '175', heightFt: '5', heightIn: '10', heightCm: '',
    });
    const bsa = parseFloat(getValue(r, 'bsaMosteller'));
    expect(bsa).toBeGreaterThan(1.6);
    expect(bsa).toBeLessThan(2.3);
  });

  it('returns all three formulas', () => {
    const r = config.calculate({
      unit: 'metric', weight: '80', heightFt: '', heightIn: '', heightCm: '180',
    });
    expect(getValue(r, 'bsaDubois')).toContain('m²');
    expect(getValue(r, 'bsaHaycock')).toContain('m²');
  });

  it('returns average BSA', () => {
    const r = config.calculate({
      unit: 'metric', weight: '80', heightFt: '', heightIn: '', heightCm: '180',
    });
    expect(getValue(r, 'avgBsa')).toContain('m²');
  });

  it('returns clinical disclaimer', () => {
    const r = config.calculate({
      unit: 'metric', weight: '70', heightFt: '', heightIn: '', heightCm: '170',
    });
    expect(getValue(r, 'clinicalDisclaimer')).toContain('Educational');
  });

  it('returns empty for invalid height zero', () => {
    const r = config.calculate({
      unit: 'metric', weight: '70', heightFt: '', heightIn: '', heightCm: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for negative weight', () => {
    const r = config.calculate({
      unit: 'metric', weight: '-10', heightFt: '', heightIn: '', heightCm: '170',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for empty weight string', () => {
    const r = config.calculate({
      unit: 'metric', weight: '', heightFt: '', heightIn: '', heightCm: '170',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN height in imperial', () => {
    const r = config.calculate({
      unit: 'imperial', weight: '150', heightFt: 'abc', heightIn: 'xyz', heightCm: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for imperial with zero total inches', () => {
    const r = config.calculate({
      unit: 'imperial', weight: '150', heightFt: '0', heightIn: '0', heightCm: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for imperial with negative weight', () => {
    const r = config.calculate({
      unit: 'imperial', weight: '-50', heightFt: '5', heightIn: '6', heightCm: '',
    });
    expect(r).toEqual([]);
  });

  it('all three formulas agree within 3% for typical adult', () => {
    const r = config.calculate({
      unit: 'metric', weight: '70', heightFt: '', heightIn: '', heightCm: '175',
    });
    const mosteller = parseFloat(getValue(r, 'bsaMosteller'));
    const dubois = parseFloat(getValue(r, 'bsaDubois'));
    const haycock = parseFloat(getValue(r, 'bsaHaycock'));
    const maxDiff = Math.max(Math.abs(mosteller - dubois), Math.abs(mosteller - haycock), Math.abs(dubois - haycock));
    const avg = (mosteller + dubois + haycock) / 3;
    expect(maxDiff / avg).toBeLessThan(0.03);
  });

  it('returns empty when unit is missing and imperial fields are empty', () => {
    // Unit defaults to imperial; if both imperial height fields are empty, total inches is 0 → empty result
    const r = config.calculate({
      weight: '70', heightFt: '', heightIn: '', heightCm: '175',
    });
    expect(r).toEqual([]);
  });

  it('works with metric when unit is explicitly set', () => {
    const r = config.calculate({
      unit: 'metric', weight: '70', heightFt: '', heightIn: '', heightCm: '175',
    });
    expect(getValue(r, 'bsaMosteller')).toContain('m²');
  });

  // ── Educational content presence ─────────────────────────────────────
  it('has educational section with all required fields', () => {
    const edu = config.educational;
    expect(edu).toBeDefined();
    expect(edu.formula).toBeTruthy();
    expect(edu.formulaDescription).toBeTruthy();
    expect(edu.variables).toBeDefined();
    expect(edu.variables!.length).toBeGreaterThanOrEqual(3);
    expect(edu.howToUse).toBeDefined();
    expect(edu.howToUse!.length).toBeGreaterThanOrEqual(3);
    expect(edu.explanation).toBeTruthy();
    expect(edu.explanation.length).toBeGreaterThan(500);
    expect(edu.faqs).toBeDefined();
    expect(edu.faqs!.length).toBeGreaterThanOrEqual(5);
    expect(edu.workedExamples).toBeDefined();
    expect(edu.workedExamples!.length).toBeGreaterThanOrEqual(3);
    expect(edu.proTips).toBeDefined();
    expect(edu.proTips!.length).toBeGreaterThanOrEqual(4);
    expect(edu.limitations).toBeDefined();
    expect(edu.limitations!.length).toBeGreaterThanOrEqual(3);
    expect(edu.commonUses).toBeDefined();
    expect(edu.commonUses!.length).toBeGreaterThanOrEqual(2);
    expect(edu.quickReference).toBeDefined();
    expect(edu.quickReference!.length).toBeGreaterThanOrEqual(5);
    expect(edu.citations).toBeDefined();
    expect(edu.citations!.length).toBeGreaterThanOrEqual(2);
  });

  it('mentions Mosteller as clinical standard in educational content', () => {
    const edu = config.educational;
    const combined = (edu.faqs ?? []).map(f => f.answer).join(' ') +
      (edu.proTips ?? []).join(' ') +
      (edu.explanation ?? '');
    expect(combined.toLowerCase()).toContain('mosteller');
    expect(combined.toLowerCase()).toContain('chemotherapy');
  });

  it('includes burn assessment Rule of Nines in educational content', () => {
    const edu = config.educational;
    const combined = (edu.faqs ?? []).map(f => f.answer).join(' ') +
      (edu.workedExamples ?? []).map(w => w.insight).join(' ') +
      (edu.explanation ?? '');
    expect(combined.toLowerCase()).toContain('rule of nines');
    expect(combined.toLowerCase()).toContain('parkland');
  });

  it('includes cardiac index and eGFR normalization guidance', () => {
    const edu = config.educational;
    const combined = (edu.faqs ?? []).map(f => f.answer).join(' ') +
      (edu.proTips ?? []).join(' ');
    expect(combined.toLowerCase()).toContain('cardiac index');
    expect(combined.toLowerCase()).toContain('egfr');
  });
});
