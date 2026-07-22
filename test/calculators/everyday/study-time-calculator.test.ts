import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/study-time-calculator/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Study Time Calculator', () => {
  it('calculates total hours correctly for valid inputs', () => {
    // 200 pages, 30 pages/hr = 6.67 hrs, Medium difficulty (1.0x) = 6.67 hrs
    const results = config.calculate({
      totalPages: '200',
      pagesPerHour: '30',
      sessionsPerWeek: '5',
      sessionLength: '60',
      daysUntilExam: '14',
      difficulty: 'Medium',
    });

    // Total hours: 200/30 = 6.67
    near(parseNumber(getValue(results, 'totalHoursNeeded')), 6.67, 0.01);
    // Weeks: 14/7 = 2, Hours/week = 6.67/2 = 3.33
    near(parseNumber(getValue(results, 'hoursPerWeek')), 3.33, 0.01);
    // Hours/session: 3.33/5 = 0.67
    near(parseNumber(getValue(results, 'hoursPerSession')), 0.67, 0.01);
    // Recommended daily: 3.33/7 = 0.48
    near(parseNumber(getValue(results, 'recommendedDaily')), 0.48, 0.01);
    // Schedule should be feasible: 3.33 < 5.0 (5 sessions * 1hr)
    expect(getValue(results, 'scheduleFeasible')).toBe('Yes');
  });

  it('applies Easy difficulty multiplier correctly (0.8x)', () => {
    // 100 pages, 20 pages/hr = 5 hrs, Easy = 0.8x = 4 hrs
    const results = config.calculate({
      totalPages: '100',
      pagesPerHour: '20',
      sessionsPerWeek: '3',
      sessionLength: '45',
      daysUntilExam: '7',
      difficulty: 'Easy',
    });

    near(parseNumber(getValue(results, 'totalHoursNeeded')), 4.0, 0.01);
    // Weeks: 7/7 = 1, Hours/week = 4.0/1 = 4.0
    near(parseNumber(getValue(results, 'hoursPerWeek')), 4.0, 0.01);
    // Multiplier: 0.8x
    expect(getValue(results, 'difficultyMultiplier')).toBe('0.8x');
  });

  it('applies Hard difficulty multiplier correctly (1.5x)', () => {
    // 100 pages, 20 pages/hr = 5 hrs, Hard = 1.5x = 7.5 hrs
    const results = config.calculate({
      totalPages: '100',
      pagesPerHour: '20',
      sessionsPerWeek: '3',
      sessionLength: '45',
      daysUntilExam: '7',
      difficulty: 'Hard',
    });

    near(parseNumber(getValue(results, 'totalHoursNeeded')), 7.5, 0.01);
    // Multiplier: 1.5x
    expect(getValue(results, 'difficultyMultiplier')).toBe('1.5x');
  });

  it('applies Medium difficulty multiplier correctly (1.0x)', () => {
    const results = config.calculate({
      totalPages: '150',
      pagesPerHour: '25',
      sessionsPerWeek: '4',
      sessionLength: '60',
      daysUntilExam: '14',
      difficulty: 'Medium',
    });

    near(parseNumber(getValue(results, 'totalHoursNeeded')), 6.0, 0.01);
    expect(getValue(results, 'difficultyMultiplier')).toBe('1x');
  });

  it('flags schedule as not feasible when pace exceeds capacity', () => {
    // 1000 pages, 20 pages/hr = 50 hrs, Hard = 1.5x = 75 hrs
    // 7 days = 1 week, so 75 hrs/week needed
    // Capacity: 3 sessions * 1hr = 3 hrs/week
    const results = config.calculate({
      totalPages: '1000',
      pagesPerHour: '20',
      sessionsPerWeek: '3',
      sessionLength: '60',
      daysUntilExam: '7',
      difficulty: 'Hard',
    });

    expect(getValue(results, 'scheduleFeasible')).toBe('No — more time or sessions needed');
    near(parseNumber(getValue(results, 'totalHoursNeeded')), 75.0, 0.01);
    near(parseNumber(getValue(results, 'hoursPerWeek')), 75.0, 0.01);
    near(parseNumber(getValue(results, 'weeklyCapacity')), 3.0, 0.01);
  });

  it('returns empty array when totalPages is missing', () => {
    const results = config.calculate({
      totalPages: '',
      pagesPerHour: '30',
      sessionsPerWeek: '5',
      sessionLength: '60',
      daysUntilExam: '14',
      difficulty: 'Medium',
    });
    expect(results).toEqual([]);
  });

  it('returns empty array when pagesPerHour is missing', () => {
    const results = config.calculate({
      totalPages: '200',
      pagesPerHour: '',
      sessionsPerWeek: '5',
      sessionLength: '60',
      daysUntilExam: '14',
      difficulty: 'Medium',
    });
    expect(results).toEqual([]);
  });

  it('returns empty array when totalPages is zero', () => {
    const results = config.calculate({
      totalPages: '0',
      pagesPerHour: '30',
      sessionsPerWeek: '5',
      sessionLength: '60',
      daysUntilExam: '14',
      difficulty: 'Medium',
    });
    expect(results).toEqual([]);
  });

  it('handles very large page counts', () => {
    // 5000 pages, 40 pages/hr = 125 hrs, Medium = 125 hrs
    // 30 days = 4.29 weeks, so 125/4.29 = 29.17 hrs/week
    const results = config.calculate({
      totalPages: '5000',
      pagesPerHour: '40',
      sessionsPerWeek: '7',
      sessionLength: '120',
      daysUntilExam: '30',
      difficulty: 'Medium',
    });

    near(parseNumber(getValue(results, 'totalHoursNeeded')), 125.0, 0.1);
    near(parseNumber(getValue(results, 'hoursPerWeek')), 29.17, 0.1);
    near(parseNumber(getValue(results, 'weeklyCapacity')), 14.0, 0.1);
  });

  it('handles very short time until exam', () => {
    // 50 pages, 25 pages/hr = 2 hrs, Easy = 0.8x = 1.6 hrs
    // 1 day = 0.14 weeks, so 1.6/0.14 = 11.2 hrs/week
    const results = config.calculate({
      totalPages: '50',
      pagesPerHour: '25',
      sessionsPerWeek: '2',
      sessionLength: '30',
      daysUntilExam: '1',
      difficulty: 'Easy',
    });

    near(parseNumber(getValue(results, 'totalHoursNeeded')), 1.6, 0.01);
    near(parseNumber(getValue(results, 'hoursPerWeek')), 11.2, 0.01);
    near(parseNumber(getValue(results, 'weeklyCapacity')), 1.0, 0.01);
    // Not feasible
    expect(getValue(results, 'scheduleFeasible')).toBe('No — more time or sessions needed');
  });

  it('returns all required result fields', () => {
    const results = config.calculate({
      totalPages: '300',
      pagesPerHour: '30',
      sessionsPerWeek: '5',
      sessionLength: '60',
      daysUntilExam: '21',
      difficulty: 'Hard',
    });

    expect(getValue(results, 'totalHoursNeeded')).toBeTruthy();
    expect(getValue(results, 'hoursPerWeek')).toBeTruthy();
    expect(getValue(results, 'hoursPerSession')).toBeTruthy();
    expect(getValue(results, 'weeklyCapacity')).toBeTruthy();
    expect(getValue(results, 'daysUntilExam')).toBeTruthy();
    expect(getValue(results, 'recommendedDaily')).toBeTruthy();
    expect(getValue(results, 'difficultyMultiplier')).toBeTruthy();
    expect(getValue(results, 'scheduleFeasible')).toBeTruthy();
  });

  describe('educational content', () => {
    it('has formulaDescription of at least 100 characters', () => {
      expect(config.educational.formulaDescription!.length).toBeGreaterThanOrEqual(100);
    });

    it('has 3 variables', () => {
      expect(config.educational.variables).toHaveLength(3);
    });

    it('has 3 howToUse steps', () => {
      expect(config.educational.howToUse).toHaveLength(3);
    });

    it('has explanation of at least 350 characters', () => {
      expect(config.educational.explanation!.length).toBeGreaterThanOrEqual(350);
    });

    it('has at least 5 FAQs', () => {
      expect(config.educational.faqs).toHaveLength(5);
    });

    it('has at least 1 citation', () => {
      expect(config.educational.citations!.length).toBeGreaterThanOrEqual(1);
    });

    it('has a diagram with SVG, alt text, and caption', () => {
      expect(config.educational.diagram).toBeDefined();
      expect(config.educational.diagram!.svg).toBeTruthy();
      expect(config.educational.diagram!.alt).toBeTruthy();
      expect(config.educational.diagram!.caption).toBeTruthy();
    });

    it('has quickReference with 3 entries', () => {
      expect(config.educational.quickReference).toHaveLength(3);
    });

    it('has commonUses with 3 items', () => {
      expect(config.educational.commonUses).toHaveLength(3);
    });
  });
});
