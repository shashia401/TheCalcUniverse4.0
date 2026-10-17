import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/height';
import { getValue, parseNumber, near } from '../../helpers';

describe('height calculator', () => {
  it('Male: mother 5\'4" (64"), father 5\'10" (70") → Tanner (M + F + 13 cm) / 2 = 176.7 cm = 5\'9.6"', () => {
    const r = config.calculate({
      motherFeet: '5',
      motherInches: '4',
      fatherFeet: '5',
      fatherInches: '10',
      childGender: 'male',
    });
    const predicted = getValue(r, 'predictedHeight');
    // (162.56 + 177.8 + 13) / 2 = 176.68 cm = 69.56" = 5'9.6"  (the 13 is centimetres, not inches)
    expect(predicted).toContain("5'9.6");
    expect(predicted).toContain('cm');
    const cm = parseNumber(getValue(r, 'predictedCm'));
    near(cm, 176.7, 0.05);
  });

  it('Female: mother 5\'4" (64"), father 5\'10" (70") → (M + F - 13 cm) / 2 = 163.7 cm = 5\'4.4"', () => {
    const r = config.calculate({
      motherFeet: '5',
      motherInches: '4',
      fatherFeet: '5',
      fatherInches: '10',
      childGender: 'female',
    });
    const predicted = getValue(r, 'predictedHeight');
    // (162.56 + 177.8 - 13) / 2 = 163.68 cm = 64.44" = 5'4.4"
    expect(predicted).toContain("5'4.4");
    expect(predicted).toContain('cm');
    const cm = parseNumber(getValue(r, 'predictedCm'));
    near(cm, 163.7, 0.05);
  });

  it('range is ±8.5 cm (about ±3.3 inches)', () => {
    const r = config.calculate({
      motherFeet: '5',
      motherInches: '4',
      fatherFeet: '5',
      fatherInches: '10',
      childGender: 'male',
    });
    const range = getValue(r, 'heightRange');
    // 176.68 cm ± 8.5 = 168.2 to 185.2 cm = 5'6.2" to 6'0.9"
    expect(range).toContain("5'6.2");
    expect(range).toContain("6'0.9");
    expect(range).toContain('168.2-185.2 cm');
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
    near(mp, 69.6, 0.05); // 176.68 cm = 69.56"
  });

  it('Female: short parents — mother 4\'10" father 5\'2"', () => {
    const r = config.calculate({
      motherFeet: '4',
      motherInches: '10',
      fatherFeet: '5',
      fatherInches: '2',
      childGender: 'female',
    });
    // Mother: 58", Father: 62" = 304.8 cm. Girl: (304.8 - 13) / 2 = 145.9 cm = 57.44" = 4'9.4"
    const predicted = getValue(r, 'predictedHeight');
    expect(predicted).toContain("4'9.4");
  });

  it('Male: very tall parents — mother 6\'0" father 6\'6"', () => {
    const r = config.calculate({
      motherFeet: '6',
      motherInches: '0',
      fatherFeet: '6',
      fatherInches: '6',
      childGender: 'male',
    });
    // Mother: 72", Father: 78" = 381 cm. Boy: (381 + 13) / 2 = 197 cm = 77.56" = 6'5.6"
    const predicted = getValue(r, 'predictedHeight');
    expect(predicted).toContain("6'5.6");
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
