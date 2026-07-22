import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/dog-cat-age/index';
import { getValue, getResult } from '../../helpers';

describe('Dog & Cat Age Calculator', () => {
  // ── Edge case / guard clauses ──
  it('returns empty array for NaN age input', () => {
    const r = config.calculate({
      species: 'dog',
      dogSize: 'medium',
      petAgeYears: 'abc',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for negative age', () => {
    const r = config.calculate({
      species: 'dog',
      dogSize: 'medium',
      petAgeYears: '-5',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for age zero', () => {
    const r = config.calculate({
      species: 'cat',
      petAgeYears: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for empty age string', () => {
    const r = config.calculate({
      species: 'dog',
      dogSize: 'large',
      petAgeYears: '',
    });
    expect(r).toEqual([]);
  });

  // ── Dog calculations ──
  it('calculates traditional dog age for a 1-year-old dog', () => {
    const r = config.calculate({
      species: 'dog',
      dogSize: 'medium',
      petAgeYears: '1',
    });
    expect(getValue(r, 'traditionalAge')).toContain('15');
  });

  it('calculates traditional dog age for a 3-year-old medium dog', () => {
    const r = config.calculate({
      species: 'dog',
      dogSize: 'medium',
      petAgeYears: '3',
    });
    // Traditional: 15 + 9 + (3-2)*4 = 28
    expect(getValue(r, 'traditionalAge')).toContain('28');
  });

  it('calculates traditional dog age for a 10-year-old dog', () => {
    const r = config.calculate({
      species: 'dog',
      dogSize: 'large',
      petAgeYears: '10',
    });
    // Traditional: 15 + 9 + (10-2)*4 = 56
    expect(getValue(r, 'traditionalAge')).toContain('56');
  });

  it('provides epigenetic age for dog aged >= 1', () => {
    const r = config.calculate({
      species: 'dog',
      dogSize: 'medium',
      petAgeYears: '3',
    });
    // Epigenetic: 16 * ln(3) + 31 = 16*1.099 + 31 = 48.6
    const epi = getValue(r, 'epigeneticAge');
    const epiNum = parseFloat(epi);
    expect(epiNum).toBeGreaterThan(40);
    expect(epiNum).toBeLessThan(55);
  });

  it('shows epigenetic note for dog under 1 year (epigenetic not applicable)', () => {
    const r = config.calculate({
      species: 'dog',
      dogSize: 'small',
      petAgeYears: '0.5',
    });
    // Epigenetic not applicable — should show note, not age
    expect(r.find((x) => x.id === 'epigeneticNote')).toBeTruthy();
    expect(r.find((x) => x.id === 'epigeneticAge')).toBeUndefined();
  });

  it('classifies a 0.5-year-old dog as Puppy', () => {
    const r = config.calculate({
      species: 'dog',
      dogSize: 'medium',
      petAgeYears: '0.5',
    });
    expect(getValue(r, 'lifeStage')).toBe('Puppy');
  });

  it('classifies a 1.5-year-old dog as Junior', () => {
    const r = config.calculate({
      species: 'dog',
      dogSize: 'medium',
      petAgeYears: '1.5',
    });
    expect(getValue(r, 'lifeStage')).toBe('Junior');
  });

  it('classifies a 4-year-old medium dog as Adult', () => {
    const r = config.calculate({
      species: 'dog',
      dogSize: 'medium',
      petAgeYears: '4',
    });
    expect(getValue(r, 'lifeStage')).toBe('Adult');
  });

  it('classifies a 5-year-old large dog as Mature (not Adult)', () => {
    const r = config.calculate({
      species: 'dog',
      dogSize: 'large',
      petAgeYears: '5',
    });
    expect(getValue(r, 'lifeStage')).toBe('Mature');
  });

  it('classifies an 8-year-old small dog as Mature', () => {
    const r = config.calculate({
      species: 'dog',
      dogSize: 'small',
      petAgeYears: '8',
    });
    expect(getValue(r, 'lifeStage')).toBe('Mature');
  });

  it('classifies an 8-year-old large dog as Senior', () => {
    const r = config.calculate({
      species: 'dog',
      dogSize: 'large',
      petAgeYears: '8',
    });
    expect(getValue(r, 'lifeStage')).toBe('Senior');
  });

  it('classifies a 12-year-old dog as Senior', () => {
    const r = config.calculate({
      species: 'dog',
      dogSize: 'medium',
      petAgeYears: '12',
    });
    expect(getValue(r, 'lifeStage')).toBe('Senior');
  });

  it('classifies a 16-year-old dog as Geriatric', () => {
    const r = config.calculate({
      species: 'dog',
      dogSize: 'small',
      petAgeYears: '16',
    });
    expect(getValue(r, 'lifeStage')).toBe('Geriatric');
  });

  // ── Cat calculations ──
  it('calculates cat human age for a 3-year-old cat', () => {
    const r = config.calculate({
      species: 'cat',
      petAgeYears: '3',
    });
    // Cat: 15 + 9 + (3-2)*4 = 28
    expect(getValue(r, 'catHumanAge')).toContain('28');
  });

  it('calculates cat human age for a 15-year-old cat', () => {
    const r = config.calculate({
      species: 'cat',
      petAgeYears: '15',
    });
    // Cat: 15 + 9 + (15-2)*4 = 76
    expect(getValue(r, 'catHumanAge')).toContain('76');
  });

  it('shows traditional x7 comparison for cats', () => {
    const r = config.calculate({
      species: 'cat',
      petAgeYears: '5',
    });
    // x7 method: 5 * 7 = 35
    expect(getValue(r, 'traditionalSeven')).toContain('35');
  });

  it('classifies a 0.5-year-old cat as Kitten', () => {
    const r = config.calculate({
      species: 'cat',
      petAgeYears: '0.25',
    });
    expect(getValue(r, 'lifeStage')).toBe('Kitten');
  });

  it('classifies an 8-year-old cat as Mature', () => {
    const r = config.calculate({
      species: 'cat',
      petAgeYears: '8',
    });
    expect(getValue(r, 'lifeStage')).toBe('Mature');
  });

  it('classifies a 16-year-old cat as Geriatric', () => {
    const r = config.calculate({
      species: 'cat',
      petAgeYears: '16',
    });
    expect(getValue(r, 'lifeStage')).toBe('Geriatric');
  });

  // ── Result structure checks ──
  it('returns exactly 3 results for a dog aged 2+', () => {
    const r = config.calculate({
      species: 'dog',
      dogSize: 'medium',
      petAgeYears: '5',
    });
    expect(r).toHaveLength(3);
  });

  it('returns exactly 3 results for a cat', () => {
    const r = config.calculate({
      species: 'cat',
      petAgeYears: '4',
    });
    expect(r).toHaveLength(3);
  });

  it('highlights the primary result for cat', () => {
    const r = config.calculate({
      species: 'cat',
      petAgeYears: '7',
    });
    const primary = getResult(r, 'catHumanAge');
    expect(primary.highlight).toBe(true);
  });

  it('highlights the epigenetic result for dog aged >= 1', () => {
    const r = config.calculate({
      species: 'dog',
      dogSize: 'medium',
      petAgeYears: '4',
    });
    const epi = getResult(r, 'epigeneticAge');
    expect(epi.highlight).toBe(true);
  });

  // ── Educational content ──
  it('has educational content', () => {
    expect(config.educational).toBeDefined();
    expect(config.educational.faqs).toBeDefined();
    expect(config.educational.faqs.length).toBeGreaterThanOrEqual(7);
  });

  it('has worked examples', () => {
    expect(config.educational.workedExamples).toBeDefined();
    expect(config.educational.workedExamples.length).toBeGreaterThanOrEqual(3);
  });

  it('has pro tips', () => {
    expect(config.educational.proTips).toBeDefined();
    expect(config.educational.proTips.length).toBeGreaterThanOrEqual(4);
  });

  it('has limitations', () => {
    expect(config.educational.limitations).toBeDefined();
    expect(config.educational.limitations.length).toBeGreaterThanOrEqual(3);
  });

  it('has citations', () => {
    expect(config.educational.citations).toBeDefined();
    expect(config.educational.citations.length).toBeGreaterThanOrEqual(2);
  });

  it('has variables section', () => {
    expect(config.educational.variables).toBeDefined();
    expect(config.educational.variables.length).toBeGreaterThanOrEqual(3);
  });

  // ── Input configuration ──
  it('has inputMode set on number field', () => {
    const numInput = config.inputs.find((i) => i.id === 'petAgeYears');
    expect(numInput).toBeDefined();
    expect(numInput.type).toBe('number');
    expect(numInput.inputMode).toBe('decimal');
  });

  it('all inputs have helpText', () => {
    for (const input of config.inputs) {
      expect(input.helpText).toBeTruthy();
    }
  });

  it('has showWhen conditional for dogSize input', () => {
    const dogSizeInput = config.inputs.find((i) => i.id === 'dogSize');
    expect(dogSizeInput).toBeDefined();
    expect(dogSizeInput.showWhen).toBeDefined();
    // Should show when species is dog
    expect(dogSizeInput.showWhen({ species: 'dog' })).toBe(true);
    expect(dogSizeInput.showWhen({ species: 'cat' })).toBe(false);
  });
});
