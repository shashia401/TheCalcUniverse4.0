import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/recipe-scaler/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Recipe Scaler / Ingredient Converter', () => {
  it('scale 2 to 4 servings doubles quantities', () => {
    const results = config.calculate({
      originalServings: '2',
      desiredServings: '4',
      ingredient1Name: 'Flour',
      ingredient1Qty: '1',
      ingredient1Unit: 'cups',
    });
    const scaled = parseNumber(getValue(results, 'ingredient1-scaled'));
    near(scaled, 2); // 1 * (4/2) = 2
    const factor = parseNumber(getValue(results, 'scaleFactor'));
    near(factor, 2);
  });

  it('scale 4 to 2 servings halves quantities', () => {
    const results = config.calculate({
      originalServings: '4',
      desiredServings: '2',
      ingredient1Name: 'Sugar',
      ingredient1Qty: '2',
      ingredient1Unit: 'cups',
    });
    const scaled = parseNumber(getValue(results, 'ingredient1-scaled'));
    near(scaled, 1); // 2 * (2/4) = 1
    const factor = parseNumber(getValue(results, 'scaleFactor'));
    near(factor, 0.5);
  });

  it('parses fraction "1/2" correctly', () => {
    const results = config.calculate({
      originalServings: '2',
      desiredServings: '4',
      ingredient1Name: 'Butter',
      ingredient1Qty: '1/2',
      ingredient1Unit: 'cups',
    });
    const scaled = parseNumber(getValue(results, 'ingredient1-scaled'));
    near(scaled, 1); // 0.5 * (4/2) = 1
  });

  it('parses mixed fraction "2 1/2" correctly', () => {
    const results = config.calculate({
      originalServings: '2',
      desiredServings: '1',
      ingredient1Name: 'Milk',
      ingredient1Qty: '2 1/2',
      ingredient1Unit: 'cups',
    });
    const scaled = parseNumber(getValue(results, 'ingredient1-scaled'));
    near(scaled, 1.25); // 2.5 * (1/2) = 1.25
  });

  it('returns empty array when originalServings is empty', () => {
    const results = config.calculate({
      originalServings: '',
      desiredServings: '4',
      ingredient1Name: 'Flour',
      ingredient1Qty: '1',
      ingredient1Unit: 'cups',
    });
    expect(results).toEqual([]);
  });

  it('returns empty array when originalServings is zero', () => {
    const results = config.calculate({
      originalServings: '0',
      desiredServings: '4',
      ingredient1Name: 'Flour',
      ingredient1Qty: '1',
      ingredient1Unit: 'cups',
    });
    expect(results).toEqual([]);
  });

  it('scales multiple ingredients (ingredient2 and ingredient3)', () => {
    const results = config.calculate({
      originalServings: '2',
      desiredServings: '6',
      ingredient1Name: 'Flour',
      ingredient1Qty: '2',
      ingredient1Unit: 'cups',
      ingredient2Name: 'Sugar',
      ingredient2Qty: '1',
      ingredient2Unit: 'tbsp',
      ingredient3Name: 'Salt',
      ingredient3Qty: '1/2',
      ingredient3Unit: 'tsp',
    });
    const flour = parseNumber(getValue(results, 'ingredient1-scaled'));
    near(flour, 6); // 2 * 3 = 6

    const sugar = parseNumber(getValue(results, 'ingredient2-scaled'));
    near(sugar, 3); // 1 * 3 = 3

    const salt = parseNumber(getValue(results, 'ingredient3-scaled'));
    near(salt, 1.5); // 0.5 * 3 = 1.5
  });

  it('has scale factor in results', () => {
    const results = config.calculate({
      originalServings: '4',
      desiredServings: '3',
      ingredient1Name: 'Flour',
      ingredient1Qty: '1',
      ingredient1Unit: 'cups',
    });
    const factor = parseNumber(getValue(results, 'scaleFactor'));
    near(factor, 0.75);
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

    it('has at least 3 FAQs', () => {
      expect(config.educational.faqs).toBeDefined();
      expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(3);
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

    it('has formula defined', () => {
      expect(config.educational.formula).toBeDefined();
      expect(config.educational.formula!.length).toBeGreaterThan(0);
    });

    it('number inputs have inputMode set', () => {
      const numberInputs = config.inputs.filter((i) => i.type === 'number');
      expect(numberInputs.length).toBeGreaterThanOrEqual(1);
      for (const input of numberInputs) {
        expect(input.inputMode).toBeDefined();
      }
    });
  });
});
