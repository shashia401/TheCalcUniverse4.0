import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/schengen-visa/index';
import { getValue } from '../../helpers';

describe('Schengen Visa 90/180 Calculator', () => {
  it('calculates a single 10-day trip correctly', () => {
    const r = config.calculate({
      checkDate: '2026-03-15',
      trip1Start: '2026-03-01',
      trip1End: '2026-03-10',
    });
    const total = getValue(r, 'totalDaysUsed');
    expect(total).toBe('10 days');
  });

  it('shows remaining days after a trip', () => {
    const r = config.calculate({
      checkDate: '2026-03-15',
      trip1Start: '2026-03-01',
      trip1End: '2026-03-10',
    });
    const remaining = getValue(r, 'daysRemaining');
    expect(remaining).toContain('80');
  });

  it('correctly sums multiple trips under 90 days', () => {
    const r = config.calculate({
      checkDate: '2026-03-20',
      trip1Start: '2026-01-01',
      trip1End: '2026-01-30',
      trip2Start: '2026-03-01',
      trip2End: '2026-03-15',
    });
    const total = getValue(r, 'totalDaysUsed');
    // Trip 1: 30 days, Trip 2: 15 days = 45 total
    expect(total).toBe('45 days');
  });

  it('detects overstay when total exceeds 90 days', () => {
    const r = config.calculate({
      checkDate: '2026-04-05',
      trip1Start: '2026-01-01',
      trip1End: '2026-04-01', // 91 days
    });
    const overstay = getValue(r, 'daysRemaining');
    expect(overstay).toContain('over');
  });

  it('returns empty array when no trips are provided', () => {
    const r = config.calculate({});
    expect(r).toEqual([]);
  });

  it('returns empty array when all trip fields are empty', () => {
    const r = config.calculate({
      checkDate: '2026-06-01',
      trip1Start: '',
      trip1End: '',
      trip2Start: '',
      trip2End: '',
    });
    expect(r).toEqual([]);
  });

  it('returns rolling window info', () => {
    const r = config.calculate({
      checkDate: '2026-03-15',
      trip1Start: '2026-03-01',
      trip1End: '2026-03-10',
    });
    const windowInfo = getValue(r, 'checkWindow');
    expect(windowInfo).toContain('180 days');
  });

  it('returns trip breakdown details', () => {
    const r = config.calculate({
      checkDate: '2026-03-20',
      trip1Start: '2026-03-01',
      trip1End: '2026-03-10',
      trip2Start: '2026-03-12',
      trip2End: '2026-03-15',
    });
    const trip1Detail = getValue(r, 'trip1Detail');
    const trip2Detail = getValue(r, 'trip2Detail');
    expect(trip1Detail).toContain('days');
    expect(trip2Detail).toContain('days');
  });

  it('returns rule reminder', () => {
    const r = config.calculate({
      checkDate: '2026-03-15',
      trip1Start: '2026-03-01',
      trip1End: '2026-03-10',
    });
    const reminder = getValue(r, 'ruleReminder');
    expect(reminder).toContain('days remaining');
  });

  it('defaults checkDate to today when not provided', () => {
    const r = config.calculate({
      trip1Start: '2026-05-01',
      trip1End: '2026-05-10',
    });
    expect(r.length).toBeGreaterThan(0);
    const total = getValue(r, 'totalDaysUsed');
    expect(total).toContain('days');
  });

  it('ignores invalid date strings gracefully', () => {
    const r = config.calculate({
      checkDate: '2026-06-15',
      trip1Start: 'not-a-date',
      trip1End: '2026-06-20',
    });
    expect(r).toEqual([]);
  });

  it('ignores trips where end date is before start date', () => {
    const r = config.calculate({
      checkDate: '2026-06-15',
      trip1Start: '2026-06-20',
      trip1End: '2026-06-10',
      trip2Start: '2026-06-01',
      trip2End: '2026-06-05',
    });
    // Only trip2 should be counted (5 days)
    const total = getValue(r, 'totalDaysUsed');
    expect(total).toBe('5 days');
  });

  it('ignores trips with dates outside reasonable year range', () => {
    const r = config.calculate({
      checkDate: '2026-06-15',
      trip1Start: '1800-01-01',
      trip1End: '1800-01-10',
    });
    expect(r).toEqual([]);
  });

  it('shows reset info when overstay is detected', () => {
    const r = config.calculate({
      checkDate: '2026-04-05',
      trip1Start: '2026-01-01',
      trip1End: '2026-04-01', // 91 days — overstay
    });
    const resetInfo = getValue(r, 'resetInfo');
    expect(resetInfo).toContain('days until');
  });

  it('handles trips partially inside the 180-day window', () => {
    // Trip starts before the 180-day window but ends inside it
    const r = config.calculate({
      checkDate: '2026-06-01',
      trip1Start: '2025-11-01',
      trip1End: '2026-01-15',
    });
    // 180-day window starts around Dec 3, 2025, so only days Dec 3 - Jan 15 count
    const total = getValue(r, 'totalDaysUsed');
    const daysNum = parseInt(total);
    expect(daysNum).toBeGreaterThan(0);
    expect(daysNum).toBeLessThan(90);
  });

  it('rejects unreasonably long trips over 365 days', () => {
    const r = config.calculate({
      checkDate: '2026-06-15',
      trip1Start: '2025-01-01',
      trip1End: '2026-06-15', // 531 days — likely data entry error
      trip2Start: '2026-06-01',
      trip2End: '2026-06-05',
    });
    // Trip 1 should be ignored; only Trip 2 (5 days) counted
    const total = getValue(r, 'totalDaysUsed');
    expect(total).toBe('5 days');
  });

  describe('educational content', () => {
    it('formulaDescription is at least 100 characters', () => {
      expect(config.educational.formulaDescription!.length).toBeGreaterThanOrEqual(100);
    });

    it('explanation is at least 300 characters', () => {
      expect(config.educational.explanation!.length).toBeGreaterThanOrEqual(300);
    });

    it('has at least 3 variables', () => {
      expect(config.educational.variables).toBeDefined();
      expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
    });

    it('has at least 4 howToUse steps', () => {
      expect(config.educational.howToUse).toBeDefined();
      expect(config.educational.howToUse!.length).toBeGreaterThanOrEqual(4);
    });

    it('has at least 5 FAQs', () => {
      expect(config.educational.faqs).toBeDefined();
      expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
    });

    it('has citations', () => {
      expect(config.educational.citations).toBeDefined();
      expect(config.educational.citations!.length).toBeGreaterThanOrEqual(1);
    });

    it('has commonUses with at least 3 items', () => {
      expect(config.educational.commonUses).toBeDefined();
      expect(config.educational.commonUses!.length).toBeGreaterThanOrEqual(3);
    });

    it('has quickReference with at least 3 entries', () => {
      expect(config.educational.quickReference).toBeDefined();
      expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(3);
    });

    it('has at least 2 workedExamples with scenario, inputs, and insight', () => {
      expect(config.educational.workedExamples).toBeDefined();
      expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(2);
      for (const ex of config.educational.workedExamples!) {
        expect(ex.scenario).toBeTruthy();
        expect(ex.inputs).toBeDefined();
        expect(ex.insight).toBeTruthy();
        expect(ex.insight.length).toBeGreaterThanOrEqual(100);
      }
    });

    it('has at least 4 proTips each at least 30 chars', () => {
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

    it('has an SVG diagram', () => {
      expect(config.educational.diagram).toBeDefined();
      expect(config.educational.diagram!.svg).toBeTruthy();
    });
  });
});
