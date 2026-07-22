import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/ecommerce/margin-calculator/index';
import { getValue, parseMoney, parseNumber, near } from '../../helpers';

describe('Margin Calculator', () => {
  it('calculates margin from cost and revenue', () => {
    const results = config.calculate({
      solveFor: 'margin',
      costInput: '50',
      revenueInput: '90',
      marginInput: '',
      markupInput: '',
    });
    const margin = parseNumber(getValue(results, 'solvedValue'));
    near(margin, 44.4444, 0.01); // (90-50)/90 * 100 = 44.44%
    expect(getValue(results, 'solvedValue')).toContain('%');
  });

  it('calculates markup from cost and revenue', () => {
    const results = config.calculate({
      solveFor: 'markup',
      costInput: '50',
      revenueInput: '90',
      marginInput: '',
      markupInput: '',
    });
    const markup = parseNumber(getValue(results, 'solvedValue'));
    near(markup, 80, 0.01); // (90-50)/50 * 100 = 80%
  });

  it('calculates gross profit correctly', () => {
    const results = config.calculate({
      solveFor: 'margin',
      costInput: '50',
      revenueInput: '90',
      marginInput: '',
      markupInput: '',
    });
    const profit = parseMoney(getValue(results, 'grossProfit'));
    near(profit, 40);
  });

  it('solves for revenue using margin', () => {
    const results = config.calculate({
      solveFor: 'revenue',
      costInput: '50',
      revenueInput: '',
      marginInput: '44.4444',
      markupInput: '',
    });
    // revenue = 50 / (1 - 44.4444/100) ≈ 90
    const revenue = parseMoney(getValue(results, 'solvedValue'));
    near(revenue, 90, 0.5);
  });

  it('solves for revenue using markup', () => {
    const results = config.calculate({
      solveFor: 'revenue',
      costInput: '50',
      revenueInput: '',
      marginInput: '',
      markupInput: '80',
    });
    // revenue = 50 * (1 + 80/100) = 90
    const revenue = parseMoney(getValue(results, 'solvedValue'));
    near(revenue, 90);
  });

  it('solves for cost using margin', () => {
    const results = config.calculate({
      solveFor: 'cost',
      costInput: '',
      revenueInput: '90',
      marginInput: '44.4444',
      markupInput: '',
    });
    // cost = 90 * (1 - 44.4444/100) ≈ 50
    const cost = parseMoney(getValue(results, 'solvedValue'));
    near(cost, 50, 0.5);
  });

  it('returns empty for missing required inputs', () => {
    const results = config.calculate({
      solveFor: 'margin',
      costInput: '',
      revenueInput: '',
      marginInput: '',
      markupInput: '',
    });
    expect(results).toEqual([]);
  });

  it('solves for markup with explanation key', () => {
    const results = config.calculate({
      solveFor: 'markup',
      costInput: '60',
      revenueInput: '100',
      marginInput: '',
      markupInput: '',
    });
    expect(results.length).toBeGreaterThan(0);
    expect(getValue(results, 'solvedValue')).toContain('%');
    expect(results.map((r) => r.id)).toContain('differenceExplainer');
  });

  it('solves for cost using markup input', () => {
    const results = config.calculate({
      solveFor: 'cost',
      costInput: '',
      revenueInput: '120',
      marginInput: '',
      markupInput: '50',
    });
    const cost = parseMoney(getValue(results, 'solvedValue'));
    near(cost, 80, 0.5);
  });
});

describe('Margin Calculator educational content', () => {
  it('has workedExamples with real scenarios', () => {
    const examples = config.educational.workedExamples;
    expect(examples).toBeDefined();
    expect(examples!.length).toBeGreaterThanOrEqual(2);
    examples!.forEach((ex) => {
      expect(ex.scenario).toBeTruthy();
      expect(ex.insight).toBeTruthy();
    });
  });

  it('has proTips with actionable advice', () => {
    const tips = config.educational.proTips;
    expect(tips).toBeDefined();
    expect(tips!.length).toBeGreaterThanOrEqual(4);
  });

  it('has limitations with real content', () => {
    const limitations = config.educational.limitations;
    expect(limitations).toBeDefined();
    expect(limitations.length).toBeGreaterThan(0);
    expect(limitations.every((l: string) => l.length > 20)).toBe(true);
  });

  it('has quickReference table', () => {
    const qr = config.educational.quickReference;
    expect(qr).toBeDefined();
    expect(qr!.length).toBeGreaterThanOrEqual(5);
    qr!.forEach((entry) => {
      expect(entry.label).toBeTruthy();
      expect(entry.value).toBeTruthy();
    });
  });

  it('has 7+ FAQs', () => {
    const faqs = config.educational.faqs;
    expect(faqs).toBeDefined();
    expect(faqs!.length).toBeGreaterThanOrEqual(7);
  });

  it('number inputs have inputMode', () => {
    const numberInputs = config.inputs.filter((i) => i.type === 'number');
    expect(numberInputs.length).toBeGreaterThan(0);
    numberInputs.forEach((i) => {
      expect(i.inputMode).toBeDefined();
    });
  });
});
