import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/gpa/index';
import { calcGpa, neededGpa, weightBonus } from '../../../src/calculators/math/gpa/gradeScale';
import { getValue } from '../../helpers';

const calc = (courses: unknown[], scale?: string) =>
  config.calculate({ mode: 'calculate', courses: JSON.stringify(courses), ...(scale ? { scale } : {}) });
const target = (current: string, done: string, goal: string, left: string, scale?: string) =>
  config.calculate({ mode: 'target', currentGPA: current, creditsCompleted: done, targetGPA: goal, remainingCredits: left, ...(scale ? { scale } : {}) });

// Expected values are hand calculation with exact fractions (each comment shows the arithmetic).
describe('GPA (calculate mode)', () => {
  it('standard scale, mixed weights: (4x4 + 3x3.8 + 2x2.7)/9 = 3.6444 weighted, 29.3/9 = 3.2556 unweighted', () => {
    const r = calc([
      { name: 'Math', grade: 'A', credits: '4', weight: 'Regular' },
      { name: 'Lit', grade: 'B+', credits: '3', weight: 'Honors' }, // 3.3 + 0.5
      { name: 'Chem', grade: 'C-', credits: '2', weight: 'AP/IB' }, // 1.7 + 1.0
    ]);
    expect(getValue(r, 'gpa')).toBe('3.64');
    expect(getValue(r, 'unweightedGpa')).toBe('3.26');
    expect(getValue(r, 'totalCredits')).toBe('9');
    expect(getValue(r, 'totalGradePoints')).toBe('32.80');
    expect(r.find((x) => x.id === 'gpa')?.label).toBe('Weighted GPA');
  });
  it('REGRESSION: AP "A" is 5.0, not 4.4 (old multiplier 1.1); one AP A + one regular A = 4.5', () => {
    const r = calc([{ name: 'AP', grade: 'A', credits: '3', weight: 'AP/IB' }, { name: 'PE', grade: 'A', credits: '3', weight: 'Regular' }]);
    expect(getValue(r, 'gpa')).toBe('4.50');
    expect(getValue(r, 'unweightedGpa')).toBe('4.00');
  });
  it('REGRESSION: A+ is 4.0 on the standard scale (old code gave 4.33 and pushed unweighted GPA above 4.0)', () => {
    expect(getValue(calc([{ name: 'x', grade: 'A+', credits: '3', weight: 'Regular' }]), 'gpa')).toBe('4.00');
  });
  it('thirds scale: A+ 4.33 and A- 3.67 -> (3 x 4.33 + 3 x 3.67)/6 = 4.00; B+ is 3.33 vs 3.30', () => {
    const r = calc([{ name: 'a', grade: 'A+', credits: '3' }, { name: 'b', grade: 'A-', credits: '3' }], 'thirds');
    expect(getValue(r, 'gpa')).toBe('4.00');
    expect(getValue(calc([{ name: 'a', grade: 'B+', credits: '3' }], 'thirds'), 'gpa')).toBe('3.33');
    expect(getValue(calc([{ name: 'a', grade: 'B+', credits: '3' }], 'standard'), 'gpa')).toBe('3.30');
  });
  it('an F earns no weighting bonus: AP F + regular A = (0 + 12)/6 = 2.00 both ways', () => {
    const r = calc([{ name: 'AP', grade: 'F', credits: '3', weight: 'AP/IB' }, { name: 'x', grade: 'A', credits: '3', weight: 'Regular' }]);
    expect(getValue(r, 'gpa')).toBe('2.00');
    expect(getValue(r, 'unweightedGpa')).toBe('2.00');
  });
  it('fractional credits: (1.5 x 3 + 3 x 4)/4.5 = 3.67', () => {
    const r = calc([{ name: 'a', grade: 'B', credits: '1.5' }, { name: 'b', grade: 'A', credits: '3' }]);
    expect(getValue(r, 'gpa')).toBe('3.67');
    expect(getValue(r, 'totalCredits')).toBe('4.5');
  });
  it('B + A- over equal credits = 3.35 exactly', () => {
    expect(getValue(calc([{ name: 'a', grade: 'B', credits: '1' }, { name: 'b', grade: 'A-', credits: '1' }]), 'gpa')).toBe('3.35');
  });
  it('blank rows are skipped (the form starts with two empty rows)', () => {
    const r = calc([{ name: '', grade: '', credits: '', weight: 'Regular' }, { name: 'a', grade: 'A', credits: '3', weight: 'Regular' }, { name: '', grade: '', credits: '' }]);
    expect(getValue(r, 'gpa')).toBe('4.00');
    expect(getValue(r, 'courseCount')).toBe('1');
  });
  it('half-filled, invalid-grade, zero-credit or all-blank input is incomplete', () => {
    expect(calc([{ name: 'a', grade: 'A', credits: '' }])).toEqual([]);
    expect(calc([{ name: 'a', grade: '', credits: '3' }])).toEqual([]);
    expect(calc([{ name: 'a', grade: 'E', credits: '3' }])).toEqual([]);
    expect(calc([{ name: 'a', grade: 'A', credits: '0' }])).toEqual([]);
    expect(calc([{ name: 'a', grade: 'A', credits: '3abc' }])).toEqual([]);
    expect(calc([{ name: '', grade: '', credits: '' }, { name: '', grade: '', credits: '' }])).toEqual([]);
    expect(config.calculate({ mode: 'calculate', courses: '' })).toEqual([]);
  });
  it('credits may arrive as JSON numbers', () => {
    expect(getValue(calc([{ name: 'a', grade: 'A', credits: 3, weight: 'Regular' }]), 'gpa')).toBe('4.00');
  });
  it('weightBonus parses spellings', () => {
    expect(weightBonus('Honors').toNumber()).toBe(0.5);
    expect(weightBonus('honours').toNumber()).toBe(0.5);
    for (const w of ['AP', 'ib', 'AP/IB', 'AP / IB']) expect(weightBonus(w).toNumber()).toBe(1);
    expect(weightBonus('Regular').toNumber()).toBe(0);
    expect(weightBonus(undefined).toNumber()).toBe(0);
  });
  it('calcGpa returns null for unknown grades; points per row use bonus x credits', () => {
    expect(calcGpa([{ name: 'a', grade: 'Z', credits: 3, weight: '' }], 'standard')).toBeNull();
    const r = calcGpa([{ name: 'a', grade: 'B', credits: 4, weight: 'AP' }], 'standard')!;
    expect(r.rows[0].points).toBe(16);
  });
});

