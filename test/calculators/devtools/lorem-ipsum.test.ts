import { describe, it, expect } from 'vitest';
import loremIpsumConfig from '../../../src/calculators/devtools/lorem-ipsum/index';
import { getValue, parseNumber } from '../../helpers';

describe('Lorem Ipsum Generator', () => {
  it('generates paragraphs by default', () => {
    const results = loremIpsumConfig.calculate({ count: '2', unit: 'Paragraphs' });
    const text = getValue(results, 'generatedText');
    expect(text).toContain('Lorem ipsum');
    expect(text).toContain('\n\n'); // paragraph break
    const words = text.split(/\s+/).filter(Boolean);
    expect(words.length).toBeGreaterThan(20);
  });

  it('generates specified number of sentences', () => {
    const results = loremIpsumConfig.calculate({ count: '3', unit: 'Sentences' });
    const text = getValue(results, 'generatedText');
    expect(text).toContain('Lorem ipsum');
    // Should have sentences ending with period
    const sentences = text.split('.').filter((s) => s.trim().length > 0);
    expect(sentences.length).toBe(3);
  });

  it('generates specified number of words', () => {
    const results = loremIpsumConfig.calculate({ count: '10', unit: 'Words' });
    const text = getValue(results, 'generatedText');
    const words = text.split(/\s+/).filter(Boolean);
    expect(words.length).toBe(10);
  });

  it('reports accurate word and character counts', () => {
    const results = loremIpsumConfig.calculate({ count: '5', unit: 'Words' });
    const text = getValue(results, 'generatedText');
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = parseInt(getValue(results, 'wordCount').replace(/,/g, ''), 10);
    const charCount = parseInt(getValue(results, 'charCount').replace(/,/g, ''), 10);
    expect(wordCount).toBe(words.length);
    expect(charCount).toBe(text.length);
  });

  it('returns empty for empty count', () => {
    const results = loremIpsumConfig.calculate({ count: '', unit: 'Paragraphs' });
    expect(results).toEqual([]);
  });

  it('returns empty for invalid count (NaN)', () => {
    const results = loremIpsumConfig.calculate({ count: 'abc', unit: 'Paragraphs' });
    expect(results).toEqual([]);
  });

  it('returns empty for count below minimum', () => {
    const results = loremIpsumConfig.calculate({ count: '0', unit: 'Paragraphs' });
    expect(results).toEqual([]);
  });

  it('returns empty for count above maximum', () => {
    const results = loremIpsumConfig.calculate({ count: '51', unit: 'Paragraphs' });
    expect(results).toEqual([]);
  });

  it('handles single word generation', () => {
    const results = loremIpsumConfig.calculate({ count: '1', unit: 'Words' });
    const text = getValue(results, 'generatedText');
    expect(text).toBe('lorem');
    const wordCount = parseNumber(getValue(results, 'wordCount'));
    expect(wordCount).toBe(1);
  });

  it('has educational content with formula and explanation', () => {
    const edu = loremIpsumConfig.educational;
    expect(edu.formula).toBeTruthy();
    expect(edu.formulaDescription).toBeTruthy();
    expect(edu.formulaDescription!.length).toBeGreaterThan(100);
    expect(edu.explanation).toBeTruthy();
    expect(edu.explanation!.length).toBeGreaterThan(300);
  });

  it('has educational variables', () => {
    const vars = loremIpsumConfig.educational.variables;
    expect(vars).toBeTruthy();
    expect(vars!.length).toBeGreaterThanOrEqual(3);
    expect(vars!.length).toBeLessThanOrEqual(5);
  });

  it('has howToUse steps', () => {
    const howTo = loremIpsumConfig.educational.howToUse;
    expect(howTo).toBeTruthy();
    expect(howTo!.length).toBeGreaterThanOrEqual(3);
    expect(howTo!.length).toBeLessThanOrEqual(5);
  });

  it('has FAQs', () => {
    const faqs = loremIpsumConfig.educational.faqs;
    expect(faqs).toBeTruthy();
    expect(faqs!.length).toBeGreaterThanOrEqual(2);
    expect(faqs!.length).toBeLessThanOrEqual(5);
    faqs!.forEach((faq) => {
      expect(faq.question).toBeTruthy();
      expect(faq.answer).toBeTruthy();
    });
  });

  it('has citations', () => {
    const citations = loremIpsumConfig.educational.citations;
    expect(citations).toBeTruthy();
    expect(citations!.length).toBeGreaterThanOrEqual(1);
    citations!.forEach((c) => {
      expect(c.source).toBeTruthy();
      expect(c.url).toMatch(/^https?:\/\//);
    });
  });

  it('has a diagram with SVG', () => {
    const diagram = loremIpsumConfig.educational.diagram;
    expect(diagram).toBeTruthy();
    expect(diagram!.svg).toContain('<svg');
    expect(diagram!.alt).toBeTruthy();
  });

  it('has quickReference items', () => {
    const qr = loremIpsumConfig.educational.quickReference;
    expect(qr).toBeTruthy();
    expect(qr!.length).toBeGreaterThanOrEqual(2);
    expect(qr!.length).toBeLessThanOrEqual(4);
    qr!.forEach((item) => {
      expect(item.label).toBeTruthy();
      expect(item.value).toBeTruthy();
    });
  });

  it('has commonUses items', () => {
    const cu = loremIpsumConfig.educational.commonUses;
    expect(cu).toBeTruthy();
    expect(cu!.length).toBeGreaterThanOrEqual(3);
    expect(cu!.length).toBeLessThanOrEqual(5);
  });

  it('includes all result IDs', () => {
    const results = loremIpsumConfig.calculate({ count: '2', unit: 'Paragraphs' });
    const ids = results.map((r) => r.id);
    expect(ids).toContain('generatedText');
    expect(ids).toContain('wordCount');
    expect(ids).toContain('charCount');
  });
});
