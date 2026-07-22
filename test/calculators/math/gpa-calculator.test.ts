import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/gpa';
import { getValue, parseNumber, near } from '../../helpers';

describe('GPA Calculator', () => {
  it('calculates GPA from list of courses (JSON format)', () => {
    const r = config.calculate({
      mode: 'calculate',
      courses: JSON.stringify([
        { name: 'Math', grade: 'A', credits: '3', weight: 'regular' },
        { name: 'English', grade: 'B', credits: '3', weight: 'regular' },
      ]),
    });
    const gpa = parseNumber(getValue(r, 'gpa'));
    near(gpa, 3.5, 0.01); // (4.0*3 + 3.0*3) / 6 = 3.5
  });

  it('calculates weighted GPA with AP courses', () => {
    const r = config.calculate({
      mode: 'calculate',
      courses: JSON.stringify([
        { name: 'AP Calculus', grade: 'B+', credits: '4', weight: 'ap' },
        { name: 'History', grade: 'A', credits: '3', weight: 'regular' },
      ]),
    });
    const gpa = parseNumber(getValue(r, 'gpa'));
    near(gpa, 3.81, 0.05);
  });

  it('calculates unweighted GPA', () => {
    const r = config.calculate({
      mode: 'calculate',
      courses: JSON.stringify([
        { name: 'AP Bio', grade: 'A', credits: '4', weight: 'ap' },
      ]),
    });
    const unweighted = parseNumber(getValue(r, 'unweightedGpa'));
    near(unweighted, 4.0, 0.01);
  });

  it('returns empty array for empty courses', () => {
    const r = config.calculate({
      mode: 'calculate',
      courses: '[]',
    });
    expect(r).toEqual([]);
  });

  it('target GPA mode with feasible grade', () => {
    const r = config.calculate({
      mode: 'target',
      currentGPA: '3.0',
      creditsCompleted: '60',
      targetGPA: '3.3',
      remainingCredits: '30',
    });
    const needed = parseNumber(getValue(r, 'neededGPA'));
    near(needed, 3.9, 0.01);
    expect(getValue(r, 'neededGrade')).not.toContain('impossible');
  });

  it('handles CSV course format', () => {
    const r = config.calculate({
      mode: 'calculate',
      courses: 'Math,A,3,regular\nEnglish,B+,3,honors',
    });
    const gpa = parseNumber(getValue(r, 'gpa'));
    expect(gpa).toBeGreaterThan(0);
  });

  it('target GPA mode with impossible target', () => {
    const r = config.calculate({
      mode: 'target',
      currentGPA: '3.0',
      creditsCompleted: '60',
      targetGPA: '4.0',
      remainingCredits: '10',
    });
    const needed = parseNumber(getValue(r, 'neededGPA'));
    expect(needed).toBeGreaterThan(4.33);
    expect(getValue(r, 'neededGrade')).toContain('impossible');
  });
});
