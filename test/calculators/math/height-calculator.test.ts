import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/height/index';

describe('Height Calculator (Mid-Parental Height)', () => {
  it('predicts boy height correctly', () => {
    const r = config.calculate({
      motherFeet: '5',
      motherInches: '4',
      fatherFeet: '5',
      fatherInches: '10',
      childGender: 'male',
    });
    const predicted = r.find((x) => x.id === 'predictedHeight');
    expect(predicted).toBeTruthy();
    // Mother 64", Father 70" -> (64+70+13)/2 = 73.5" = 6'1.5"
    expect(predicted!.value).toContain("6'");
    expect(predicted!.value).toContain('1.5');
  });

  it('predicts girl height correctly', () => {
    const r = config.calculate({
      motherFeet: '5',
      motherInches: '4',
      fatherFeet: '5',
      fatherInches: '10',
      childGender: 'female',
    });
    const predicted = r.find((x) => x.id === 'predictedHeight');
    expect(predicted).toBeTruthy();
    // Mother 64", Father 70" -> (64+70-13)/2 = 60.5" = 5'0.5"
    expect(predicted!.value).toContain("5'");
    expect(predicted!.value).toContain('0.5');
  });

  it('shows predicted height in cm', () => {
    const r = config.calculate({
      motherFeet: '5',
      motherInches: '4',
      fatherFeet: '5',
      fatherInches: '10',
      childGender: 'male',
    });
    const cm = r.find((x) => x.id === 'predictedCm');
    expect(cm).toBeTruthy();
    expect(parseFloat(cm!.value)).toBeGreaterThan(170);
    expect(parseFloat(cm!.value)).toBeLessThan(200);
  });

  it('shows expected range', () => {
    const r = config.calculate({
      motherFeet: '5',
      motherInches: '4',
      fatherFeet: '5',
      fatherInches: '10',
      childGender: 'female',
    });
    const range = r.find((x) => x.id === 'heightRange');
    expect(range).toBeTruthy();
    expect(range!.value).toContain('to');
  });

  it('shows mid-parental height', () => {
    const r = config.calculate({
      motherFeet: '5',
      motherInches: '4',
      fatherFeet: '5',
      fatherInches: '10',
      childGender: 'male',
    });
    const mid = r.find((x) => x.id === 'midParental');
    expect(mid).toBeTruthy();
    expect(parseFloat(mid!.value)).toBeGreaterThan(60);
  });

  it('returns empty for missing mother height', () => {
    const r = config.calculate({
      motherFeet: '',
      motherInches: '4',
      fatherFeet: '5',
      fatherInches: '10',
      childGender: 'male',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for missing father height', () => {
    const r = config.calculate({
      motherFeet: '5',
      motherInches: '4',
      fatherFeet: '',
      fatherInches: '10',
      childGender: 'male',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for missing child gender', () => {
    const r = config.calculate({
      motherFeet: '5',
      motherInches: '4',
      fatherFeet: '5',
      fatherInches: '10',
    });
    expect(r).toEqual([]);
  });

  it('returns empty when all heights are zero', () => {
    const r = config.calculate({
      motherFeet: '0',
      motherInches: '0',
      fatherFeet: '0',
      fatherInches: '0',
      childGender: 'male',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for non-numeric values', () => {
    const r = config.calculate({
      motherFeet: 'abc',
      motherInches: '4',
      fatherFeet: '5',
      fatherInches: '10',
      childGender: 'male',
    });
    expect(r).toEqual([]);
  });

  it('displays mother and father heights', () => {
    const r = config.calculate({
      motherFeet: '5',
      motherInches: '4',
      fatherFeet: '5',
      fatherInches: '10',
      childGender: 'male',
    });
    const mother = r.find((x) => x.id === 'motherHeight');
    const father = r.find((x) => x.id === 'fatherHeight');
    expect(mother).toBeTruthy();
    expect(father).toBeTruthy();
    expect(mother!.value).toContain("'");
    expect(father!.value).toContain("'");
  });

  it('displays gender correctly', () => {
    const r = config.calculate({
      motherFeet: '5',
      motherInches: '4',
      fatherFeet: '5',
      fatherInches: '10',
      childGender: 'female',
    });
    const gender = r.find((x) => x.id === 'gender');
    expect(gender!.value).toBe('Female');
  });

  it('has educational content', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.formulaDescription!.length).toBeGreaterThan(50);
    expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.howToUse!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.commonUses!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
    expect(config.educational.citations!.length).toBeGreaterThanOrEqual(2);
    expect(config.educational.explanation!.length).toBeGreaterThan(300);
    expect(config.educational.diagram).toBeTruthy();
    expect(config.educational.diagram!.svg).toBeTruthy();
    expect(config.educational.diagram!.alt).toBeTruthy();
  });
});
