import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/ecommerce/profit-margin/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('profit-margin', () => {
  it('calculates gross profit margin from cost and revenue', () => {
    const r = config.calculate({
      mode: 'margin',
      cost: '50',
      revenue: '80',
    });
    expect(r).toHaveLength(4);

    // Profit = 80 - 50 = 30
    // Margin % = 30 / 80 * 100 = 37.50%
    // Markup % = 30 / 50 * 100 = 60.00%
    near(parseNumber(getValue(r, 'primary')), 37.50);
    near(parseNumber(getValue(r, 'profit')), 30);
    near(parseNumber(getValue(r, 'margin')), 37.50);
    near(parseNumber(getValue(r, 'markup')), 60.00);
  });

  it('calculates markup percentage from cost and revenue', () => {
    const r = config.calculate({
      mode: 'markup',
      cost: '50',
      revenue: '80',
    });
    expect(r).toHaveLength(4);
    expect(getValue(r, 'primary')).toContain('60.00');
    near(parseNumber(getValue(r, 'markup')), 60.00);
  });

  it('calculates selling price from target margin', () => {
    const r = config.calculate({
      mode: 'price_from_margin',
      cost: '75',
      targetPct: '40',
    });
    expect(r).toHaveLength(2);

    // Price = 75 / (1 - 0.40) = 125
    // Profit = 125 - 75 = 50
    near(parseNumber(getValue(r, 'price')), 125);
    near(parseNumber(getValue(r, 'profit')), 50);
  });

  it('calculates selling price from target markup', () => {
    const r = config.calculate({
      mode: 'price_from_markup',
      cost: '100',
      targetPct: '50',
    });
    expect(r).toHaveLength(3);

    // Price = 100 * (1 + 0.50) = 150
    // Profit = 150 - 100 = 50
    // Margin = 50 / 150 * 100 = 33.33%
    near(parseNumber(getValue(r, 'price')), 150);
    near(parseNumber(getValue(r, 'profit')), 50);
    near(parseNumber(getValue(r, 'margin')), 33.33);
  });

  it('handles zero cost', () => {
    const r = config.calculate({
      mode: 'margin',
      cost: '0',
      revenue: '100',
    });
    expect(r).toHaveLength(4);

    // Profit = 100 - 0 = 100
    // Margin = 100 / 100 * 100 = 100%
    // Markup = 100 / 0 = 0 (avoid division by zero)
    near(parseNumber(getValue(r, 'profit')), 100);
    near(parseNumber(getValue(r, 'margin')), 100);
  });

  it('handles zero revenue with loss (cost > revenue)', () => {
    const r = config.calculate({
      mode: 'margin',
      cost: '100',
      revenue: '50',
    });
    expect(r).toHaveLength(4);

    // Profit = 50 - 100 = -50
    // Margin = -50 / 50 * 100 = -100%
    near(parseNumber(getValue(r, 'profit')), -50);
    near(parseNumber(getValue(r, 'margin')), -100);
  });

  it('returns empty for missing revenue in margin mode', () => {
    const r = config.calculate({
      mode: 'margin',
      cost: '50',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for target margin >= 100%', () => {
    const r = config.calculate({
      mode: 'price_from_margin',
      cost: '75',
      targetPct: '100',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for empty inputs', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty for negative cost', () => {
    const r = config.calculate({
      mode: 'margin',
      cost: '-10',
      revenue: '50',
    });
    expect(r).toHaveLength(0);
  });
});

describe('profit-margin educational content', () => {
  it('has workedExamples with real scenarios', () => {
    const examples = config.educational.workedExamples;
    expect(examples).toBeDefined();
    expect(examples!.length).toBeGreaterThanOrEqual(2);
    examples!.forEach((ex) => {
      expect(ex.scenario).toBeTruthy();
      expect(ex.inputs).toBeDefined();
      expect(ex.insight).toBeTruthy();
    });
  });

  it('has proTips with actionable advice', () => {
    const tips = config.educational.proTips;
    expect(tips).toBeDefined();
    expect(tips!.length).toBeGreaterThanOrEqual(4);
    tips!.forEach((tip) => {
      expect(typeof tip).toBe('string');
      expect(tip.length).toBeGreaterThan(20);
    });
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
