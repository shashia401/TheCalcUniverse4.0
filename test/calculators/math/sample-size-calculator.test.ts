import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/sample-size/index';
import { getValue, parseNumber } from '../../helpers';

describe('Sample size calculator — calculation', () => {
  it('recommends sample size for 10000 pop, 95% CL, 5% MOE', () => {
    const r = config.calculate({ population: '10000', confidence: '95', margin: '5' });
    const n = parseInt(getValue(r, 'sampleSize'));
    expect(n).toBeGreaterThan(300);
    expect(n).toBeLessThan(500);
  });

  it('returns larger sample for 99% confidence', () => {
    const r95 = config.calculate({ population: '10000', confidence: '95', margin: '5' });
    const r99 = config.calculate({ population: '10000', confidence: '99', margin: '5' });
    const n95 = parseInt(getValue(r95, 'sampleSize'));
    const n99 = parseInt(getValue(r99, 'sampleSize'));
    expect(n99).toBeGreaterThan(n95);
  });

  it('returns smaller sample for higher margin of error', () => {
    const r5 = config.calculate({ population: '10000', confidence: '95', margin: '5' });
    const r10 = config.calculate({ population: '10000', confidence: '95', margin: '10' });
    const n5 = parseInt(getValue(r5, 'sampleSize'));
    const n10 = parseInt(getValue(r10, 'sampleSize'));
    expect(n10).toBeLessThan(n5);
  });

  it('returns approximately 385 for large population, 95% CL, 5% MOE', () => {
    const r = config.calculate({ population: '1000000', confidence: '95', margin: '5' });
    const n = parseInt(getValue(r, 'sampleSize'));
    expect(n).toBeGreaterThanOrEqual(383);
    expect(n).toBeLessThanOrEqual(387);
  });

  it('finite population correction reduces sample for small population', () => {
    const rLarge = config.calculate({ population: '1000000', confidence: '95', margin: '5' });
    const rSmall = config.calculate({ population: '500', confidence: '95', margin: '5' });
    const nLarge = parseInt(getValue(rLarge, 'sampleSize'));
    const nSmall = parseInt(getValue(rSmall, 'sampleSize'));
    expect(nSmall).toBeLessThan(nLarge);
  });

  it('handles 90% confidence', () => {
    const r = config.calculate({ population: '10000', confidence: '90', margin: '5' });
    expect(r.length).toBeGreaterThan(0);
    expect(parseInt(getValue(r, 'sampleSize'))).toBeGreaterThan(0);
  });

  it('handles 99% confidence', () => {
    const r = config.calculate({ population: '10000', confidence: '99', margin: '5' });
    expect(r.length).toBeGreaterThan(0);
    expect(parseInt(getValue(r, 'sampleSize'))).toBeGreaterThan(0);
    expect(getValue(r, 'zScore')).toContain('2.576');
  });

  it('shows Z-score used', () => {
    const r = config.calculate({ population: '10000', confidence: '95', margin: '5' });
    expect(getValue(r, 'zScore')).toContain('1.96');
  });

  it('shows population info for small population', () => {
    const r = config.calculate({ population: '500', confidence: '95', margin: '5' });
    expect(getValue(r, 'populationInfo')).toContain('small');
  });

  it('shows population info for medium population', () => {
    const r = config.calculate({ population: '50000', confidence: '95', margin: '5' });
    expect(getValue(r, 'populationInfo')).toContain('medium');
  });

  it('shows population info for large population', () => {
    const r = config.calculate({ population: '1000000', confidence: '95', margin: '5' });
    expect(getValue(r, 'populationInfo')).toContain('large');
  });
});

describe('Sample size calculator — edge cases', () => {
  it('returns empty for invalid population (zero)', () => {
    const r = config.calculate({ population: '0', confidence: '95', margin: '5' });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid population (negative)', () => {
    const r = config.calculate({ population: '-100', confidence: '95', margin: '5' });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid population (NaN)', () => {
    const r = config.calculate({ population: 'abc', confidence: '95', margin: '5' });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid population (empty string)', () => {
    const r = config.calculate({ population: '', confidence: '95', margin: '5' });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid margin (negative)', () => {
    const r = config.calculate({ population: '10000', confidence: '95', margin: '-1' });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid margin (zero)', () => {
    const r = config.calculate({ population: '10000', confidence: '95', margin: '0' });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid margin (NaN)', () => {
    const r = config.calculate({ population: '10000', confidence: '95', margin: 'xyz' });
    expect(r).toEqual([]);
  });

  it('returns empty for margin >= 100', () => {
    const r = config.calculate({ population: '10000', confidence: '95', margin: '100' });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid confidence', () => {
    const r = config.calculate({ population: '10000', confidence: '80', margin: '5' });
    expect(r).toEqual([]);
  });

  it('handles population of 1', () => {
    const r = config.calculate({ population: '1', confidence: '95', margin: '5' });
    // With pop=1, FPC should give sample of 1
    expect(parseInt(getValue(r, 'sampleSize'))).toBe(1);
  });

  it('returns results for large margin (49%)', () => {
    const r = config.calculate({ population: '10000', confidence: '95', margin: '49' });
    expect(r.length).toBeGreaterThan(0);
    expect(parseInt(getValue(r, 'sampleSize'))).toBeGreaterThan(0);
  });
});

