import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/test-score-calculator/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Test Score Calculator', () => {
  it('score 85/100 produces 85% and B grade', () => {
    const r = config.calculate({ score: '85', total: '100' });
    expect(getValue(r, 'percentage')).toBe('85.00%');
    expect(getValue(r, 'letterGrade')).toBe('B');
    expect(getValue(r, 'gradeDescription')).toBe('Good');
  });

  it('perfect score produces 100% and A grade', () => {
    const r = config.calculate({ score: '100', total: '100' });
    expect(getValue(r, 'percentage')).toBe('100.00%');
    expect(getValue(r, 'letterGrade')).toBe('A');
    expect(getValue(r, 'gradeDescription')).toBe('Excellent');
  });

  it('failing score produces F', () => {
    const r = config.calculate({ score: '45', total: '100' });
    expect(getValue(r, 'percentage')).toBe('45.00%');
    expect(getValue(r, 'letterGrade')).toBe('F');
    expect(getValue(r, 'gradeDescription')).toBe('Failing');
  });

  it('pass/fail detection correct', () => {
    const passing = config.calculate({
      score: '75',
      total: '100',
      passingScore: '60',
    });
    expect(getValue(passing, 'passFail')).toBe('Pass');
    const passResult = passing.find((x) => x.id === 'passFail');
    expect(passResult?.color).toBe('positive');

    const failing = config.calculate({
      score: '55',
      total: '100',
      passingScore: '60',
    });
    expect(getValue(failing, 'passFail')).toBe('Fail');
    const failResult = failing.find((x) => x.id === 'passFail');
    expect(failResult?.color).toBe('negative');
  });

  it('invalid inputs return []', () => {
    expect(config.calculate({ score: '', total: '100' })).toEqual([]);
    expect(config.calculate({ score: '85', total: '' })).toEqual([]);
    expect(config.calculate({ score: '-5', total: '100' })).toEqual([]);
    expect(config.calculate({ score: 'abc', total: '100' })).toEqual([]);
    expect(config.calculate({ score: '85', total: '0' })).toEqual([]);
  });

  it('educational content meets minimums', () => {
    expect(config.educational.formulaDescription.length).toBeGreaterThanOrEqual(
      100,
    );
    expect(config.educational.variables?.length).toBe(4);
    expect(config.educational.howToUse?.length).toBe(5);
    expect(config.educational.explanation?.length).toBeGreaterThanOrEqual(300);
    expect(config.educational.faqs?.length).toBe(3);
    expect(config.educational.citations?.length).toBeGreaterThanOrEqual(1);
    expect(config.educational.commonUses?.length).toBe(3);
    expect(config.educational.quickReference?.length).toBe(5);
    expect(config.educational.diagram).toBeDefined();
    expect(config.educational.diagram?.svg).toContain('viewBox');
    expect(config.educational.diagram?.alt).toBeTruthy();
  });

  it('GPA impact calculation', () => {
    // 85/100 = B = 3.0 grade points, currentGPA=3.0, creditHours=3, totalCredits=30
    // newGPA = (3.0 * (30 - 3) + 3.0 * 3) / 30 = 3.0
    const r = config.calculate({
      score: '85',
      total: '100',
      currentGpa: '3.0',
      creditHours: '3',
    });
    const newGpa = parseNumber(getValue(r, 'newGpa'));
    near(newGpa, 3.0);
    const gpaChange = parseNumber(getValue(r, 'gpaChange'));
    near(gpaChange, 0.0);

    // A (95/100) = 4.0 grade points, currentGPA=3.0, creditHours=3
    // newGPA = (3.0 * 27 + 4.0 * 3) / 30 = (81 + 12) / 30 = 3.1
    const r2 = config.calculate({
      score: '95',
      total: '100',
      currentGpa: '3.0',
      creditHours: '3',
    });
    const newGpa2 = parseNumber(getValue(r2, 'newGpa'));
    near(newGpa2, 3.1);

    // F (50/100) = 0.0 grade points, currentGPA=3.5, creditHours=3
    // newGPA = (3.5 * 27 + 0.0 * 3) / 30 = 94.5 / 30 = 3.15
    const r3 = config.calculate({
      score: '50',
      total: '100',
      currentGpa: '3.5',
      creditHours: '3',
    });
    const newGpa3 = parseNumber(getValue(r3, 'newGpa'));
    near(newGpa3, 3.15);
  });

  it('correct answers from wrong answers', () => {
    const r = config.calculate({
      score: '85',
      total: '100',
      numQuestions: '20',
      wrongAnswers: '3',
    });
    expect(getValue(r, 'correctAnswers')).toBe('17 / 20');
    expect(getValue(r, 'correctPercentage')).toBe('85.00%');
  });

  it('boundary grade transitions', () => {
    // 90% should be A
    expect(
      getValue(config.calculate({ score: '90', total: '100' }), 'letterGrade'),
    ).toBe('A');
    // 89% should be B
    expect(
      getValue(config.calculate({ score: '89', total: '100' }), 'letterGrade'),
    ).toBe('B');
    // 80% should be B
    expect(
      getValue(config.calculate({ score: '80', total: '100' }), 'letterGrade'),
    ).toBe('B');
    // 79% should be C
    expect(
      getValue(config.calculate({ score: '79', total: '100' }), 'letterGrade'),
    ).toBe('C');
    // 70% should be C
    expect(
      getValue(config.calculate({ score: '70', total: '100' }), 'letterGrade'),
    ).toBe('C');
    // 69% should be D
    expect(
      getValue(config.calculate({ score: '69', total: '100' }), 'letterGrade'),
    ).toBe('D');
    // 60% should be D
    expect(
      getValue(config.calculate({ score: '60', total: '100' }), 'letterGrade'),
    ).toBe('D');
    // 59% should be F
    expect(
      getValue(config.calculate({ score: '59', total: '100' }), 'letterGrade'),
    ).toBe('F');
  });

  it('percentage is rounded to 2 decimal places', () => {
    const r = config.calculate({ score: '1', total: '3' });
    expect(getValue(r, 'percentage')).toBe('33.33%');
  });

  it('no GPA impact when GPA fields are empty', () => {
    const r = config.calculate({ score: '85', total: '100' });
    const gpaResult = r.find((x) => x.id === 'newGpa');
    expect(gpaResult).toBeUndefined();
  });
});
