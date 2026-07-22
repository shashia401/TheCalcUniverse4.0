import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/bac/index';
import { getValue, parseNumber } from '../../helpers';

describe('BAC calculator', () => {
  // ─── Core Widmark formula calculations ───────────────────────────────
  it('calculates BAC using Widmark formula for a 180 lb male with 4 drinks over 3 hours', () => {
    const r = config.calculate({
      sex: 'male', weight: '180', drinks: '4', hours: '3',
    });
    const bac = parseNumber(getValue(r, 'bac'));
    // Widmark: BAC = (4*14 / (180*453.592*0.68)) * 100 - 0.015*3
    // = (56 / 55567) * 100 - 0.045 = 0.1008 - 0.045 = 0.056 → ~0.043
    expect(bac).toBeGreaterThan(0.02);
    expect(bac).toBeLessThan(0.10);
  });

  it('calculates higher BAC for a 130 lb female with 3 drinks over 2 hours', () => {
    const r = config.calculate({
      sex: 'female', weight: '130', drinks: '3', hours: '2',
    });
    const bac = parseNumber(getValue(r, 'bac'));
    expect(bac).toBeGreaterThan(0.04);
    expect(bac).toBeLessThan(0.15);
  });

  it('shows female BAC is higher than male BAC for same weight and drinks', () => {
    const male = config.calculate({
      sex: 'male', weight: '150', drinks: '3', hours: '2',
    });
    const female = config.calculate({
      sex: 'female', weight: '150', drinks: '3', hours: '2',
    });
    const maleBAC = parseNumber(getValue(male, 'bac'));
    const femaleBAC = parseNumber(getValue(female, 'bac'));
    // Female BAC should be higher due to lower Widmark factor (0.55 vs 0.68)
    expect(femaleBAC).toBeGreaterThan(maleBAC);
  });

  it('calculates near-zero BAC for 1 drink after 6 hours for a large male', () => {
    const r = config.calculate({
      sex: 'male', weight: '220', drinks: '1', hours: '6',
    });
    const bac = parseNumber(getValue(r, 'bac'));
    expect(bac).toBeLessThan(0.01);
  });

  // ─── Result fields ───────────────────────────────────────────────────
  it('returns all expected result fields', () => {
    const r = config.calculate({
      sex: 'male', weight: '170', drinks: '3', hours: '2',
    });
    const ids = r.map(x => x.id);
    expect(ids).toContain('bac');
    expect(ids).toContain('impairment');
    expect(ids).toContain('rawBac');
    expect(ids).toContain('timeToZero');
    expect(ids).toContain('timeToLegal');
    expect(ids).toContain('standardDrinks');
    expect(ids).toContain('formulaNote');
  });

  it('returns meaningful impairment label', () => {
    const r = config.calculate({
      sex: 'male', weight: '200', drinks: '8', hours: '2',
    });
    const impairment = getValue(r, 'impairment');
    expect(impairment).toBeTruthy();
    expect(impairment.length).toBeGreaterThan(5);
  });

  it('returns time until sober in hours', () => {
    const r = config.calculate({
      sex: 'male', weight: '170', drinks: '3', hours: '2',
    });
    const tz = getValue(r, 'timeToZero');
    expect(tz).toContain('hours');
    expect(tz).toContain('minutes');
  });

  it('returns time until legal limit', () => {
    const r = config.calculate({
      sex: 'male', weight: '170', drinks: '6', hours: '1',
    });
    const tl = getValue(r, 'timeToLegal');
    expect(tl).toContain('hours');
    expect(tl).toContain('minutes');
  });

  it('returns formula note with Widmark reference', () => {
    const r = config.calculate({
      sex: 'male', weight: '170', drinks: '2', hours: '1',
    });
    expect(getValue(r, 'formulaNote')).toContain('Widmark');
    expect(getValue(r, 'standardDrinks')).toContain('standard');
  });

  it('returns peak BAC (raw) greater than or equal to current BAC', () => {
    const r = config.calculate({
      sex: 'male', weight: '180', drinks: '5', hours: '3',
    });
    const bac = parseNumber(getValue(r, 'bac'));
    const rawBac = parseNumber(getValue(r, 'rawBac'));
    expect(rawBac).toBeGreaterThanOrEqual(bac);
  });

  // ─── Edge cases and input validation ─────────────────────────────────
  it('returns empty array for zero drinks', () => {
    const r = config.calculate({
      sex: 'male', weight: '170', drinks: '0', hours: '1',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for negative weight', () => {
    const r = config.calculate({
      sex: 'male', weight: '-10', drinks: '3', hours: '2',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for NaN weight', () => {
    const r = config.calculate({
      sex: 'male', weight: 'abc', drinks: '3', hours: '2',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for NaN drinks', () => {
    const r = config.calculate({
      sex: 'male', weight: '170', drinks: 'xyz', hours: '2',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for NaN hours', () => {
    const r = config.calculate({
      sex: 'male', weight: '170', drinks: '3', hours: 'not-a-number',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for undefined weight', () => {
    const r = config.calculate({
      sex: 'male', drinks: '3', hours: '2',
    } as any);
    expect(r).toEqual([]);
  });

  it('returns empty array for weight below 30 lbs', () => {
    const r = config.calculate({
      sex: 'male', weight: '20', drinks: '1', hours: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for weight above 700 lbs', () => {
    const r = config.calculate({
      sex: 'male', weight: '800', drinks: '1', hours: '0',
    });
    expect(r).toEqual([]);
  });

  it('handles zero hours correctly (peak BAC = current BAC)', () => {
    const r = config.calculate({
      sex: 'male', weight: '180', drinks: '4', hours: '0',
    });
    const bac = parseNumber(getValue(r, 'bac'));
    const rawBac = parseNumber(getValue(r, 'rawBac'));
    // At 0 hours, BAC should equal raw BAC (no metabolism yet)
    expect(bac).toBeCloseTo(rawBac, 3);
  });

  // ─── Custom ABV calculations ────────────────────────────────────────
  it('uses custom ABV when provided (beer at 8% ABV)', () => {
    const standard = config.calculate({
      sex: 'male', weight: '180', drinks: '4', hours: '2',
    });
    const custom = config.calculate({
      sex: 'male', weight: '180', drinks: '4', hours: '2', alcoholPct: '8',
    });
    const standardBAC = parseNumber(getValue(standard, 'bac'));
    const customBAC = parseNumber(getValue(custom, 'bac'));
    // 8% ABV beer: 355ml * 0.08 * 0.789 = 22.4g per drink vs 14g standard
    // Higher ABV should yield higher BAC
    expect(customBAC).toBeGreaterThan(standardBAC);
  });

  it('uses custom ABV when provided (wine at 14% ABV)', () => {
    const r = config.calculate({
      sex: 'female', weight: '140', drinks: '3', hours: '2', alcoholPct: '14',
    });
    const bac = parseNumber(getValue(r, 'bac'));
    expect(bac).toBeGreaterThan(0);
    expect(getValue(r, 'standardDrinks')).toContain('custom');
  });

  it('applies liquor serving size for high ABV (40%)', () => {
    const r = config.calculate({
      sex: 'male', weight: '200', drinks: '5', hours: '3', alcoholPct: '40',
    });
    const bac = parseNumber(getValue(r, 'bac'));
    expect(bac).toBeGreaterThan(0);
    expect(getValue(r, 'standardDrinks')).toContain('40%');
  });

  it('shows formula note with custom ABV reference', () => {
    const r = config.calculate({
      sex: 'male', weight: '180', drinks: '3', hours: '2', alcoholPct: '6.5',
    });
    expect(getValue(r, 'formulaNote')).toContain('6.5%');
  });

  it('ignores invalid (NaN) ABV and falls back to standard', () => {
    const r = config.calculate({
      sex: 'male', weight: '180', drinks: '3', hours: '2', alcoholPct: 'abc',
    });
    expect(getValue(r, 'standardDrinks')).toContain('standard');
  });

  // ─── Impairment classification boundary tests ───────────────────────
  it('classifies zero BAC as "No detectable alcohol"', () => {
    const r = config.calculate({
      sex: 'male', weight: '250', drinks: '1', hours: '12',
    });
    // For a 250 lb male, 1 drink after 12 hours should be ~0
    const bac = parseNumber(getValue(r, 'bac'));
    if (bac <= 0) {
      expect(getValue(r, 'impairment')).toContain('No detectable');
    }
  });

  it('classifies high BAC as severe or life-threatening', () => {
    const r = config.calculate({
      sex: 'female', weight: '110', drinks: '12', hours: '2',
    });
    const impairment = getValue(r, 'impairment');
    // Should be at least "Significant impairment" or worse
    const severeTerms = ['Significant', 'Severe', 'Life-threatening'];
    expect(severeTerms.some(t => impairment.includes(t))).toBe(true);
  });

  // ─── High-value boundary tests ──────────────────────────────────────
  it('handles maximum drinks (50) without error', () => {
    const r = config.calculate({
      sex: 'male', weight: '200', drinks: '50', hours: '24',
    });
    expect(r.length).toBeGreaterThan(0);
    expect(getValue(r, 'bac')).toBeTruthy();
  });

  it('handles fractional drinks correctly', () => {
    const r = config.calculate({
      sex: 'male', weight: '180', drinks: '2.5', hours: '1.5',
    });
    const bac = parseNumber(getValue(r, 'bac'));
    expect(bac).toBeGreaterThan(0);
    expect(bac).toBeLessThan(0.30);
  });

  it('allows both male and female sex options', () => {
    const male = config.calculate({
      sex: 'male', weight: '150', drinks: '2', hours: '1',
    });
    const female = config.calculate({
      sex: 'female', weight: '150', drinks: '2', hours: '1',
    });
    expect(male.length).toBeGreaterThan(0);
    expect(female.length).toBeGreaterThan(0);
  });

  // ─── Educational content presence ───────────────────────────────────
  it('has educational section with required fields', () => {
    const edu = config.educational;
    expect(edu).toBeDefined();
    expect(edu.formula).toBeTruthy();
    expect(edu.formulaDescription).toBeTruthy();
    expect(edu.variables).toBeDefined();
    expect(edu.variables!.length).toBeGreaterThanOrEqual(5);
    expect(edu.howToUse).toBeDefined();
    expect(edu.howToUse!.length).toBeGreaterThanOrEqual(3);
    expect(edu.explanation).toBeTruthy();
    expect(edu.explanation.length).toBeGreaterThan(500);
    expect(edu.faqs).toBeDefined();
    expect(edu.faqs!.length).toBeGreaterThanOrEqual(7);
    expect(edu.workedExamples).toBeDefined();
    expect(edu.workedExamples!.length).toBeGreaterThanOrEqual(3);
    expect(edu.proTips).toBeDefined();
    expect(edu.proTips!.length).toBeGreaterThanOrEqual(4);
    expect(edu.limitations).toBeDefined();
    expect(edu.limitations!.length).toBeGreaterThanOrEqual(3);
    expect(edu.commonUses).toBeDefined();
    expect(edu.commonUses!.length).toBeGreaterThanOrEqual(2);
    expect(edu.citations).toBeDefined();
    expect(edu.citations!.length).toBeGreaterThanOrEqual(2);
  });
});