describe('Sample size calculator — result fields', () => {
  it('returns all expected result fields', () => {
    const r = config.calculate({ population: '10000', confidence: '95', margin: '5' });
    expect(getValue(r, 'sampleSize')).toBeTruthy();
    expect(getValue(r, 'responseRate')).toBeTruthy();
    expect(getValue(r, 'marginSize')).toBeTruthy();
    expect(getValue(r, 'zScore')).toBeTruthy();
    expect(getValue(r, 'populationInfo')).toBeTruthy();
  });

  it('sample size is a positive integer', () => {
    const r = config.calculate({ population: '10000', confidence: '95', margin: '5' });
    const n = parseInt(getValue(r, 'sampleSize'));
    expect(Number.isInteger(n)).toBe(true);
    expect(n).toBeGreaterThan(0);
  });

  it('sample size does not exceed population', () => {
    for (const pop of ['100', '1000', '10000']) {
      const r = config.calculate({ population: pop, confidence: '95', margin: '5' });
      const n = parseInt(getValue(r, 'sampleSize'));
      expect(n).toBeLessThanOrEqual(parseInt(pop, 10));
    }
  });

  it('margin of error value is displayed correctly', () => {
    const r = config.calculate({ population: '10000', confidence: '95', margin: '3.5' });
    expect(getValue(r, 'marginSize')).toContain('3.5');
    expect(getValue(r, 'marginSize')).toContain('%');
  });
});

describe('Sample size calculator — educational content', () => {
  it('defines all 4 formula variables', () => {
    const vars = config.educational?.variables;
    expect(vars).toBeDefined();
    expect(vars!.length).toBeGreaterThanOrEqual(4);
    const symbols = vars!.map(v => v.symbol);
    expect(symbols).toContain('Z');
    expect(symbols).toContain('p');
    expect(symbols).toContain('E');
    expect(symbols).toContain('N');
  });

  it('has 7+ FAQs', () => {
    const faqs = config.educational?.faqs;
    expect(faqs).toBeDefined();
    expect(faqs!.length).toBeGreaterThanOrEqual(7);
  });

  it('has 3 worked examples', () => {
    const examples = config.educational?.workedExamples;
    expect(examples).toBeDefined();
    expect(examples!.length).toBeGreaterThanOrEqual(3);
  });

  it('has pro tips', () => {
    const tips = config.educational?.proTips;
    expect(tips).toBeDefined();
    expect(tips!.length).toBeGreaterThanOrEqual(3);
  });

  it('has limitations', () => {
    const limitations = config.educational?.limitations;
    expect(limitations).toBeDefined();
    expect(limitations!.length).toBeGreaterThanOrEqual(3);
  });

  it('has common uses', () => {
    const uses = config.educational?.commonUses;
    expect(uses).toBeDefined();
    expect(uses!.length).toBeGreaterThanOrEqual(3);
  });

  it('has quick reference', () => {
    const qr = config.educational?.quickReference;
    expect(qr).toBeDefined();
    expect(qr!.length).toBeGreaterThanOrEqual(3);
  });

  it('has how-to-use steps', () => {
    const steps = config.educational?.howToUse;
    expect(steps).toBeDefined();
    expect(steps!.length).toBeGreaterThanOrEqual(3);
  });

  it('has citations', () => {
    const citations = config.educational?.citations;
    expect(citations).toBeDefined();
    expect(citations!.length).toBeGreaterThanOrEqual(2);
  });

  it('has formula description', () => {
    expect(config.educational?.formulaDescription).toBeDefined();
    expect(config.educational!.formulaDescription!.length).toBeGreaterThanOrEqual(50);
  });

  it('has SVG diagram with alt text', () => {
    expect(config.educational?.diagram?.svg).toBeDefined();
    expect(config.educational?.diagram?.alt).toBeDefined();
    expect(config.educational!.diagram!.alt!.length).toBeGreaterThan(10);
  });

  it('has SVG diagram with caption', () => {
    expect(config.educational?.diagram?.caption).toBeDefined();
    expect(config.educational!.diagram!.caption!.length).toBeGreaterThan(10);
  });
});
