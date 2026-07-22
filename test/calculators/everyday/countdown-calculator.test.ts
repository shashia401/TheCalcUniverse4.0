import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/countdown-calculator/index';
import { getValue, parseNumber } from '../../helpers';

describe('Countdown Calculator', () => {
  it('returns countdown for a valid future date', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const dateStr = futureDate.toISOString().slice(0, 10);

    const results = config.calculate({
      targetDate: dateStr,
      includeTime: 'No',
      eventName: 'Test Event',
    });

    const countdown = getValue(results, 'countdown');
    expect(countdown).toContain('day');
    expect(countdown).not.toContain('ago');

    const totalDays = parseNumber(getValue(results, 'totalDays'));
    expect(totalDays).toBeGreaterThan(360);

    const totalWeeks = parseNumber(getValue(results, 'totalWeeks'));
    expect(totalWeeks).toBeGreaterThan(50);

    const totalHours = parseNumber(getValue(results, 'totalHours'));
    expect(totalHours).toBeGreaterThan(8600);

    const totalMinutes = parseNumber(getValue(results, 'totalMinutes'));
    expect(totalMinutes).toBeGreaterThan(500000);

    const totalMonths = parseNumber(getValue(results, 'totalMonths'));
    expect(totalMonths).toBeGreaterThanOrEqual(11);

    const breakdown = getValue(results, 'breakdown');
    expect(breakdown).toMatch(/\d+y \d+m \d+w \d+d/);
  });

  it('shows "ago" indicator for a past date', () => {
    const results = config.calculate({
      targetDate: '2020-01-01',
      includeTime: 'No',
    });

    const countdown = getValue(results, 'countdown');
    expect(countdown).toContain('ago');

    const totalDays = parseNumber(getValue(results, 'totalDays'));
    expect(totalDays).toBeGreaterThan(1000);

    const breakdown = getValue(results, 'breakdown');
    expect(breakdown).toMatch(/\d+y \d+m \d+w \d+d/);
  });

  it('works with time included', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const dateStr = futureDate.toISOString().slice(0, 10);

    const results = config.calculate({
      targetDate: dateStr,
      includeTime: 'Yes',
      targetTime: '14:30',
    });

    const countdown = getValue(results, 'countdown');
    expect(countdown).toContain('day');
    expect(countdown).toContain('h');
    expect(countdown).toContain('m');

    const totalDays = parseNumber(getValue(results, 'totalDays'));
    expect(totalDays).toBeGreaterThan(28);
  });

  it('works without time (defaults to midnight)', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().slice(0, 10);

    const resultsNoTime = config.calculate({
      targetDate: dateStr,
      includeTime: 'No',
    });

    const resultsWithTime = config.calculate({
      targetDate: dateStr,
      includeTime: 'Yes',
      targetTime: '00:00',
    });

    const daysNoTime = parseNumber(getValue(resultsNoTime, 'totalDays'));
    const daysWithTime = parseNumber(getValue(resultsWithTime, 'totalDays'));
    expect(Math.abs(daysNoTime - daysWithTime)).toBeLessThan(2);
  });

  it('start date override works correctly', () => {
    const results = config.calculate({
      targetDate: '2025-06-15',
      startDate: '2025-01-01',
      includeTime: 'No',
    });

    const totalDays = parseNumber(getValue(results, 'totalDays'));
    // Jan 1 to Jun 15 ≈ 165 days (may be 164-165 depending on DST boundaries)
    expect(totalDays).toBeGreaterThanOrEqual(164);
    expect(totalDays).toBeLessThanOrEqual(165);
  });

  it('returns empty array for empty target date', () => {
    const results = config.calculate({
      targetDate: '',
      includeTime: 'No',
    });
    expect(results).toEqual([]);
  });

  it('returns empty array for invalid target date string', () => {
    const results = config.calculate({
      targetDate: 'not-a-date',
      includeTime: 'No',
    });
    expect(results).toEqual([]);
  });

  it('returns empty array for invalid start date', () => {
    const results = config.calculate({
      targetDate: '2025-06-15',
      startDate: 'bad-date',
      includeTime: 'No',
    });
    expect(results).toEqual([]);
  });

  it('includes year percentage when target and current are same year', () => {
    const currentYear = new Date().getFullYear();
    const results = config.calculate({
      targetDate: currentYear + '-12-25',
      includeTime: 'No',
    });

    const yearPct = getValue(results, 'yearPercentage');
    expect(yearPct).toMatch(/\d+%/);
  });

  it('labels event name when provided', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const dateStr = futureDate.toISOString().slice(0, 10);

    const results = config.calculate({
      targetDate: dateStr,
      includeTime: 'No',
      eventName: 'My Birthday',
    });

    const countdownResult = results.find((r) => r.id === 'countdown');
    expect(countdownResult).toBeDefined();
    expect(countdownResult!.label).toContain('My Birthday');
  });

  describe('educational content', () => {
    it('formulaDescription is at least 100 characters', () => {
      expect(config.educational.formulaDescription!.length).toBeGreaterThanOrEqual(100);
    });

    it('explanation is at least 300 characters', () => {
      expect(config.educational.explanation!.length).toBeGreaterThanOrEqual(300);
    });

    it('has exactly 3 variables', () => {
      expect(config.educational.variables).toHaveLength(3);
    });

    it('has exactly 4 howToUse steps', () => {
      expect(config.educational.howToUse).toHaveLength(4);
    });

    it('has at least 5 FAQs', () => {
      expect(config.educational.faqs).toBeDefined();
      expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
    });

    it('has a citation', () => {
      expect(config.educational.citations).toBeDefined();
      expect(config.educational.citations!.length).toBeGreaterThanOrEqual(1);
    });

    it('has commonUses with at least 3 items', () => {
      expect(config.educational.commonUses).toBeDefined();
      expect(config.educational.commonUses!.length).toBeGreaterThanOrEqual(3);
    });

    it('has quickReference with entries', () => {
      expect(config.educational.quickReference).toBeDefined();
      expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(1);
    });

    it('has an SVG diagram with viewBox 440 260', () => {
      expect(config.educational.diagram).toBeDefined();
      expect(config.educational.diagram!.svg).toContain('viewBox="0 0 440 260"');
    });

    it('has at least 3 workedExamples with scenario, inputs, and insight', () => {
      expect(config.educational.workedExamples).toBeDefined();
      expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(3);
      for (const ex of config.educational.workedExamples!) {
        expect(ex.scenario).toBeTruthy();
        expect(ex.inputs).toBeDefined();
        expect(ex.insight).toBeTruthy();
        expect(ex.insight.length).toBeGreaterThanOrEqual(100);
      }
    });

    it('has at least 4 proTips', () => {
      expect(config.educational.proTips).toBeDefined();
      expect(config.educational.proTips!.length).toBeGreaterThanOrEqual(4);
      for (const tip of config.educational.proTips!) {
        expect(tip.length).toBeGreaterThanOrEqual(30);
      }
    });

    it('has limitations with real content', () => {
      expect(config.educational.limitations).toBeDefined();
      expect(config.educational.limitations.length).toBeGreaterThan(0);
      expect(config.educational.limitations.every((l: string) => l.length > 20)).toBe(true);
    });

    it('input fields have inputMode set where appropriate', () => {
      const textInputs = config.inputs.filter((i) => i.type === 'text');
      const numberInputs = config.inputs.filter((i) => i.type === 'number');
      // At least one text input should have inputMode defined
      const textWithMode = textInputs.filter((i) => i.inputMode);
      expect(textWithMode.length).toBeGreaterThanOrEqual(1);
    });
  });
});
