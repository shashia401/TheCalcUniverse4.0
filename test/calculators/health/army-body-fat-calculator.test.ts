import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/army-body-fat/index';
import { getValue, parseNumber } from '../../helpers';

describe('Army Body Fat calculator (AR 600-9)', () => {
  // ── Male calculations ────────────────────────────────────────────────
  it('calculates body fat for a male within standards', () => {
    const r = config.calculate({
      sex: 'male',
      age: '25',
      heightInches: '68',
      weight: '170',
      neck: '15.5',
      waist: '32',
      hip: '',
    });
    const bf = parseNumber(getValue(r, 'bodyFatArmy'));
    expect(bf).toBeGreaterThan(2);
    expect(bf).toBeLessThan(30);
    expect(getValue(r, 'passFail')).toContain('PASS');
  });

  it('calculates body fat for a lean male (moderate waist, larger neck)', () => {
    const r = config.calculate({
      sex: 'male',
      age: '22',
      heightInches: '70',
      weight: '175',
      neck: '16',
      waist: '32',
      hip: '',
    });
    const bf = parseNumber(getValue(r, 'bodyFatArmy'));
    expect(bf).toBeGreaterThan(8);
    expect(bf).toBeLessThan(22);
  });

  it('shows FAIL for a male exceeding max by age bracket', () => {
    const r = config.calculate({
      sex: 'male',
      age: '25',
      heightInches: '68',
      weight: '220',
      neck: '15',
      waist: '40',
      hip: '',
    });
    const bf = parseNumber(getValue(r, 'bodyFatArmy'));
    expect(bf).toBeGreaterThan(20);
    if (bf > 22) {
      expect(getValue(r, 'passFail')).toContain('FAIL');
    }
  });

  // ── Female calculations ──────────────────────────────────────────────
  it('calculates body fat for a female', () => {
    const r = config.calculate({
      sex: 'female',
      age: '25',
      heightInches: '64',
      weight: '140',
      neck: '12.5',
      waist: '28',
      hip: '36',
    });
    const bf = parseNumber(getValue(r, 'bodyFatArmy'));
    expect(bf).toBeGreaterThan(10);
    expect(bf).toBeLessThan(50);
    expect(getValue(r, 'bodyFatArmy')).toContain('%');
  });

  it('female has higher max allowable BF than male of same age', () => {
    const male = config.calculate({
      sex: 'male', age: '25', heightInches: '68', weight: '170',
      neck: '15.5', waist: '32', hip: '',
    });
    const female = config.calculate({
      sex: 'female', age: '25', heightInches: '64', weight: '140',
      neck: '12.5', waist: '28', hip: '36',
    });
    const maleMax = parseNumber(getValue(male, 'maxAllowedBf'));
    const femaleMax = parseNumber(getValue(female, 'maxAllowedBf'));
    expect(femaleMax).toBeGreaterThan(maleMax);
  });

  it('calculates body fat for a female at older age bracket (higher max)', () => {
    const r = config.calculate({
      sex: 'female',
      age: '50',
      heightInches: '65',
      weight: '160',
      neck: '13',
      waist: '32',
      hip: '40',
    });
    const maxBf = parseNumber(getValue(r, 'maxAllowedBf'));
    expect(maxBf).toBeGreaterThanOrEqual(40);
  });

  // ── Screening weight and regulation ──────────────────────────────────
  it('returns screening weight', () => {
    const r = config.calculate({
      sex: 'male',
      age: '30',
      heightInches: '70',
      weight: '180',
      neck: '16',
      waist: '34',
      hip: '',
    });
    expect(getValue(r, 'screeningWeight')).toContain('lbs');
  });

  it('returns regulation reference with AR 600-9', () => {
    const r = config.calculate({
      sex: 'male',
      age: '25',
      heightInches: '70',
      weight: '175',
      neck: '16',
      waist: '33',
      hip: '',
    });
    expect(getValue(r, 'regulationRef')).toContain('AR 600-9');
  });

  // ── Age bracket edge cases ───────────────────────────────────────────
  it('applies correct max BF for age 21 (youngest bracket)', () => {
    const r = config.calculate({
      sex: 'male',
      age: '20',
      heightInches: '70',
      weight: '175',
      neck: '16',
      waist: '32',
      hip: '',
    });
    const maxBf = parseNumber(getValue(r, 'maxAllowedBf'));
    expect(maxBf).toBe(20);
  });

  it('applies correct max BF for age 55 (older bracket)', () => {
    const r = config.calculate({
      sex: 'male',
      age: '55',
      heightInches: '70',
      weight: '190',
      neck: '16',
      waist: '36',
      hip: '',
    });
    const maxBf = parseNumber(getValue(r, 'maxAllowedBf'));
    expect(maxBf).toBe(30);
  });

  it('applies max BF for age 65 (oldest bracket)', () => {
    const r = config.calculate({
      sex: 'female',
      age: '62',
      heightInches: '64',
      weight: '150',
      neck: '13',
      waist: '30',
      hip: '38',
    });
    const maxBf = parseNumber(getValue(r, 'maxAllowedBf'));
    expect(maxBf).toBe(42);
  });

  // ── Input validation ─────────────────────────────────────────────────
  it('returns empty for missing waist (men)', () => {
    const r = config.calculate({
      sex: 'male',
      age: '25',
      heightInches: '70',
      weight: '180',
      neck: '15',
      waist: '',
      hip: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for missing neck', () => {
    const r = config.calculate({
      sex: 'male',
      age: '25',
      heightInches: '70',
      weight: '180',
      neck: '0',
      waist: '34',
      hip: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for missing hip (women)', () => {
    const r = config.calculate({
      sex: 'female',
      age: '25',
      heightInches: '64',
      weight: '140',
      neck: '12',
      waist: '28',
      hip: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for waist equal to neck (male) — log10 domain error', () => {
    const r = config.calculate({
      sex: 'male',
      age: '25',
      heightInches: '70',
      weight: '180',
      neck: '34',
      waist: '34',
      hip: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for waist + hip <= neck (female) — log10 domain error', () => {
    const r = config.calculate({
      sex: 'female',
      age: '25',
      heightInches: '64',
      weight: '140',
      neck: '60',
      waist: '28',
      hip: '30',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for missing age', () => {
    const r = config.calculate({
      sex: 'male',
      age: '',
      heightInches: '70',
      weight: '180',
      neck: '16',
      waist: '34',
      hip: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN height', () => {
    const r = config.calculate({
      sex: 'male',
      age: '25',
      heightInches: 'abc',
      weight: '180',
      neck: '16',
      waist: '34',
      hip: '',
    });
    expect(r).toEqual([]);
  });

  // ── Result range checks ──────────────────────────────────────────────
  it('clamps body fat to reasonable range (2-70%)', () => {
    const r = config.calculate({
      sex: 'male',
      age: '30',
      heightInches: '70',
      weight: '180',
      neck: '16',
      waist: '30',
      hip: '',
    });
    const bf = parseNumber(getValue(r, 'bodyFatArmy'));
    expect(bf).toBeGreaterThanOrEqual(2);
    expect(bf).toBeLessThanOrEqual(70);
  });

  // ── All result ids ───────────────────────────────────────────────────
  it('returns all expected result fields', () => {
    const r = config.calculate({
      sex: 'male',
      age: '25',
      heightInches: '70',
      weight: '180',
      neck: '16',
      waist: '34',
      hip: '',
    });
    const ids = r.map(x => x.id);
    expect(ids).toContain('bodyFatArmy');
    expect(ids).toContain('maxAllowedBf');
    expect(ids).toContain('passFail');
    expect(ids).toContain('screeningWeight');
    expect(ids).toContain('regulationRef');
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

  it('has maximum allowable BF table by age bracket', () => {
    const edu = config.educational;
    expect(edu.quickReference!.filter(q => q.label.includes('max')).length).toBeGreaterThanOrEqual(14);
  });
});
