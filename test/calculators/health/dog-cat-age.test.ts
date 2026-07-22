import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/dog-cat-age/index';
import { getValue } from '../../helpers';

describe('Dog/Cat Age in Human Years calculator', () => {
  it('returns traditional ~15 human years for a 1-year-old dog', () => {
    const r = config.calculate({
      species: 'dog',
      dogSize: 'medium',
      petAgeYears: '1',
    });
    const traditional = getValue(r, 'traditionalAge');
    expect(traditional).toContain('15');
  });

  it('returns correct epigenetic age for a 5-year-old dog', () => {
    const r = config.calculate({
      species: 'dog',
      dogSize: 'medium',
      petAgeYears: '5',
    });
    const epigenetic = getValue(r, 'epigeneticAge');
    // 16 * ln(5) + 31 ≈ 56.75
    const num = parseFloat(epigenetic);
    expect(num).toBeGreaterThan(55);
    expect(num).toBeLessThan(58);
  });

  it('returns correct traditional age for a 5-year-old dog', () => {
    const r = config.calculate({
      species: 'dog',
      dogSize: 'medium',
      petAgeYears: '5',
    });
    const traditional = getValue(r, 'traditionalAge');
    // 15 + 9 + 3*4 = 36
    expect(traditional).toContain('36');
  });

  it('returns correct cat age for a 10-year-old cat (15+9+8×4=56)', () => {
    const r = config.calculate({
      species: 'cat',
      petAgeYears: '10',
    });
    const catAge = getValue(r, 'catHumanAge');
    expect(catAge).toContain('56');
  });

  it('returns empty array when no age is provided', () => {
    const r = config.calculate({
      species: 'dog',
      dogSize: 'medium',
      petAgeYears: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array when age is 0', () => {
    const r = config.calculate({
      species: 'dog',
      dogSize: 'medium',
      petAgeYears: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns life stage for a dog', () => {
    const r = config.calculate({
      species: 'dog',
      dogSize: 'large',
      petAgeYears: '8',
    });
    const stage = getValue(r, 'lifeStage');
    expect(stage).toBeTruthy();
  });

  it('returns life stage for a cat', () => {
    const r = config.calculate({
      species: 'cat',
      petAgeYears: '3',
    });
    const stage = getValue(r, 'lifeStage');
    expect(stage).toBe('Adult');
  });

  it('shows epigenetic method note for dogs under 1 year', () => {
    const r = config.calculate({
      species: 'dog',
      dogSize: 'small',
      petAgeYears: '0.5',
    });
    const note = getValue(r, 'epigeneticNote');
    expect(note).toContain('Applies to dogs');
  });

  it('handles cat puppy life stage correctly', () => {
    const r = config.calculate({
      species: 'cat',
      petAgeYears: '0.5',
    });
    const stage = getValue(r, 'lifeStage');
    expect(stage).toBe('Kitten');
  });
});
