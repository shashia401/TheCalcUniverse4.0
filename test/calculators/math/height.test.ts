import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/height';
import { getValue, parseNumber, near } from '../../helpers';

describe('height calculator', () => {
  it('Male: mother 5\'4" (64"), father 5\'10" (70") → predicted 73.5" = 6\'1.5"', () => {
    const r = config.calculate({
      motherFeet: '5',
      motherInches: '4',
      fatherFeet: '5',
      fatherInches: '10',
      childGender: 'male',
    });
    const predicted = getValue(r, 'predictedHeight');
    // Mid-parental: (64 + 70 + 13) / 2 = 73.5" = 6'1.5"
    expect(predicted).toContain("6'1.5");
    expect(predicted).toContain('cm');
    const cm = parseNumber(getValue(r, 'predictedCm'));
    near(cm, 73.5 * 2.54);
  });

  it('Female: mother 5\'4" (64"), father 5\'10" (70") → predicted 60.5" = 5\'0.5"', () => {
    const r = config.calculate({
      motherFeet: '5',
      motherInches: '4',
      fatherFeet: '5',
      fatherInches: '10',
      childGender: 'female',
    });
    const predicted = getValue(r, 'predictedHeight');
    // Mid-parental: (64 + 70 - 13) / 2 = 60.5" = 5'0.5"
    expect(predicted).toContain("5'0.5");
    expect(predicted).toContain('cm');
    const cm = parseNumber(getValue(r, 'predictedCm'));
    near(cm, 60.5 * 2.54);
  });

  it('range is ±2 inches', () => {
    const r = config.calculate({
      motherFeet: '5',
      motherInches: '4',
      fatherFeet: '5',
      fatherInches: '10',
      childGender: 'male',
    });
    const range = getValue(r, 'heightRange');
    // Predicted 73.5", range: 71.5" to 75.5"
    expect(range).toContain("5'11");
    expect(range).toContain("6'3");
  });

  it('missing mother height returns empty', () => {
    const r = config.calculate({
      motherFeet: '',
      motherInches: '',
      fatherFeet: '5',
      fatherInches: '10',
      childGender: 'male',
    });
    expect(r).toEqual([]);
  });

  it('missing father height returns empty', () => {
    const r = config.calculate({
      motherFeet: '5',
      motherInches: '4',
      fatherFeet: '',
      fatherInches: '',
      childGender: 'male',
    });
    expect(r).toEqual([]);
  });

  it('zero values return empty', () => {
    const r = config.calculate({
      motherFeet: '0',
      motherInches: '0',
      fatherFeet: '5',
      fatherInches: '10',
      childGender: 'male',
    });
    expect(r).toEqual([]);
  });

  it('returns gender correctly', () => {
    const r1 = config.calculate({
      motherFeet: '5',
      motherInches: '4',
      fatherFeet: '5',
      fatherInches: '10',
      childGender: 'male',
    });
    expect(getValue(r1, 'gender')).toBe('Male');

    const r2 = config.calculate({
      motherFeet: '5',
      motherInches: '4',
      fatherFeet: '5',
      fatherInches: '10',
      childGender: 'female',
    });
    expect(getValue(r2, 'gender')).toBe('Female');
  });

  it('returns motherHeight and fatherHeight in display format', () => {
    const r = config.calculate({
      motherFeet: '5',
      motherInches: '4',
      fatherFeet: '5',
      fatherInches: '10',
      childGender: 'male',
    });
    expect(getValue(r, 'motherHeight')).toBe("5'4\"");
    expect(getValue(r, 'fatherHeight')).toBe("5'10\"");
  });

  it('predictedHeight is highlighted and colored positive', () => {
    const r = config.calculate({
      motherFeet: '5',
      motherInches: '4',
      fatherFeet: '5',
      fatherInches: '10',
      childGender: 'male',
    });
    const predicted = r.find((x) => x.id === 'predictedHeight');
    expect(predicted?.highlight).toBe(true);
    expect(predicted?.color).toBe('positive');
  });

  it('returns mid-parental height numeric value', () => {
    const r = config.calculate({
      motherFeet: '5',
      motherInches: '4',
      fatherFeet: '5',
      fatherInches: '10',
      childGender: 'male',
    });
    const mp = parseNumber(getValue(r, 'midParental'));
    near(mp, 73.5);
  });

  it('Female: short parents — mother 4\'10" father 5\'2"', () => {
    const r = config.calculate({
      motherFeet: '4',
      motherInches: '10',
      fatherFeet: '5',
      fatherInches: '2',
      childGender: 'female',
    });
    // Mother: 58", Father: 62". Girl: (58+62-13)/2 = 53.5" = 4'5.5"
    const predicted = getValue(r, 'predictedHeight');
    expect(predicted).toContain("4'5");
  });

  it('Male: very tall parents — mother 6\'0" father 6\'6"', () => {
    const r = config.calculate({
      motherFeet: '6',
      motherInches: '0',
      fatherFeet: '6',
      fatherInches: '6',
      childGender: 'male',
    });
    // Mother: 72", Father: 78". Boy: (72+78+13)/2 = 81.5" = 6'9.5"
    const predicted = getValue(r, 'predictedHeight');
    expect(predicted).toContain("6'9");
  });

  it('range values are correct for male child', () => {
    const r = config.calculate({
      motherFeet: '5',
      motherInches: '4',
      fatherFeet: '5',
      fatherInches: '10',
      childGender: 'male',
    });
    const range = getValue(r, 'heightRange');
    // Predicted 73.5", range low = 71.5" = 5'11.5", range high = 75.5" = 6'3.5"
    expect(range).toContain('to');
  });

  it('educational content has workedExamples', () => {
    expect(config.educational.workedExamples).toBeDefined();
    expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(3);
  });

  it('educational content has 5+ FAQs', () => {
    expect(config.educational.faqs).toBeDefined();
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
  });

  it('educational content has proTips', () => {
    expect(config.educational.proTips).toBeDefined();
    expect(config.educational.proTips!.length).toBeGreaterThanOrEqual(3);
  });

  it('educational content has limitations', () => {
    expect(config.educational.limitations).toBeDefined();
    expect(config.educational.limitations!.length).toBeGreaterThanOrEqual(3);
  });

  it('educational content has quickReference', () => {
    expect(config.educational.quickReference).toBeDefined();
    expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(5);
  });

  it('number inputs have inputMode decimal', () => {
    const numInputs = config.inputs.filter((i: { type: string }) => i.type === 'number');
    expect(numInputs.length).toBeGreaterThan(0);
    for (const inp of numInputs) {
      expect((inp as { inputMode?: string }).inputMode).toBe('decimal');
    }
  });
});