describe('Target GPA mode', () => {
  it('FAQ example: 3.2 after 60 credits, target 3.5 after 120 -> needs 3.80 = grade A', () => {
    const r = target('3.2', '60', '3.5', '60');
    expect(getValue(r, 'neededGPA')).toBe('3.80');
    expect(getValue(r, 'neededGrade')).toBe('A');
  });
  it('exact boundary 3.7 maps to A- (float arithmetic gives 3.6999999999999993)', () => {
    const r = target('3', '3', '3.35', '3');
    expect(getValue(r, 'neededGPA')).toBe('3.70');
    expect(getValue(r, 'neededGrade')).toBe('A-');
  });
  it('needed 3.5 -> A- on both scales (3.7 standard, 3.67 thirds)', () => {
    expect(getValue(target('3', '30', '3.25', '30', 'thirds'), 'neededGrade')).toBe('A-');
    expect(getValue(target('3', '30', '3.25', '30'), 'neededGrade')).toBe('A-');
  });
  it('REGRESSION: impossible target is judged against the scale maximum: 4.0 standard / 4.33 thirds', () => {
    // (4.0 x 70 - 3.0 x 60) / 10 = 10.0
    const r = target('3.0', '60', '4.0', '10');
    expect(getValue(r, 'neededGPA')).toBe('10.00');
    expect(getValue(r, 'neededGrade')).toContain('not enough');
    expect(r.find((x) => x.id === 'neededGPA')?.warning).toContain('maximum of 4.00');
    // (4.1 x 20 - 4 x 10) / 10 = 4.2: impossible on standard (max 4.0), reachable on thirds (max 4.33 -> A+)
    expect(neededGpa(4, 10, 4.1, 10, 'standard').impossible).toBe(true);
    expect(neededGpa(4, 10, 4.1, 10, 'thirds').letter).toBe('A+');
  });
  it('secured target: even F in every remaining credit keeps it -> 0.00, any grade (was a negative GPA)', () => {
    const r = target('4.0', '60', '2.0', '10');
    expect(getValue(r, 'neededGPA')).toBe('0.00');
    expect(getValue(r, 'neededGrade')).toBe('Any grade (target already secured)');
    expect(neededGpa(4, 60, 2, 10, 'standard').secured).toBe(true);
  });
  it('REGRESSION: a first-term student (0 credits done, GPA 0) is valid: target 3.5 over 30 credits needs 3.50 -> A-', () => {
    const r = target('0', '0', '3.5', '30');
    expect(getValue(r, 'neededGPA')).toBe('3.50');
    expect(getValue(r, 'neededGrade')).toBe('A-');
  });
  it('lowest passing letter: needed 0.5 -> D-, exactly 0.7 -> D-, 0.71 -> D, 4.0 -> A (not A+)', () => {
    expect(neededGpa(0, 0, 0.5, 1, 'standard').letter).toBe('D-');
    expect(neededGpa(0, 0, 0.7, 1, 'standard').letter).toBe('D-');
    expect(neededGpa(0, 0, 0.71, 1, 'standard').letter).toBe('D');
    expect(neededGpa(0, 0, 4, 1, 'standard').letter).toBe('A');
  });
  it('invalid input: blank, negative, zero remaining credits, junk', () => {
    expect(target('', '60', '3.5', '60')).toEqual([]);
    expect(target('3.2', '60', '3.5', '0')).toEqual([]);
    expect(target('3.2', '-1', '3.5', '60')).toEqual([]);
    expect(target('3.2x', '60', '3.5', '60')).toEqual([]);
  });
});
