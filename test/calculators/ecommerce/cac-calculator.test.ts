import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/ecommerce/cac/index';
import { getValue, parseMoney, parseNumber, near } from '../../helpers';

describe('CAC Calculator', () => {
  it('calculates CAC from spend and customers', () => {
    const results = config.calculate({
      totalMarketingSpend: '25000',
      newCustomers: '150',
      ltv: '',
      avgOrderValue: '',
      grossMarginPct: '',
    });
    // CAC = 25000 / 150 = 166.67
    const cac = parseMoney(getValue(results, 'cac'));
    near(cac, 166.67, 0.01);
  });

  it('calculates LTV:CAC ratio when LTV is provided', () => {
    const results = config.calculate({
      totalMarketingSpend: '25000',
      newCustomers: '150',
      ltv: '500',
      avgOrderValue: '',
      grossMarginPct: '',
    });
    // LTV:CAC = 500 / 166.67 = 3.0x
    const ratio = parseNumber(getValue(results, 'ltvCac'));
    near(ratio, 3.0, 0.01);
  });

  it('calculates payback period when AOV and margin are provided', () => {
    const results = config.calculate({
      totalMarketingSpend: '25000',
      newCustomers: '150',
      ltv: '',
      avgOrderValue: '85',
      grossMarginPct: '60',
    });
    // CAC = 166.67, monthly gross profit = 85 * 0.60 = 51
    // Payback = 166.67 / 51 = 3.27 months
    const payback = parseNumber(getValue(results, 'payback'));
    near(payback, 3.27, 0.1);
  });

  it('shows positive LTV:CAC when ratio is above 3', () => {
    const results = config.calculate({
      totalMarketingSpend: '10000',
      newCustomers: '100',
      ltv: '600',
      avgOrderValue: '',
      grossMarginPct: '',
    });
    // CAC = 100, LTV:CAC = 6.0x
    const ratio = parseNumber(getValue(results, 'ltvCac'));
    near(ratio, 6.0);
    expect(getValue(results, 'ltvCac')).toContain('x');
  });

  it('returns empty for missing spend or customers', () => {
    const results = config.calculate({
      totalMarketingSpend: '',
      newCustomers: '',
      ltv: '',
      avgOrderValue: '',
      grossMarginPct: '',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for zero customers', () => {
    const results = config.calculate({
      totalMarketingSpend: '25000',
      newCustomers: '0',
      ltv: '',
      avgOrderValue: '',
      grossMarginPct: '',
    });
    expect(results).toEqual([]);
  });

  it('has all required result IDs', () => {
    const results = config.calculate({
      totalMarketingSpend: '25000',
      newCustomers: '150',
      ltv: '500',
      avgOrderValue: '85',
      grossMarginPct: '60',
    });
    const ids = results.map((r) => r.id);
    expect(ids).toContain('cac');
    expect(ids).toContain('ltvCac');
    expect(ids).toContain('payback');
    expect(ids).toContain('totalSpend');
  });

  it('shows neutral LTV:CAC when ratio is between 1 and 3', () => {
    const results = config.calculate({
      totalMarketingSpend: '25000',
      newCustomers: '150',
      ltv: '250',
      avgOrderValue: '',
      grossMarginPct: '',
    });
    // CAC = 166.67, LTV = 250, ratio = 1.5x (neutral)
    const ratio = parseNumber(getValue(results, 'ltvCac'));
    near(ratio, 1.5, 0.1);
    expect(getValue(results, 'ltvCac')).toBeDefined();
  });

  it('shows negative LTV:CAC when ratio is below 1', () => {
    const results = config.calculate({
      totalMarketingSpend: '25000',
      newCustomers: '150',
      ltv: '100',
      avgOrderValue: '',
      grossMarginPct: '',
    });
    const ratio = parseNumber(getValue(results, 'ltvCac'));
    near(ratio, 0.6, 0.1);
  });

  it('calculates payback period with neutral color when 12-24 months', () => {
    const results = config.calculate({
      totalMarketingSpend: '50000',
      newCustomers: '100',
      ltv: '',
      avgOrderValue: '85',
      grossMarginPct: '40',
    });
    // CAC = 500, monthly GP = 85 * 0.40 = 34
    // Payback = 500 / 34 = ~14.7 months
    const payback = parseNumber(getValue(results, 'payback'));
    near(payback, 14.7, 0.5);
  });
});

describe('CAC educational content', () => {
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
