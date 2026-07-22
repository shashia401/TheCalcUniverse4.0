import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/word-count';
import { getValue, parseNumber } from '../../helpers';

describe('Word Count Calculator', () => {
  it('counts words in a simple sentence', () => {
    const r = config.calculate({ text: 'The quick brown fox jumps over the lazy dog', wordsPerMinute: '238' });
    expect(getValue(r, 'wordCount')).toBe('9');
  });

  it('counts characters with and without spaces', () => {
    const r = config.calculate({ text: 'Hi there', wordsPerMinute: '238' });
    const charCount = getValue(r, 'charCount');
    expect(charCount).toContain('8');
    expect(charCount).toContain('7');
  });

  it('counts sentences', () => {
    const r = config.calculate({ text: 'Hello world. This is a test! How are you?', wordsPerMinute: '238' });
    expect(getValue(r, 'structure')).toContain('3 sentences');
  });

  it('shows reading and speaking time estimates', () => {
    const r = config.calculate({ text: Array(240).fill('word').join(' '), wordsPerMinute: '240' });
    const timeStr = getValue(r, 'estimatedTime');
    expect(timeStr).toContain('Read');
    expect(timeStr).toContain('Speak');
  });

  it('returns empty for empty text', () => {
    const r = config.calculate({ text: '', wordsPerMinute: '238' });
    expect(r).toEqual([]);
  });

  it('returns empty for whitespace-only text', () => {
    const r = config.calculate({ text: '   ', wordsPerMinute: '238' });
    expect(r).toEqual([]);
  });

  it('shows keyword density for repeated words', () => {
    const r = config.calculate({ text: 'cats cats cats dogs birds', wordsPerMinute: '238' });
    const keywords = getValue(r, 'keywordDensity');
    expect(keywords).toContain('cats');
    expect(keywords).toContain('60.0%');
  });

  it('calculates Flesch-Kincaid grade level', () => {
    const r = config.calculate({ text: 'The cat sat. The dog ran. A bird flew away.', wordsPerMinute: '238' });
    const fkgl = getValue(r, 'readability');
    expect(parseNumber(fkgl)).toBeGreaterThan(-5);
    expect(parseNumber(fkgl)).toBeLessThan(20);
  });

  it('counts unique words', () => {
    const r = config.calculate({ text: 'hello hello world world world unique', wordsPerMinute: '238' });
    expect(getValue(r, 'uniqueWords')).toBe('3');
  });

  it('shows avg word length', () => {
    const r = config.calculate({ text: 'a bb ccc dddd', wordsPerMinute: '238' });
    expect(getValue(r, 'avgWordLength')).toBeTruthy();
  });

  it('uses custom reading speed to change estimates', () => {
    const text = Array(500).fill('word').join(' ');
    const slowRead = config.calculate({ text, wordsPerMinute: '150' });
    const fastRead = config.calculate({ text, wordsPerMinute: '500' });
    expect(getValue(slowRead, 'estimatedTime')).not.toBe(getValue(fastRead, 'estimatedTime'));
  });

  it('includes all required result IDs', () => {
    const r = config.calculate({ text: 'Hello world. This is a test.', wordsPerMinute: '238' });
    const ids = r.map((x) => x.id);
    expect(ids).toContain('wordCount');
    expect(ids).toContain('charCount');
    expect(ids).toContain('structure');
    expect(ids).toContain('uniqueWords');
    expect(ids).toContain('estimatedTime');
    expect(ids).toContain('avgWordLength');
    expect(ids).toContain('keywordDensity');
    expect(ids).toContain('readability');
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

    it('has 3-6 commonUses items', () => {
      expect(config.educational.commonUses!.length).toBeGreaterThanOrEqual(3);
      expect(config.educational.commonUses!.length).toBeLessThanOrEqual(6);
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
