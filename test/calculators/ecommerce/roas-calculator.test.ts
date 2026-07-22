import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/ecommerce/roas/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('roas', () => {
  it('calculates basic ROAS', () => {
    const r = config.calculate({
      adSpend: '5000',
      revenue: '20000',
    });
    expect(r).toHaveLength(3);

    // ROAS = 20000 / 5000 = 4.00x
    // Profit = 20000 - 5000 = 15000
    // CPA = 5000 / (20000 / 50) = 12.50
    near(parseNumber(getValue(r, 'roas')), 4.0);
    near(parseNumber(getValue(r, 'profitFromAds')), 15000);
  });

  it('includes break-even ROAS when gross margin is provided', () => {
    const r = config.calculate({
      adSpend: '5000',
      revenue: '20000',
      grossMargin: '50',
    });
    expect(r).toHaveLength(4);

    // min break-even ROAS = 1 / 0.50 = 2.00x
    near(parseNumber(getValue(r, 'minROAS')), 2.0);
    expect(getValue(r, 'minROAS')).toContain('Profitable');
  });

  it('marks as unprofitable when ROAS is below break-even', () => {
    const r = config.calculate({
      adSpend: '10000',
      revenue: '15000',
      grossMargin: '25',
    });
    expect(r).toHaveLength(4);

    // ROAS = 15000 / 10000 = 1.50x
    // break-even = 1 / 0.25 = 4.00x
    near(parseNumber(getValue(r, 'roas')), 1.5);
    expect(getValue(r, 'minROAS')).toContain('Unprofitable');
  });

  it('handles high ROAS that is still unprofitable with thin margins', () => {
    const r = config.calculate({
      adSpend: '1000',
      revenue: '5000',
      grossMargin: '10',
    });
    expect(r).toHaveLength(4);

    // ROAS = 5.00x
    // break-even = 1 / 0.10 = 10.00x
    near(parseNumber(getValue(r, 'roas')), 5.0);
    expect(getValue(r, 'minROAS')).toContain('Unprofitable');
  });

  it('handles break-even scenario when ROAS equals minimum', () => {
    const r = config.calculate({
      adSpend: '5000',
      revenue: '10000',
      grossMargin: '50',
    });
    expect(r).toHaveLength(4);

    // ROAS = 2.00x
    // break-even = 1 / 0.50 = 2.00x
    near(parseNumber(getValue(r, 'roas')), 2.0);
    near(parseNumber(getValue(r, 'minROAS')), 2.0);
    expect(getValue(r, 'minROAS')).toContain('Profitable');
  });

  it('returns empty for zero ad spend', () => {
    const r = config.calculate({
      adSpend: '0',
      revenue: '20000',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for empty inputs', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty for missing ad spend', () => {
    const r = config.calculate({
      revenue: '20000',
    });
    expect(r).toHaveLength(0);
  });

  it('handles zero revenue', () => {
    const r = config.calculate({
      adSpend: '5000',
      revenue: '0',
    });
    expect(r).toHaveLength(3);

    near(parseNumber(getValue(r, 'roas')), 0);
    near(parseNumber(getValue(r, 'profitFromAds')), -5000);
  });

  it('returns empty for missing ad spend but with revenue', () => {
    const r = config.calculate({
      revenue: '20000',
    });
    expect(r).toHaveLength(0);
  });

  it('handles 100% margin edge case', () => {
    const r = config.calculate({
      adSpend: '1000',
      revenue: '5000',
      grossMargin: '100',
    });
    expect(r).toHaveLength(4);
    near(parseNumber(getValue(r, 'roas')), 5.0);
    near(parseNumber(getValue(r, 'minROAS')), 1.0);
    expect(getValue(r, 'minROAS')).toContain('Profitable');
  });
});

describe('ROAS educational content', () => {
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
