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

  // ── Worked-example regressions (narrative previously didn't match the formula) ──
  it('matches worked example 1: 25yo male, 69in, neck 16, waist 35 -> 18.0% (previously narrated as 18.5%)', () => {
    const r = config.calculate({
      sex: 'male', age: '25', heightInches: '69', weight: '195', neck: '16', waist: '35', hip: '',
    });
    expect(getValue(r, 'bodyFatArmy')).toBe('18.0%');
  });

  it('matches worked example 2: 32yo female, 65in, neck 13, waist 30, hip 38 -> 28.6% (previously narrated as 32.8%)', () => {
    const r = config.calculate({
      sex: 'female', age: '32', heightInches: '65', weight: '155', neck: '13', waist: '30', hip: '38',
    });
    expect(getValue(r, 'bodyFatArmy')).toBe('28.6%');
  });

  it('matches worked example 3: 45yo male, 72in, neck 17, waist 40 -> 23.8% (previously narrated as 27.2%)', () => {
    const r = config.calculate({
      sex: 'male', age: '45', heightInches: '72', weight: '235', neck: '17', waist: '40', hip: '',
    });
    expect(getValue(r, 'bodyFatArmy')).toBe('23.8%');
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

  it('female aged 50 uses the 40-and-older maximum of 36% (AR 600-9 Table B-2)', () => {
    const r = config.calculate({
      sex: 'female', age: '50', heightInches: '65', weight: '160', neck: '13', waist: '32', hip: '40',
    });
    expect(parseNumber(getValue(r, 'maxAllowedBf'))).toBe(36);
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

  it('applies the 40-and-older maximum (26%) for a 55-year-old man', () => {
    const r = config.calculate({
      sex: 'male', age: '55', heightInches: '70', weight: '190', neck: '16', waist: '36', hip: '',
    });
    expect(parseNumber(getValue(r, 'maxAllowedBf'))).toBe(26);
  });

  it('applies the 40-and-older maximum (36%) for a 62-year-old woman', () => {
    const r = config.calculate({
      sex: 'female', age: '62', heightInches: '64', weight: '150', neck: '13', waist: '30', hip: '38',
    });
    expect(parseNumber(getValue(r, 'maxAllowedBf'))).toBe(36);
  });

  // Independent source: AR 600-9 (28 Jun 2013) Table B-2 -> 17-20: 20/30, 21-27: 22/32, 28-39: 24/34, 40+: 26/36
  it.each([
    [17, 20, 30], [20, 20, 30], [21, 22, 32], [27, 22, 32], [28, 24, 34], [39, 24, 34], [40, 26, 36], [65, 26, 36],
  ])('Table B-2 age %i -> male %i%% / female %i%%', (age, male, female) => {
    const m = config.calculate({ sex: 'male', age: String(age), heightInches: '70', weight: '180', neck: '16', waist: '34', hip: '' });
    const f = config.calculate({ sex: 'female', age: String(age), heightInches: '65', weight: '150', neck: '13', waist: '30', hip: '38' });
    expect(getValue(m, 'maxAllowedBf')).toBe(`${male}%`);
    expect(getValue(f, 'maxAllowedBf')).toBe(`${female}%`);
  });

  // Independent source: AR 600-9 (28 Jun 2013) Table B-1 screening table weight (lb)
  it.each([
    ['male', 25, '69', '179'], ['male', 18, '60', '132'], ['male', 45, '72', '203'], ['male', 30, '80', '247'],
    ['female', 32, '65', '154'], ['female', 19, '58', '119'], ['female', 45, '75', '208'],
  ])('Table B-1: %s age %i at %s in -> %s lbs max', (sex, age, h, max) => {
    const r = config.calculate({
      sex, age: String(age), heightInches: h, weight: '150', neck: '14', waist: sex === 'male' ? '34' : '30', hip: sex === 'male' ? '' : '38',
    });
    expect(getValue(r, 'screeningWeight')).toContain(`${max} lbs max`);
  });

  it('Table B-1 note 2: +6 lb/in (male) and +5 lb/in (female) above 80 in', () => {
    const m = config.calculate({ sex: 'male', age: '30', heightInches: '82', weight: '250', neck: '17', waist: '36', hip: '' });
    expect(getValue(m, 'screeningWeight')).toContain('259 lbs max'); // 247 + 2*6
    const f = config.calculate({ sex: 'female', age: '45', heightInches: '82', weight: '200', neck: '14', waist: '32', hip: '40' });
    expect(getValue(f, 'screeningWeight')).toContain('246 lbs max'); // 236 + 2*5
  });

  // Independent source: AR 600-9 Table B-5 sample calculations
  it('Table B-5 sample (women): neck 15, waist 42, hip 44, height 64 -> 47%', () => {
    const r = config.calculate({ sex: 'female', age: '30', heightInches: '64', weight: '200', neck: '15', waist: '42', hip: '44' });
    expect(getValue(r, 'officialBodyFat')).toBe('47%');
    expect(getValue(r, 'bodyFatArmy')).toBe('47.3%'); // 163.205*log10(71) - 97.684*log10(64) - 78.387 = 47.31
  });

  it('Table B-5 sample (men): neck 16, abdomen 49, height 69 -> 39%', () => {
    const r = config.calculate({ sex: 'male', age: '30', heightInches: '69', weight: '260', neck: '16', waist: '49', hip: '' });
    expect(getValue(r, 'officialBodyFat')).toBe('39%');
    expect(getValue(r, 'bodyFatArmy')).toBe('38.6%'); // 86.010*log10(33) - 70.041*log10(69) + 36.76 = 38.57
  });

  // AR 600-9 Appendix B: neck rounds UP, abdomen/waist/hip round DOWN to the nearest 1/2 inch
  it('rounds neck up and abdomen down to the nearest 0.5 in (App. B)', () => {
    const raw = config.calculate({ sex: 'male', age: '30', heightInches: '70', weight: '180', neck: '16.1', waist: '35.9', hip: '' });
    const rounded = config.calculate({ sex: 'male', age: '30', heightInches: '70', weight: '180', neck: '16.5', waist: '35.5', hip: '' });
    expect(getValue(raw, 'bodyFatArmy')).toBe(getValue(rounded, 'bodyFatArmy'));
    expect(getValue(raw, 'bodyFatArmy')).toBe('17.5%'); // 86.010*log10(19) - 70.041*log10(70) + 36.76 = 17.51
  });

  // Table B-5: percent body fat is rounded to the nearest whole % and compared with Table B-2
  it('pass/fail uses the whole-percent value (22.13% in the 22% group passes; 22.99% -> 23% fails)', () => {
    const base = { sex: 'male', age: '25', heightInches: '70', weight: '190', neck: '15', hip: '' };
    const pass = config.calculate({ ...base, waist: '36.5' }); // 86.010*log10(21.5) - 70.041*log10(70) + 36.76 = 22.13
    expect(getValue(pass, 'bodyFatArmy')).toBe('22.1%');
    expect(getValue(pass, 'officialBodyFat')).toBe('22%');
    expect(getValue(pass, 'passFail')).toContain('PASS');
    const fail = config.calculate({ ...base, waist: '37' }); // d = 22 -> 22.99
    expect(getValue(fail, 'bodyFatArmy')).toBe('23.0%');
    expect(getValue(fail, 'officialBodyFat')).toBe('23%');
    expect(getValue(fail, 'passFail')).toContain('FAIL');
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
    expect(edu.quickReference!.filter(q => q.label.includes('BF% max')).length).toBe(8); // 4 age groups x 2 sexes
  });
});
