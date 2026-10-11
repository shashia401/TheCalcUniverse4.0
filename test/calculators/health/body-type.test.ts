import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/body-type/index';
import { getValue, parseNumber } from '../../helpers';

describe('Body Type calculator', () => {
  // ── Shape classification ─────────────────────────────────────────────
  it('classifies hourglass shape (bust and hips both significantly wider than waist)', () => {
    const r = config.calculate({
      unit: 'imperial', bust: '38', waist: '27', hip: '39',
    });
    expect(getValue(r, 'bodyShape')).toContain('Hourglass');
  });

  it('classifies pear shape (hips wider than bust and waist)', () => {
    const r = config.calculate({
      unit: 'imperial', bust: '34', waist: '30', hip: '40',
    });
    expect(getValue(r, 'bodyShape')).toContain('Pear');
  });

  it('classifies apple shape (waist similar to bust and hips)', () => {
    const r = config.calculate({
      unit: 'imperial', bust: '42', waist: '40', hip: '43',
    });
    expect(getValue(r, 'bodyShape')).toContain('Apple');
  });

  it('classifies rectangle shape (bust, waist, hips all similar)', () => {
    const r = config.calculate({
      unit: 'imperial', bust: '38', waist: '34', hip: '38',
    });
    expect(getValue(r, 'bodyShape')).toContain('Rectangle');
  });

  it('classifies inverted triangle shape (bust wider than hips, hips close to waist)', () => {
    const r = config.calculate({
      unit: 'imperial', bust: '42', waist: '30', hip: '33',
    });
    expect(getValue(r, 'bodyShape')).toContain('Inverted Triangle');
  });

  // ── WHR calculations ─────────────────────────────────────────────────
  it('calculates waist-to-hip ratio for hourglass shape', () => {
    const r = config.calculate({
      unit: 'imperial', bust: '36', waist: '27', hip: '39',
    });
    const whr = parseNumber(getValue(r, 'waistHipRatio'));
    expect(whr).toBeCloseTo(0.69, 1);
  });

  it('calculates waist-to-bust ratio', () => {
    const r = config.calculate({
      unit: 'imperial', bust: '40', waist: '30', hip: '38',
    });
    const wbr = parseNumber(getValue(r, 'waistBustRatio'));
    expect(wbr).toBeCloseTo(0.75, 1);
  });

  it('shows WHR health risk warning for elevated female WHR', () => {
    const r = config.calculate({
      unit: 'imperial', bust: '42', waist: '38', hip: '43',
    });
    const risk = getValue(r, 'whrHealthRisk');
    expect(risk).toContain('Elevated');
  });

  it('shows standard risk for healthy WHR', () => {
    const r = config.calculate({
      unit: 'imperial', bust: '36', waist: '27', hip: '39',
    });
    const risk = getValue(r, 'whrHealthRisk');
    expect(risk).toContain('Standard');
  });

  // ── Metric units ─────────────────────────────────────────────────────
  it('displays measurements in cm when using metric system', () => {
    const r = config.calculate({
      unit: 'metric', bust: '96', waist: '72', hip: '100',
    });
    expect(getValue(r, 'measurements')).toContain('cm');
  });

  it('classifies pear shape in metric units', () => {
    const r = config.calculate({
      unit: 'metric', bust: '86', waist: '76', hip: '102',
    });
    expect(getValue(r, 'bodyShape')).toContain('Pear');
  });

  // ── Shape description ────────────────────────────────────────────────
  it('returns shape description text', () => {
    const r = config.calculate({
      unit: 'imperial', bust: '38', waist: '27', hip: '39',
    });
    expect(getValue(r, 'shapeDescription')).toBeTruthy();
    expect(getValue(r, 'shapeDescription').length).toBeGreaterThan(10);
  });

  // ── Input validation ─────────────────────────────────────────────────
  it('returns empty for zero bust, waist, hip', () => {
    const r = config.calculate({
      unit: 'imperial', bust: '0', waist: '0', hip: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for missing bust', () => {
    const r = config.calculate({
      unit: 'imperial', bust: '', waist: '30', hip: '40',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for missing hip', () => {
    const r = config.calculate({
      unit: 'imperial', bust: '38', waist: '30', hip: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for negative measurements', () => {
    const r = config.calculate({
      unit: 'imperial', bust: '-38', waist: '30', hip: '40',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN measurements', () => {
    const r = config.calculate({
      unit: 'imperial', bust: 'abc', waist: '30', hip: '40',
    });
    expect(r).toEqual([]);
  });

  // ── All result ids ───────────────────────────────────────────────────
  it('returns all expected result fields', () => {
    const r = config.calculate({
      unit: 'imperial', bust: '38', waist: '27', hip: '39',
    });
    const ids = r.map(x => x.id);
    expect(ids).toContain('bodyShape');
    expect(ids).toContain('shapeDescription');
    expect(ids).toContain('waistHipRatio');
    expect(ids).toContain('waistBustRatio');
    expect(ids).toContain('measurements');
    expect(ids).toContain('whrHealthRisk');
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

  // ── Default unit ─────────────────────────────────────────────────────
  it('defaults to imperial when unit is missing', () => {
    const r = config.calculate({
      bust: '38', waist: '27', hip: '39',
    });
    expect(getValue(r, 'measurements')).toContain('in');
  });

  it('handles fractional inch measurements', () => {
    const r = config.calculate({
      unit: 'imperial', bust: '38.5', waist: '27.25', hip: '39.75',
    });
    expect(r.length).toBeGreaterThan(0);
    expect(getValue(r, 'bodyShape')).toBeTruthy();
  });

  // ── Audit regressions: WHO (2008) WHR thresholds are >= 0.85 (women) and >= 0.90 (men) ──
  // The old code had an unreachable male branch (whr > 0.90 is always caught by whr > 0.85) so a
  // WHR of 0.95 was reported as a female-only risk.
  it('WHR 0.95 (38/40) is flagged above BOTH the female (0.85) and male (0.90) WHO thresholds', () => {
    const r = config.calculate({ unit: 'imperial', bust: '42', waist: '38', hip: '40' });
    expect(getValue(r, 'waistHipRatio')).toBe('0.95');
    expect(getValue(r, 'whrHealthRisk')).toContain('both women (0.85) and men (0.90)');
  });

  it('WHR 0.875 (35/40) is elevated for women only', () => {
    const r = config.calculate({ unit: 'imperial', bust: '40', waist: '35', hip: '40' });
    expect(getValue(r, 'whrHealthRisk')).toContain('if female');
    expect(getValue(r, 'whrHealthRisk')).toContain('below the male threshold');
  });

  it('WHR exactly 0.85 (34/40) meets the WHO >= 0.85 threshold; 0.84 does not', () => {
    expect(getValue(config.calculate({ unit: 'imperial', bust: '40', waist: '34', hip: '40' }), 'whrHealthRisk')).toContain('if female');
    expect(getValue(config.calculate({ unit: 'imperial', bust: '40', waist: '33.6', hip: '40' }), 'whrHealthRisk')).toContain('Standard');
  });

  it('WHR exactly 0.90 (36/40) is flagged for men as well', () => {
    expect(getValue(config.calculate({ unit: 'imperial', bust: '40', waist: '36', hip: '40' }), 'whrHealthRisk')).toContain('both women');
  });

  it('declared circumference ranges are bounded', () => {
    for (const id of ['bust', 'waist', 'hip']) {
      const f = config.inputs.find((i) => i.id === id)!;
      expect(f.min).toBeGreaterThan(0);
      expect(f.max).toBeDefined();
    }
  });
});
