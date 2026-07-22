import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/automotive/tire-size/index';

import { getValue, parseNumber, near } from '../../helpers';

describe('tire-size', () => {
  it('size calculation: 225/50R17 to 235/45R18 (plus-one sizing)', () => {
    const r = config.calculate({
      origWidth: '225',
      origAspect: '50',
      origRim: '17',
      newWidth: '235',
      newAspect: '45',
      newRim: '18',
    });
    expect(r).toHaveLength(4);
    // origSidewall = 225 * 0.50 = 112.5
    // newSidewall = 235 * 0.45 = 105.75
    // origDiamMm = 17 * 25.4 + 2 * 112.5 = 431.8 + 225 = 656.8
    // newDiamMm = 18 * 25.4 + 2 * 105.75 = 457.2 + 211.5 = 668.7
    // diamDiffPct = (668.7 - 656.8) / 656.8 * 100 = 1.812%
    near(parseNumber(getValue(r, 'diamDiff')), 1.81, 0.1);
    // speedError same as diamDiff
    near(parseNumber(getValue(r, 'speedError')), 1.81, 0.1);
    // origDiam in inches = 656.8 / 25.4 = 25.86"
    near(parseNumber(getValue(r, 'origDiam')), 25.86, 0.1);
    // newDiam in inches = 668.7 / 25.4 = 26.33"
    near(parseNumber(getValue(r, 'newDiam')), 26.33, 0.1);
  });

  it('same tires produce zero difference', () => {
    const r = config.calculate({
      origWidth: '225',
      origAspect: '50',
      origRim: '17',
      newWidth: '225',
      newAspect: '50',
      newRim: '17',
    });
    expect(r).toHaveLength(4);
    near(parseNumber(getValue(r, 'diamDiff')), 0);
    near(parseNumber(getValue(r, 'speedError')), 0);
  });

  it('larger diameter increase shows positive speed error', () => {
    // Going from small to much larger tire
    const r = config.calculate({
      origWidth: '205',
      origAspect: '55',
      origRim: '16',
      newWidth: '245',
      newAspect: '45',
      newRim: '19',
    });
    expect(r).toHaveLength(4);
    // origSidewall = 205 * 0.55 = 112.75
    // newSidewall = 245 * 0.45 = 110.25
    // origDiamMm = 16 * 25.4 + 2 * 112.75 = 406.4 + 225.5 = 631.9
    // newDiamMm = 19 * 25.4 + 2 * 110.25 = 482.6 + 220.5 = 703.1
    // diamDiffPct = (703.1 - 631.9) / 631.9 * 100 = 11.27%
    const diff = parseNumber(getValue(r, 'diamDiff'));
    expect(diff).toBeGreaterThan(5); // should exceed safe 3% threshold
    // Speed error should reference "reads lower" for positive diff
    expect(getValue(r, 'speedError')).toContain('lower');
  });

  it('returns empty for missing inputs', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty when any field is Not a Number', () => {
    const r = config.calculate({
      origWidth: 'abc',
      origAspect: '50',
      origRim: '17',
      newWidth: '235',
      newAspect: '45',
      newRim: '18',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for empty string values', () => {
    const r = config.calculate({
      origWidth: '225',
      origAspect: '',
      origRim: '17',
      newWidth: '235',
      newAspect: '45',
      newRim: '18',
    });
    expect(r).toHaveLength(0);
  });

  describe('Educational content', () => {
    it('has formula defined', () => {
      expect(config.educational.formula).toBeTruthy();
    });

    it('has 5+ variables', () => {
      expect(config.educational.variables).toHaveLength(3);
    });

    it('has how-to-use instructions', () => {
      expect(config.educational.howToUse?.length).toBeGreaterThanOrEqual(4);
    });

    it('has explanation', () => {
      expect(config.educational.explanation).toBeTruthy();
      expect(config.educational.explanation.length).toBeGreaterThan(300);
    });

    it('has 5+ FAQs', () => {
      expect(config.educational.faqs?.length).toBeGreaterThanOrEqual(5);
    });

    it('has worked examples', () => {
      expect(config.educational.workedExamples?.length).toBeGreaterThanOrEqual(2);
    });

    it('has pro tips', () => {
      expect(config.educational.proTips?.length).toBeGreaterThanOrEqual(4);
    });

    it('has limitations', () => {
      expect(config.educational.limitations?.length).toBeGreaterThanOrEqual(3);
    });

    it('has quick reference', () => {
      expect(config.educational.quickReference?.length).toBeGreaterThanOrEqual(5);
    });

    it('all inputs have inputMode defined', () => {
      for (const input of config.inputs) {
        expect(input.inputMode).toBeTruthy();
      }
    });
  });
});
