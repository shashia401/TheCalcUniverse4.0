import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/numerology';
import { getValue } from '../../helpers';

describe('numerology', () => {
  it('calculates Life Path 3 for July 4, 1990', () => {
    const r = config.calculate({
      birthMonth: '7',
      birthDay: '4',
      birthYear: '1990',
    });
    // Month 7 → 7, Day 4 → 4, Year 1990 → 1+9+9+0 = 19 → 10 → 1
    // Sum: 7+4+1 = 12 → 1+2 = 3
    expect(getValue(r, 'lifePathNumber')).toContain('3');
    expect(getValue(r, 'lifePathTitle')).toBe('The Creative Communicator');
  });

  it('calculates Life Path 3 for December 25, 2000', () => {
    const r = config.calculate({
      birthMonth: '12',
      birthDay: '25',
      birthYear: '2000',
    });
    // Month 12 → 3, Day 25 → 7, Year 2000 → 2
    // Sum: 3+7+2 = 12 → 1+2 = 3
    expect(getValue(r, 'lifePathNumber')).toContain('3');
    expect(getValue(r, 'lifePathTitle')).toBe('The Creative Communicator');
  });

  it('returns empty when required fields are missing', () => {
    const r = config.calculate({
      birthMonth: '',
      birthDay: '',
      birthYear: '',
    });
    expect(r).toEqual([]);
  });

  it('detects master number 11', () => {
    // Month 10 → 1, Day 10 → 1, Year 2007 → 2+0+0+7 = 9
    // Sum: 1+1+9 = 11 → Master Number 11
    const r = config.calculate({
      birthMonth: '10',
      birthDay: '10',
      birthYear: '2007',
    });
    expect(getValue(r, 'lifePathNumber')).toContain('11');
    expect(getValue(r, 'lifePathNumber')).toContain('Master Number');
  });

  it('detects master number 22', () => {
    // Month 11 (November) → 11 (master), Day 2 → 2, Year 1998 → 27 → 9
    // Sum: 11+2+9 = 22 → Master Number 22
    const r = config.calculate({
      birthMonth: '11',
      birthDay: '2',
      birthYear: '1998',
    });
    expect(getValue(r, 'lifePathNumber')).toContain('22');
    expect(getValue(r, 'lifePathNumber')).toContain('Master Number');
  });

  it('detects master number 33', () => {
    // Month 11 (November) → 11, Day 29 → 2+9 = 11, Year 2009 → 2+0+0+9 = 11
    // Sum: 11+11+11 = 33 → Master Number 33
    const r = config.calculate({
      birthMonth: '11',
      birthDay: '29',
      birthYear: '2009',
    });
    expect(getValue(r, 'lifePathNumber')).toContain('33');
    expect(getValue(r, 'lifePathNumber')).toContain('Master Number');
  });

  it('shows calculation steps for reduction', () => {
    const r = config.calculate({
      birthMonth: '7',
      birthDay: '4',
      birthYear: '1990',
    });
    expect(getValue(r, 'monthReduction')).toBeTruthy();
    expect(getValue(r, 'dayReduction')).toBeTruthy();
    expect(getValue(r, 'yearReduction')).toBeTruthy();
    expect(getValue(r, 'totalSum')).toBeTruthy();
  });

  it('shows zodiac sign for July 4', () => {
    const r = config.calculate({
      birthMonth: '7',
      birthDay: '4',
      birthYear: '1990',
    });
    expect(getValue(r, 'zodiacSign')).toContain('Cancer');
    expect(getValue(r, 'zodiacSign')).toContain('Crab');
  });

  it('shows strengths and weaknesses', () => {
    const r = config.calculate({
      birthMonth: '3',
      birthDay: '15',
      birthYear: '1985',
    });
    expect(getValue(r, 'strengths')).toBeTruthy();
    expect(getValue(r, 'weaknesses')).toBeTruthy();
  });

  it('returns empty for missing birth year', () => {
    const r = config.calculate({
      birthMonth: '1',
      birthDay: '1',
      birthYear: '',
    });
    expect(r).toEqual([]);
  });

  it('provides unique personality description for each life path number', () => {
    const r1 = config.calculate({ birthMonth: '1', birthDay: '1', birthYear: '1997' });
    expect(getValue(r1, 'lifePathTitle')).toBe('The Leader');

    const r4 = config.calculate({ birthMonth: '10', birthDay: '20', birthYear: '1999' });
    expect(getValue(r4, 'lifePathTitle')).toBe('The Builder');

    const r7 = config.calculate({ birthMonth: '7', birthDay: '7', birthYear: '2000' });
    expect(getValue(r7, 'lifePathTitle')).toBe('The Seeker');

    const r9 = config.calculate({ birthMonth: '9', birthDay: '9', birthYear: '2007' });
    expect(getValue(r9, 'lifePathTitle')).toBe('The Humanitarian');
  });

  describe('educational content', () => {
    it('has formula', () => {
      expect(config.educational.formula).toBeTruthy();
    });

    it('has formulaDescription over 100 chars', () => {
      expect(config.educational.formulaDescription!.length).toBeGreaterThan(100);
    });

    it('has 3-5 variables', () => {
      expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
      expect(config.educational.variables!.length).toBeLessThanOrEqual(5);
    });

    it('has 3-5 howToUse steps', () => {
      expect(config.educational.howToUse!.length).toBeGreaterThanOrEqual(3);
      expect(config.educational.howToUse!.length).toBeLessThanOrEqual(5);
    });

    it('has 3-6 quickReference items', () => {
      expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(3);
      expect(config.educational.quickReference!.length).toBeLessThanOrEqual(6);
    });

    it('has 3-5 commonUses items', () => {
      expect(config.educational.commonUses!.length).toBeGreaterThanOrEqual(3);
      expect(config.educational.commonUses!.length).toBeLessThanOrEqual(5);
    });

    it('has explanation over 300 chars', () => {
      expect(config.educational.explanation!.length).toBeGreaterThan(300);
    });

    it('has 5-7 FAQs', () => {
      expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
      expect(config.educational.faqs!.length).toBeLessThanOrEqual(7);
    });

    it('has 4-6 proTips', () => {
      expect(config.educational.proTips!.length).toBeGreaterThanOrEqual(4);
      expect(config.educational.proTips!.length).toBeLessThanOrEqual(6);
    });

    it('has limitations with real content', () => {
      expect(config.educational.limitations).toBeTruthy();
      expect(config.educational.limitations.length).toBeGreaterThan(0);
      expect(config.educational.limitations.every((l: string) => l.length > 20)).toBe(true);
    });

    it('has 2 worked examples with scenario, inputs, and insight', () => {
      const examples = config.educational.workedExamples;
      expect(examples).toBeDefined();
      expect(examples!.length).toBeGreaterThanOrEqual(2);
      for (const ex of examples!) {
        expect(ex.scenario).toBeTruthy();
        expect(ex.inputs).toBeTruthy();
        expect(ex.insight).toBeTruthy();
        expect(ex.insight!.length).toBeGreaterThan(100);
      }
    });

    it('has diagram with svg, alt, and caption', () => {
      expect(config.educational.diagram).toBeDefined();
      expect(config.educational.diagram!.svg).toContain('<svg');
      expect(config.educational.diagram!.alt).toBeTruthy();
      expect(config.educational.diagram!.caption).toBeTruthy();
    });

    it('has 1-2 citations with real URLs', () => {
      const citations = config.educational.citations;
      expect(citations).toBeDefined();
      expect(citations!.length).toBeGreaterThanOrEqual(1);
      expect(citations!.length).toBeLessThanOrEqual(2);
      for (const c of citations!) {
        expect(c.url).toMatch(/^https?:\/\//);
      }
    });
  });
});
