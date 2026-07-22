import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/devtools/regex-tester/index';
import { getValue } from '../../helpers';

describe('Regex Tester & Debugger', () => {
  it('finds matches with global flag', () => {
    const r = config.calculate({
      pattern: '\\d+',
      flags: 'g',
      testString: 'abc 123 def 456',
    });
    expect(getValue(r, 'isMatch')).toBe('Yes');
    expect(getValue(r, 'matchCount')).toBe('2');
    expect(getValue(r, 'matches')).toContain('123');
    expect(getValue(r, 'matches')).toContain('456');
  });

  it('works with case-insensitive flag', () => {
    const r = config.calculate({
      pattern: 'hello',
      flags: 'gi',
      testString: 'Hello HELLO hello',
    });
    expect(getValue(r, 'isMatch')).toBe('Yes');
    expect(getValue(r, 'matchCount')).toBe('3');
  });

  it('returns no match when pattern does not match', () => {
    const r = config.calculate({
      pattern: 'xyz',
      flags: 'g',
      testString: 'hello world',
    });
    expect(getValue(r, 'isMatch')).toBe('No');
    expect(getValue(r, 'matchCount')).toBe('0');
    expect(getValue(r, 'matches')).toBe('(none)');
  });

  it('works with empty flags (no flags)', () => {
    const r = config.calculate({
      pattern: 'test',
      flags: '',
      testString: 'test test',
    });
    expect(getValue(r, 'isMatch')).toBe('Yes');
    expect(getValue(r, 'matchCount')).toBe('2');
  });

  it('handles multiline flag', () => {
    const r = config.calculate({
      pattern: '^\\w+',
      flags: 'gm',
      testString: 'abc\ndef\nghi',
    });
    expect(getValue(r, 'isMatch')).toBe('Yes');
    expect(getValue(r, 'matchCount')).toBe('3');
  });

  it('shows pattern used in output', () => {
    const r = config.calculate({
      pattern: '\\w+',
      flags: 'gi',
      testString: 'hello',
    });
    expect(getValue(r, 'pattern')).toBe('/\\w+/gi');
  });

  it('returns empty array for empty pattern', () => {
    const r = config.calculate({
      pattern: '',
      flags: 'g',
      testString: 'hello',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for empty test string', () => {
    const r = config.calculate({
      pattern: 'abc',
      flags: 'g',
      testString: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for invalid regex pattern', () => {
    const r = config.calculate({
      pattern: '[abc',
      flags: 'g',
      testString: 'test',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for invalid regex with quantifier', () => {
    const r = config.calculate({
      pattern: '(abc',
      flags: 'g',
      testString: 'test',
    });
    expect(r).toEqual([]);
  });

  it('handles regex with special characters', () => {
    const r = config.calculate({
      pattern: '\\.\\*\\+\\?',
      flags: 'g',
      testString: 'test .*+? more',
    });
    expect(getValue(r, 'isMatch')).toBe('Yes');
    expect(getValue(r, 'matchCount')).toBe('1');
  });

  it('handles regex with anchors', () => {
    const r = config.calculate({
      pattern: '^hello',
      flags: 'gm',
      testString: 'hello world\nhi there',
    });
    expect(getValue(r, 'isMatch')).toBe('Yes');
    expect(getValue(r, 'matchCount')).toBe('1');
  });

  it('handles regex with groups', () => {
    const r = config.calculate({
      pattern: '(\\w+)@(\\w+)',
      flags: 'g',
      testString: 'user@host',
    });
    expect(getValue(r, 'isMatch')).toBe('Yes');
    expect(getValue(r, 'matchCount')).toBe('1');
  });

  it('limits matches display to 10', () => {
    const r = config.calculate({
      pattern: 'a',
      flags: 'g',
      testString: 'a'.repeat(20),
    });
    expect(getValue(r, 'isMatch')).toBe('Yes');
    expect(getValue(r, 'matchCount')).toBe('20');
    const matches = getValue(r, 'matches');
    const count = matches.split(', ').length;
    expect(count).toBeLessThanOrEqual(10);
  });

  it('handles all flags combined', () => {
    const r = config.calculate({
      pattern: '^[a-z]+',
      flags: 'gmi',
      testString: 'HELLO\nworld',
    });
    expect(getValue(r, 'isMatch')).toBe('Yes');
    expect(getValue(r, 'matchCount')).toBe('2');
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

    it('has diagram with svg, alt, and caption', () => {
      expect(config.educational.diagram).toBeDefined();
      expect(config.educational.diagram!.svg).toBeTruthy();
      expect(config.educational.diagram!.alt).toBeTruthy();
      expect(config.educational.diagram!.caption).toBeTruthy();
    });

    it('has 1-2 citations with real URLs', () => {
      const citations = (config.educational as any).citations;
      expect(citations).toBeDefined();
      expect(citations.length).toBeGreaterThanOrEqual(1);
      expect(citations.length).toBeLessThanOrEqual(2);
      for (const c of citations) {
        expect(c.title).toBeTruthy();
        expect(c.url).toMatch(/^https?:\/\//);
      }
    });

    it('has 4-6 proTips', () => {
      const tips = config.educational.proTips;
      expect(tips).toBeDefined();
      expect(tips!.length).toBeGreaterThanOrEqual(4);
      expect(tips!.length).toBeLessThanOrEqual(6);
    });

    it('has limitations with real content', () => {
      const limit = config.educational.limitations;
      expect(limit).toBeTruthy();
      expect(limit.length).toBeGreaterThan(0);
      expect(limit.every((l: string) => l.length > 20)).toBe(true);
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
  });
});
