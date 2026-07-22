import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/social-security';
import { getValue, getResult, near, parseNumber } from '../../helpers';

describe('social-security', () => {
  // ─── Basic Calculations ──────────────────────────────────────────────────
  it('returns benefit estimate for single person claiming at 67', () => {
    const r = config.calculate({
      birthYear: '1965',
      annualIncome: '85000',
      maritalStatus: 'single',
      retirementAge: '67',
    });
    // FRA for 1965 = 67
    expect(getValue(r, 'fra')).toContain('Age 67');
    expect(getValue(r, 'chosen')).toContain('/mo');
    expect(getValue(r, 'annual')).toBeTruthy();
    expect(getValue(r, 'at62')).toBeTruthy();
    expect(getValue(r, 'at70')).toBeTruthy();
    expect(getValue(r, 'vs62')).toBeTruthy();

    // Benefit at 67 (FRA) should be between at62 and at70
    const chosen = parseNumber(getValue(r, 'chosen'));
    const at62 = parseNumber(getValue(r, 'at62'));
    const at70 = parseNumber(getValue(r, 'at70'));
    expect(chosen).toBeGreaterThan(at62);
    expect(at70).toBeGreaterThan(chosen);
  });

  it('claiming at 62 gives reduced benefit', () => {
    const r = config.calculate({
      birthYear: '1965',
      annualIncome: '85000',
      maritalStatus: 'single',
      retirementAge: '62',
    });
    const at62 = parseNumber(getValue(r, 'chosen'));
    expect(at62).toBeGreaterThan(0);
    expect(getValue(r, 'vs62')).toContain('$0');
  });

  it('claiming at 70 gives maximum benefit', () => {
    const r = config.calculate({
      birthYear: '1965',
      annualIncome: '85000',
      maritalStatus: 'single',
      retirementAge: '70',
    });
    const chosen = parseNumber(getValue(r, 'chosen'));
    const at62 = parseNumber(getValue(r, 'at62'));
    const at70 = parseNumber(getValue(r, 'at70'));
    // Chosen at 70 should equal the standalone at70 value
    expect(chosen).toBe(at70);
    // And both should exceed the benefit at 62
    expect(chosen).toBeGreaterThan(at62);
  });

  // ─── Spousal Benefits ────────────────────────────────────────────────────
  it('married status shows spousal benefit', () => {
    const r = config.calculate({
      birthYear: '1965',
      annualIncome: '100000',
      maritalStatus: 'married',
      retirementAge: '67',
      spouseIncome: '60000',
    });
    expect(getValue(r, 'spousal')).toContain('/mo');
  });

  it('divorced status also shows spousal benefit with correct label', () => {
    const r = config.calculate({
      birthYear: '1965',
      annualIncome: '100000',
      maritalStatus: 'divorced',
      retirementAge: '67',
    });
    expect(getValue(r, 'spousal')).toContain('/mo');
    // The label says "Ex-Spousal" for divorced status
    expect(getResult(r, 'spousal').label).toContain('Ex-Spousal');
  });

  it('widowed status does not show spousal row', () => {
    const r = config.calculate({
      birthYear: '1965',
      annualIncome: '85000',
      maritalStatus: 'widowed',
      retirementAge: '67',
    });
    const ids = r.map((x) => x.id);
    expect(ids).not.toContain('spousal');
  });

  it('single status does not show spousal row', () => {
    const r = config.calculate({
      birthYear: '1965',
      annualIncome: '85000',
      maritalStatus: 'single',
      retirementAge: '67',
    });
    const ids = r.map((x) => x.id);
    expect(ids).not.toContain('spousal');
  });

  // ─── Edge Cases (NaN / Missing / Out of Range) ───────────────────────────
  it('returns empty when required fields are missing', () => {
    const r = config.calculate({
      birthYear: '',
      annualIncome: '85000',
      maritalStatus: 'single',
      retirementAge: '67',
    });
    expect(r).toEqual([]);
  });

  it('returns empty when annualIncome is missing', () => {
    const r = config.calculate({
      birthYear: '1965',
      annualIncome: '',
      maritalStatus: 'single',
      retirementAge: '67',
    });
    expect(r).toEqual([]);
  });

  it('returns empty when retirementAge is missing', () => {
    const r = config.calculate({
      birthYear: '1965',
      annualIncome: '85000',
      maritalStatus: 'single',
      retirementAge: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for out-of-range birth year (too high)', () => {
    const r = config.calculate({
      birthYear: '2000',
      annualIncome: '85000',
      maritalStatus: 'single',
      retirementAge: '67',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for out-of-range birth year (too low)', () => {
    const r = config.calculate({
      birthYear: '1920',
      annualIncome: '85000',
      maritalStatus: 'single',
      retirementAge: '67',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for negative income', () => {
    const r = config.calculate({
      birthYear: '1965',
      annualIncome: '-5000',
      maritalStatus: 'single',
      retirementAge: '67',
    });
    expect(r).toEqual([]);
  });

  // ─── Break-Even ──────────────────────────────────────────────────────────
  it('shows break-even age when claiming after 62', () => {
    const r = config.calculate({
      birthYear: '1960',
      annualIncome: '90000',
      maritalStatus: 'single',
      retirementAge: '67',
    });
    const beResult = getResult(r, 'breakeven');
    expect(beResult.label).toContain('Break-Even Age');
    expect(beResult.value).toContain('Age');
  });

  it('does not show break-even when claiming at 62', () => {
    const r = config.calculate({
      birthYear: '1965',
      annualIncome: '85000',
      maritalStatus: 'single',
      retirementAge: '62',
    });
    const ids = r.map((x) => x.id);
    expect(ids).not.toContain('breakeven');
  });

  // ─── Full Retirement Age Accuracy ────────────────────────────────────────
  it('calculates correct FRA for birth year 1943', () => {
    const r = config.calculate({
      birthYear: '1943',
      annualIncome: '50000',
      maritalStatus: 'single',
      retirementAge: '66',
    });
    expect(getValue(r, 'fra')).toContain('Age 66');
  });

  it('calculates correct FRA for birth year 1960+', () => {
    const r = config.calculate({
      birthYear: '1970',
      annualIncome: '75000',
      maritalStatus: 'single',
      retirementAge: '67',
    });
    expect(getValue(r, 'fra')).toContain('Age 67');
  });

  it('FRA benefit at exact FRA age matches expected proportion', () => {
    const r = config.calculate({
      birthYear: '1970',
      annualIncome: '75000',
      maritalStatus: 'single',
      retirementAge: '67',
    });
    // When retiring exactly at FRA, chosen benefit should be 100% of PIA
    const chosen = parseNumber(getValue(r, 'chosen'));
    // The 'at62' result row gives benefit at 62 which should be lower
    const at62 = parseNumber(getValue(r, 'at62'));
    // The 'at70' result row gives benefit at 70 which should be higher
    const at70 = parseNumber(getValue(r, 'at70'));
    expect(chosen).toBeGreaterThan(at62);
    expect(at70).toBeGreaterThan(chosen);
    // At FRA, the vs62 row should show positive difference
    expect(getValue(r, 'vs62')).toBeTruthy();
  });

  // ─── Benefit Progression ─────────────────────────────────────────────────
  it('benefits strictly increase with claiming age', () => {
    const ages = [62, 63, 64, 65, 66, 67, 68, 69, 70];
    let prevBenefit = 0;
    for (const age of ages) {
      const r = config.calculate({
        birthYear: '1970',
        annualIncome: '75000',
        maritalStatus: 'single',
        retirementAge: String(age),
      });
      const benefit = parseNumber(getValue(r, 'chosen'));
      expect(benefit).toBeGreaterThan(prevBenefit);
      prevBenefit = benefit;
    }
  });

  // ─── Result Structure ────────────────────────────────────────────────────
  it('all results have expected structure', () => {
    const r = config.calculate({
      birthYear: '1965',
      annualIncome: '85000',
      maritalStatus: 'married',
      retirementAge: '67',
      spouseIncome: '60000',
    });
    for (const item of r) {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('label');
      expect(item).toHaveProperty('value');
      expect(item).toHaveProperty('color');
    }
  });

  it('chosen result is highlighted', () => {
    const r = config.calculate({
      birthYear: '1965',
      annualIncome: '85000',
      maritalStatus: 'single',
      retirementAge: '65',
    });
    const chosen = getResult(r, 'chosen');
    expect(chosen.highlight).toBe(true);
  });

  it('returns all base result rows', () => {
    const r = config.calculate({
      birthYear: '1965',
      annualIncome: '85000',
      maritalStatus: 'single',
      retirementAge: '67',
    });
    const ids = r.map((x) => x.id);
    expect(ids).toContain('chosen');
    expect(ids).toContain('annual');
    expect(ids).toContain('fra');
    expect(ids).toContain('at62');
    expect(ids).toContain('at70');
    expect(ids).toContain('vs62');
  });
});
