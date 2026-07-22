import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/reading-time-calculator/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Reading Time Calculator', () => {
  it('calculates correct reading time for 1000 words at average speed', () => {
    const results = config.calculate({
      wordCount: '1000',
      readingSpeed: '200',
      includePauses: 'none',
      contentType: 'general',
    });

    expect(getValue(results, 'readingTime')).toBe('5 minutes');
    expect(getValue(results, 'totalWords')).toBe('1,000');
    expect(getValue(results, 'readingSpeed')).toBe('200 wpm');
    expect(getValue(results, 'estimatedPages')).toBe('4');
  });

  it('returns different times for different reading speeds', () => {
    const slowResults = config.calculate({
      wordCount: '6000',
      readingSpeed: '150',
      includePauses: 'none',
      contentType: 'general',
    });

    const fastResults = config.calculate({
      wordCount: '6000',
      readingSpeed: '400',
      includePauses: 'none',
      contentType: 'general',
    });

    // Slow: 6000/150 = 40 min
    expect(getValue(slowResults, 'readingTime')).toBe('40 minutes');
    // Fast: 6000/400 = 15 min
    expect(getValue(fastResults, 'readingTime')).toBe('15 minutes');
  });

  it('applies content type multiplier correctly', () => {
    const technicalResults = config.calculate({
      wordCount: '1000',
      readingSpeed: '200',
      includePauses: 'none',
      contentType: 'technical',
    });

    const academicResults = config.calculate({
      wordCount: '1000',
      readingSpeed: '200',
      includePauses: 'none',
      contentType: 'academic',
    });

    // Technical: 5 * 1.3 = 6.5 min -> 7 minutes
    expect(getValue(technicalResults, 'readingTime')).toBe('7 minutes');
    expect(getValue(technicalResults, 'contentAdjustment')).toBe('Technical (x1.3)');

    // Academic: 5 * 1.5 = 7.5 min -> 8 minutes
    expect(getValue(academicResults, 'readingTime')).toBe('8 minutes');
    expect(getValue(academicResults, 'contentAdjustment')).toBe('Academic (x1.5)');
  });

  it('adds short breaks for long reading sessions', () => {
    // 12000 words at 200 wpm = 60 min
    const results = config.calculate({
      wordCount: '12000',
      readingSpeed: '200',
      includePauses: 'short',
      contentType: 'general',
    });

    // 60/30 = 2 breaks x 5 min = 10 min -> total 70 min = 1 hour 10 minutes
    expect(getValue(results, 'readingTime')).toBe('1 hour 10 minutes');
    expect(getValue(results, 'breakDetails')).toContain('2 x 5-min breaks');
  });

  it('adds full breaks for long reading sessions', () => {
    // 12000 words at 200 wpm = 60 min
    const results = config.calculate({
      wordCount: '12000',
      readingSpeed: '200',
      includePauses: 'full',
      contentType: 'general',
    });

    // 60/60 = 1 break x 15 min = 15 min -> total 75 min = 1 hour 15 minutes
    expect(getValue(results, 'readingTime')).toBe('1 hour 15 minutes');
    expect(getValue(results, 'breakDetails')).toContain('1 x 15-min break');
  });

  it('does not add breaks for sessions under 30 minutes', () => {
    const results = config.calculate({
      wordCount: '1000',
      readingSpeed: '200',
      includePauses: 'short',
      contentType: 'general',
    });

    // 1000/200 = 5 min, under 30, so no breaks
    expect(getValue(results, 'readingTime')).toBe('5 minutes');
    // breakDetails should not exist
    expect(results.find((r) => r.id === 'breakDetails')).toBeUndefined();
  });

  it('returns empty array for invalid inputs', () => {
    const emptyResults = config.calculate({
      wordCount: '',
      readingSpeed: '200',
      includePauses: 'none',
      contentType: 'general',
    });
    expect(emptyResults).toEqual([]);

    const zeroResults = config.calculate({
      wordCount: '0',
      readingSpeed: '200',
      includePauses: 'none',
      contentType: 'general',
    });
    expect(zeroResults).toEqual([]);

    const negativeResults = config.calculate({
      wordCount: '-5',
      readingSpeed: '200',
      includePauses: 'none',
      contentType: 'general',
    });
    expect(negativeResults).toEqual([]);

    const nanResults = config.calculate({
      wordCount: 'abc',
      readingSpeed: '200',
      includePauses: 'none',
      contentType: 'general',
    });
    expect(nanResults).toEqual([]);
  });

  it('handles edge case of 1 word', () => {
    const results = config.calculate({
      wordCount: '1',
      readingSpeed: '200',
      includePauses: 'none',
      contentType: 'general',
    });

    expect(getValue(results, 'readingTime')).toBe('Less than a minute');
    expect(getValue(results, 'totalWords')).toBe('1');
    expect(getValue(results, 'estimatedPages')).toBe('1');
  });

  it('handles edge case of 100000 words', () => {
    const results = config.calculate({
      wordCount: '100000',
      readingSpeed: '200',
      includePauses: 'full',
      contentType: 'general',
    });

    // 100000/200 = 500 min = 8 hours 20 minutes
    // Breaks: 500/60 = 8 full breaks x 15 = 120 min
    // Total: 500 + 120 = 620 min = 10 hours 20 minutes
    expect(getValue(results, 'readingTime')).toBe('10 hours 20 minutes');
    expect(getValue(results, 'totalWords')).toBe('100,000');
    expect(getValue(results, 'estimatedPages')).toBe('400');
    expect(getValue(results, 'breakDetails')).toContain('8 x 15-min breaks');
  });

  it('includes estimated pages based on 250 words per page', () => {
    const results = config.calculate({
      wordCount: '750',
      readingSpeed: '200',
      includePauses: 'none',
      contentType: 'general',
    });

    // 750/250 = 3 pages
    expect(getValue(results, 'estimatedPages')).toBe('3');
  });

  it('rounds up estimated pages for partial pages', () => {
    const results = config.calculate({
      wordCount: '751',
      readingSpeed: '200',
      includePauses: 'none',
      contentType: 'general',
    });

    // 751/250 = 3.004 -> ceil = 4 pages
    expect(getValue(results, 'estimatedPages')).toBe('4');
  });

  describe('educational content', () => {
    it('has formulaDescription of at least 100 characters', () => {
      expect(config.educational.formulaDescription!.length).toBeGreaterThanOrEqual(100);
    });

    it('has explanation of at least 300 characters', () => {
      expect(config.educational.explanation!.length).toBeGreaterThanOrEqual(300);
    });

    it('has exactly 4 variables', () => {
      expect(config.educational.variables).toHaveLength(4);
    });

    it('has exactly 3 howToUse steps', () => {
      expect(config.educational.howToUse).toHaveLength(3);
    });

    it('has exactly 3 FAQs', () => {
      expect(config.educational.faqs).toHaveLength(3);
    });

    it('has at least 2 citations', () => {
      expect(config.educational.citations!.length).toBeGreaterThanOrEqual(2);
    });

    it('has a diagram with viewBox attribute', () => {
      expect(config.educational.diagram).toBeDefined();
      expect(config.educational.diagram!.svg).toContain('viewBox');
    });

    it('has quickReference entries', () => {
      expect(config.educational.quickReference).toBeDefined();
      expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(1);
    });

    it('has commonUses entries', () => {
      expect(config.educational.commonUses).toBeDefined();
      expect(config.educational.commonUses!.length).toBe(3);
    });
  });
});
