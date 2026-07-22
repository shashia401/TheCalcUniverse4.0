import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/wedding-alcohol/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Wedding/Party Alcohol Calculator', () => {
  it('100 guests 4hrs 80% drinking: correct beer/wine/liquor counts', () => {
    const results = config.calculate({
      guests: '100',
      drinkersPct: '80',
      duration: '4',
      beerPct: '40',
      winePct: '30',
      liquorPct: '30',
    });

    // drinkingGuests = 100 * 0.8 = 80
    const drinkers = parseNumber(getValue(results, 'drinkingGuests'));
    near(drinkers, 80);

    // beerTotal = 80 * 0.4 * 4 * 1.5 = 192
    const beer = parseNumber(getValue(results, 'beerTotal'));
    near(beer, 192);

    // wineGlasses = 80 * 0.3 * 4 * 1.0 = 96
    // wineBottles = 96 / 5 = 19.2, ceil to 20
    const wineBottles = parseNumber(getValue(results, 'wineBottles'));
    near(wineBottles, 20);

    // liquorDrinks = 80 * 0.3 * 4 * 0.75 = 72
    // liquorBottles = 72 / 17 ≈ 4.235, ceil to 5
    const liquorBottles = parseNumber(getValue(results, 'liquorBottles'));
    near(liquorBottles, 5);
  });

  it('50 guests: returns results with correct proportions', () => {
    const results = config.calculate({
      guests: '50',
      drinkersPct: '80',
      duration: '4',
      beerPct: '40',
      winePct: '30',
      liquorPct: '30',
    });

    const drinkers = parseNumber(getValue(results, 'drinkingGuests'));
    near(drinkers, 40);

    const beer = parseNumber(getValue(results, 'beerTotal'));
    near(beer, 96); // 40 * 0.4 * 4 * 1.5 = 96

    expect(results.length).toBeGreaterThan(0);
  });

  it('returns empty array when guests is zero', () => {
    const results = config.calculate({
      guests: '0',
      drinkersPct: '80',
      duration: '4',
      beerPct: '40',
      winePct: '30',
      liquorPct: '30',
    });
    expect(results).toEqual([]);
  });

  it('returns empty array when guests is empty', () => {
    const results = config.calculate({
      guests: '',
      drinkersPct: '80',
      duration: '4',
      beerPct: '40',
      winePct: '30',
      liquorPct: '30',
    });
    expect(results).toEqual([]);
  });

  it('handles 100% drinkers correctly', () => {
    const results = config.calculate({
      guests: '10',
      drinkersPct: '100',
      duration: '1',
      beerPct: '100',
      winePct: '0',
      liquorPct: '0',
    });

    const drinkers = parseNumber(getValue(results, 'drinkingGuests'));
    near(drinkers, 10);

    const beer = parseNumber(getValue(results, 'beerTotal'));
    near(beer, 15); // 10 * 1.0 * 1 * 1.5 = 15
  });

  it('handles different duration (6 hours)', () => {
    const results = config.calculate({
      guests: '100',
      drinkersPct: '80',
      duration: '6',
      beerPct: '40',
      winePct: '30',
      liquorPct: '30',
    });

    const beer = parseNumber(getValue(results, 'beerTotal'));
    near(beer, 288); // 80 * 0.4 * 6 * 1.5 = 288
  });

  describe('educational content', () => {
    it('formulaDescription is at least 100 characters', () => {
      expect(config.educational.formulaDescription!.length).toBeGreaterThanOrEqual(100);
    });

    it('explanation is at least 300 characters', () => {
      expect(config.educational.explanation!.length).toBeGreaterThanOrEqual(300);
    });

    it('has at least 4 variables', () => {
      expect(config.educational.variables).toBeDefined();
      expect(config.educational.variables!.length).toBeGreaterThanOrEqual(4);
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

    it('has quickReference with at least 4 entries', () => {
      expect(config.educational.quickReference).toBeDefined();
      expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(4);
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

    it('number inputs have inputMode set', () => {
      const numberInputs = config.inputs.filter((i) => i.type === 'number');
      expect(numberInputs.length).toBeGreaterThanOrEqual(3);
      for (const input of numberInputs) {
        expect(input.inputMode).toBeDefined();
      }
    });
  });
});
