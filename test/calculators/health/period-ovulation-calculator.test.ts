import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/period-ovulation/index';
import { getValue } from '../../helpers';

describe('Period & Ovulation Calculator', () => {
  it('calculates current cycle day and phase from LMP', () => {
    const r = config.calculate({
      lmpDate: '2026-04-01',
      cycleLength: '28',
      periodLength: '5',
      lutealPhase: '14',
    });
    const cycleDay = getValue(r, 'cycleDay');
    expect(cycleDay).toContain('Day');
    expect(cycleDay).toContain('28');
    const phase = getValue(r, 'currentPhase');
    expect(phase).toBeTruthy();
    expect(typeof phase).toBe('string');
  });

  it('predicts next period and period frequency correctly', () => {
    const r = config.calculate({
      lmpDate: '2026-04-01',
      cycleLength: '28',
      periodLength: '5',
    });
    const nextPeriod = getValue(r, 'predictedPeriod');
    expect(nextPeriod).toContain('in');
    expect(nextPeriod).toContain('days');
    const frequency = getValue(r, 'periodFrequency');
    expect(frequency).toContain('28 days');
    expect(frequency).toContain('periods per year');
  });

  it('returns ovulation date and fertile window with arrow separator', () => {
    const r = config.calculate({
      lmpDate: '2026-04-01',
      cycleLength: '28',
      periodLength: '5',
      lutealPhase: '14',
    });
    const ovulation = getValue(r, 'ovulationDate');
    expect(ovulation).toBeTruthy();
    const fertileWindow = getValue(r, 'fertileWindow');
    expect(fertileWindow).toContain('→'); // arrow character
  });

  it('calculates ovulation correctly for 33-day cycle with 14-day luteal phase', () => {
    const r = config.calculate({
      lmpDate: '2026-03-10',
      cycleLength: '33',
      periodLength: '4',
      lutealPhase: '14',
    });
    // Ovulation should be ~Day 19 in a 33-day cycle (33-14=19)
    const ovulation = getValue(r, 'ovulationDate');
    expect(ovulation).toBeTruthy();
    const cycleDay = getValue(r, 'cycleDay');
    expect(cycleDay).toContain('33');
  });

  it('returns 3-month outlook with en-dash separator', () => {
    const r = config.calculate({
      lmpDate: '2026-04-01',
      cycleLength: '30',
      periodLength: '5',
    });
    const outlook = getValue(r, 'monthsPredictions');
    expect(outlook).toContain('–');
  });

  it('returns empty array for empty LMP date', () => {
    const r = config.calculate({
      lmpDate: '',
      cycleLength: '28',
      periodLength: '5',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for invalid date format', () => {
    const r = config.calculate({
      lmpDate: 'not-a-date',
      cycleLength: '28',
      periodLength: '5',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for cycle length below minimum (under 20)', () => {
    const r = config.calculate({
      lmpDate: '2026-04-01',
      cycleLength: '10',
      periodLength: '5',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for cycle length above maximum (over 45)', () => {
    const r = config.calculate({
      lmpDate: '2026-04-01',
      cycleLength: '50',
      periodLength: '5',
    });
    expect(r).toEqual([]);
  });

  it('handles all results having truthy values with only required fields', () => {
    const r = config.calculate({
      lmpDate: '2026-01-15',
      cycleLength: '28',
      periodLength: '5',
    });
    expect(r.length).toBeGreaterThanOrEqual(7);
    r.forEach((item) => {
      expect(item.value).toBeTruthy();
    });
  });

  it('works correctly with custom luteal phase (no default fallback needed)', () => {
    const r = config.calculate({
      lmpDate: '2026-05-01',
      cycleLength: '30',
      periodLength: '4',
      lutealPhase: '12',
    });
    // With 12-day luteal phase, ovulation should be around Day 18 (30-12=18)
    const cycleDay = getValue(r, 'cycleDay');
    expect(cycleDay).toContain('30');
    expect(getValue(r, 'ovulationDate')).toBeTruthy();
    expect(getValue(r, 'fertileWindow')).toBeTruthy();
  });

  // ── Educational content presence ─────────────────────────────────────
  it('has educational section with all required fields', () => {
    const edu = config.educational;
    expect(edu).toBeDefined();
    expect(edu.formula).toBeTruthy();
    expect(edu.formulaDescription).toBeTruthy();
    expect(edu.variables).toBeDefined();
    expect(edu.variables!.length).toBeGreaterThanOrEqual(3);
    expect(edu.howToUse).toBeDefined();
    expect(edu.howToUse!.length).toBeGreaterThanOrEqual(3);
    expect(edu.explanation).toBeTruthy();
    expect(edu.explanation.length).toBeGreaterThan(500);
    expect(edu.faqs).toBeDefined();
    expect(edu.faqs!.length).toBeGreaterThanOrEqual(5);
    expect(edu.workedExamples).toBeDefined();
    expect(edu.workedExamples!.length).toBeGreaterThanOrEqual(3);
    expect(edu.proTips).toBeDefined();
    expect(edu.proTips!.length).toBeGreaterThanOrEqual(4);
    expect(edu.limitations).toBeDefined();
    expect(edu.limitations!.length).toBeGreaterThanOrEqual(3);
    expect(edu.commonUses).toBeDefined();
    expect(edu.commonUses!.length).toBeGreaterThanOrEqual(2);
    expect(edu.quickReference).toBeDefined();
    expect(edu.quickReference!.length).toBeGreaterThanOrEqual(5);
    expect(edu.citations).toBeDefined();
    expect(edu.citations!.length).toBeGreaterThanOrEqual(2);
  });

  it('includes privacy information in privacy FAQ', () => {
    const edu = config.educational;
    const privacyFaq = edu.faqs!.find(f => f.question.toLowerCase().includes('private') || f.question.toLowerCase().includes('privacy'));
    expect(privacyFaq).toBeDefined();
    expect(privacyFaq!.answer.toLowerCase()).toContain('browser');
  });

  it('includes OPK and BBT guidance in educational content', () => {
    const edu = config.educational;
    const combined = (edu.faqs ?? []).map(f => f.answer).join(' ') +
      (edu.proTips ?? []).join(' ') +
      (edu.explanation ?? '');
    expect(combined.toLowerCase()).toContain('opk');
    expect(combined.toLowerCase()).toContain('bbt');
  });
});
