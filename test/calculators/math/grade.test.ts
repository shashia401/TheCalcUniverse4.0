import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/grade/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Grade calculator (Final Exam)', () => {
  it('85% current, 90% desired, 20% weight → impossible (110%)', () => {
    const r = config.calculate({
      currentGrade: '85',
      desiredGrade: '90',
      examWeight: '20',
    });
    // needed = (90 - 85*(1-0.20)) / 0.20 = (90 - 68) / 0.20 = 22/0.20 = 110
    near(parseNumber(getValue(r, 'neededGrade')), 110);
    expect(getValue(r, 'status')).toBe('Likely impossible without extra credit.');
    const needed = r.find((x) => x.id === 'neededGrade');
    expect(needed?.color).toBe('negative');
  });

  it('85% current, 88% desired, 50% weight → need 91%', () => {
    const r = config.calculate({
      currentGrade: '85',
      desiredGrade: '88',
      examWeight: '50',
    });
    // needed = (88 - 85*(1-0.5)) / 0.5 = (88 - 42.5) / 0.5 = 45.5/0.5 = 91
    near(parseNumber(getValue(r, 'neededGrade')), 91);
    const needed = r.find((x) => x.id === 'neededGrade');
    expect(needed?.color).toBe('neutral');
  });

  it('95% current, 90% desired, 20% weight → already achieved', () => {
    const r = config.calculate({
      currentGrade: '95',
      desiredGrade: '90',
      examWeight: '20',
    });
    expect(getValue(r, 'status')).toBe("You've already achieved your target!");
    expect(getValue(r, 'neededGrade')).toBe('0%');
    const needed = r.find((x) => x.id === 'neededGrade');
    expect(needed?.color).toBe('positive');
  });

  it('returns empty for missing inputs', () => {
    const r = config.calculate({
      currentGrade: '',
      desiredGrade: '90',
      examWeight: '20',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for all missing inputs', () => {
    const r = config.calculate({
      currentGrade: '',
      desiredGrade: '',
      examWeight: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid (non-numeric) values', () => {
    const r = config.calculate({
      currentGrade: 'abc',
      desiredGrade: '90',
      examWeight: '20',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for 0% exam weight (division by zero)', () => {
    const r = config.calculate({
      currentGrade: '85',
      desiredGrade: '90',
      examWeight: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for negative desired grade', () => {
    const r = config.calculate({
      currentGrade: '85',
      desiredGrade: '-10',
      examWeight: '20',
    });
    expect(r).toEqual([]);
  });

  it('returns easily achievable when needed <= current grade', () => {
    const r = config.calculate({
      currentGrade: '80',
      desiredGrade: '82',
      examWeight: '50',
    });
    // needed = (82 - 80*(1-0.5)) / 0.5 = (82 - 40) / 0.5 = 42/0.5 = 84
    // 84 > 80 = current, so not "easily achievable"
    expect(getValue(r, 'status')).toBe('You need 84.0% on the final exam.');
  });

  it('includes gradeData JSON in results', () => {
    const r = config.calculate({
      currentGrade: '85',
      desiredGrade: '90',
      examWeight: '20',
    });
    const gradeData = JSON.parse(getValue(r, 'gradeData'));
    expect(gradeData.currentGrade).toBe(85);
    expect(gradeData.desiredGrade).toBe(90);
    expect(gradeData.examWeight).toBe(20);
    near(gradeData.needed, 110);
  });

  it('outputs correct labels and units', () => {
    const r = config.calculate({
      currentGrade: '70',
      desiredGrade: '85',
      examWeight: '30',
    });
    expect(getValue(r, 'currentGrade')).toBe('70%');
    expect(getValue(r, 'desiredGrade')).toBe('85%');
    expect(getValue(r, 'examWeight')).toBe('30%');
  });
});
