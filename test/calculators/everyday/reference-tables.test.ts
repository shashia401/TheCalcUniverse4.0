// B6e: the study-hours reference table is pinned to an independent Python (Fraction) calculation.
// Hours = (100 pages / pages-per-hour) x difficulty multiplier (0.8 / 1.0 / 1.5), rounded half-up to 2 places.
import { describe, it, expect } from 'vitest';
import study from '../../../src/calculators/everyday/study-time-calculator';
import { studyHoursRows, DIFFICULTY_MULTIPLIERS } from '../../../src/calculators/everyday/study-time-calculator/studyMath';
import { getValue } from '../../helpers';

describe('Study time: hours for 100 pages by pace and difficulty', () => {
  const python: [string, string][] = [
    ['100 pages at 10 pages/hour', 'Easy 8.00 h · Medium 10.00 h · Hard 15.00 h'],
    ['100 pages at 20 pages/hour', 'Easy 4.00 h · Medium 5.00 h · Hard 7.50 h'],
    ['100 pages at 30 pages/hour', 'Easy 2.67 h · Medium 3.33 h · Hard 5.00 h'],
    ['100 pages at 40 pages/hour', 'Easy 2.00 h · Medium 2.50 h · Hard 3.75 h'],
  ];

  it('matches the Python reference', () => {
    expect(studyHoursRows().map((r) => [r.label, r.value])).toEqual(python);
  });

  it('is published in the educational quick reference alongside the multipliers', () => {
    const rows = study.educational!.quickReference!;
    for (const [label, value] of python) expect(rows).toContainEqual({ label, value });
    expect(DIFFICULTY_MULTIPLIERS).toEqual({ Easy: 0.8, Medium: 1.0, Hard: 1.5 });
  });

  it('agrees with the calculator (100 pages, 30 pages/hour, hard)', () => {
    const r = study.calculate({
      totalPages: '100', pagesPerHour: '30', sessionsPerWeek: '5', sessionLength: '60', daysUntilExam: '14', difficulty: 'Hard',
    });
    expect(getValue(r, 'totalHoursNeeded')).toBe('5.00');
  });
});
