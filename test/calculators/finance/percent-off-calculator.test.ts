import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/percent-off/index';
import { getValue, parseMoney } from '../../helpers';

describe('Percent Off Calculator', () => {
  it('calculates final price with single discount and no tax', () => {
    const results = config.calculate({
      price: '100',
      discount1: '20',
      discount2: '',
      tax: '',
    });

    const final = parseMoney(getValue(results, 'final'));
    expect(final).toBe(80);

    const saved = parseMoney(getValue(results, 'saved'));
    expect(saved).toBe(20);

    const effective = getValue(results, 'effective');
    expect(effective).toBe('20.00%');
  });

  it('calculates final price with stacked discounts and no tax', () => {
    const results = config.calculate({
      price: '100',
      discount1: '20',
      discount2: '10',
      tax: '',
    });

    const final = parseMoney(getValue(results, 'final'));
    expect(final).toBe(72);

    const saved = parseMoney(getValue(results, 'saved'));
    expect(saved).toBe(28);

    const effective = getValue(results, 'effective');
    // 20% then 10% = 28% effective, not 30%
    expect(effective).toBe('28.00%');

    // Should have stacking gap result
    const gap = results.find((r) => r.id === 'gap');
    expect(gap).toBeDefined();
    expect(gap!.value).toContain('2.00');
  });

  it('applies sales tax after discounts', () => {
    const results = config.calculate({
      price: '100',
      discount1: '25',
      discount2: '',
      tax: '8',
    });

    const final = parseMoney(getValue(results, 'final'));
    // $75 + 8% tax = $81
    expect(final).toBe(81);

    // Should include tax line
    const taxLine = results.find((r) => r.id === 'tax');
    expect(taxLine).toBeDefined();
    expect(parseMoney(taxLine!.value)).toBe(6);
  });

  it('shows stacking gap for stacked discounts', () => {
    const results = config.calculate({
      price: '200',
      discount1: '40',
      discount2: '30',
      tax: '',
    });

    const effective = getValue(results, 'effective');
    // 40% then 30% = 58% effective, gap = 70-58 = 12
    expect(effective).toBe('58.00%');

    const gap = results.find((r) => r.id === 'gap');
    expect(gap).toBeDefined();
    expect(gap!.value).toContain('12.00');
  });

  it('returns error for discount over 100%', () => {
    const results = config.calculate({
      price: '100',
      discount1: '120',
      discount2: '',
      tax: '',
    });

    const err = results.find((r) => r.id === 'err');
    expect(err).toBeDefined();
    expect(err!.color).toBe('negative');
  });

  it('returns error for negative tax', () => {
    const results = config.calculate({
      price: '100',
      discount1: '10',
      discount2: '',
      tax: '-5',
    });

    const err = results.find((r) => r.id === 'err');
    expect(err).toBeDefined();
  });

  it('returns empty array for empty price', () => {
    const results = config.calculate({
      price: '',
      discount1: '10',
      discount2: '',
      tax: '',
    });
    expect(results).toEqual([]);
  });

  it('returns empty array for negative price', () => {
    const results = config.calculate({
      price: '-50',
      discount1: '10',
      discount2: '',
      tax: '',
    });
    expect(results).toEqual([]);
  });

  it('formats currency with proper rounding', () => {
    const results = config.calculate({
      price: '19.99',
      discount1: '33',
      discount2: '',
      tax: '0',
    });

    const final = getValue(results, 'final');
    // 19.99 * 0.67 = 13.3933, should be $13.39
    expect(final).toContain('$');
    const amount = parseMoney(final);
    expect(amount).toBeCloseTo(13.39, 1);
  });

  it('includes original price in results', () => {
    const results = config.calculate({
      price: '150',
      discount1: '10',
      discount2: '',
      tax: '',
    });

    const original = parseMoney(getValue(results, 'price'));
    expect(original).toBe(150);
  });

  describe('educational content', () => {
    it('has formula', () => {
      expect(config.educational.formula).toBeDefined();
      expect(config.educational.formula!.length).toBeGreaterThan(0);
    });

    it('formulaDescription is at least 100 characters', () => {
      expect(config.educational.formulaDescription!.length).toBeGreaterThanOrEqual(100);
    });

    it('explanation is at least 300 characters', () => {
      expect(config.educational.explanation!.length).toBeGreaterThanOrEqual(300);
    });

    it('has at least 5 FAQs', () => {
      expect(config.educational.faqs).toBeDefined();
      expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
    });

    it('has citations', () => {
      expect(config.educational.citations).toBeDefined();
      expect(config.educational.citations!.length).toBeGreaterThanOrEqual(1);
    });

    it('has proTips', () => {
      expect(config.educational.proTips).toBeDefined();
      expect(config.educational.proTips!.length).toBeGreaterThanOrEqual(4);
    });

    it('has limitations', () => {
      expect(config.educational.limitations).toBeDefined();
      expect(config.educational.limitations!.length).toBeGreaterThanOrEqual(1);
    });

    it('has worked examples', () => {
      expect(config.educational.workedExamples).toBeDefined();
      expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(2);
    });

    it('has an SVG diagram', () => {
      expect(config.educational.diagram).toBeDefined();
      expect(config.educational.diagram!.svg).toContain('<svg');
    });

    it('has variables', () => {
      expect(config.educational.variables).toBeDefined();
      expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
    });

    it('has howToUse steps', () => {
      expect(config.educational.howToUse).toBeDefined();
      expect(config.educational.howToUse!.length).toBeGreaterThanOrEqual(3);
    });

    it('has commonUses', () => {
      expect(config.educational.commonUses).toBeDefined();
      expect(config.educational.commonUses!.length).toBeGreaterThanOrEqual(2);
    });
  });
});
