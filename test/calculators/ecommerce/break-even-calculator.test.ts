import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/ecommerce/break-even/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('break-even', () => {
  it('calculates basic break-even point', () => {
    const r = config.calculate({
      fixedCosts: '10000',
      pricePerUnit: '49.99',
      variableCostPerUnit: '18',
    });
    expect(r).toHaveLength(4);

    // Contribution margin = 49.99 - 18 = 31.99
    // Break-even units = ceil(10000 / 31.99) = 313
    // Break-even revenue = rawUnits * price (not ceiled)
    const units = parseNumber(getValue(r, 'breakEvenUnits'));
    expect(units).toBe(313);

    near(parseNumber(getValue(r, 'breakEvenRevenue')), 15626.76, 1);
    near(parseNumber(getValue(r, 'contributionMargin')), 31.99, 0.1);
    expect(getValue(r, 'fixedCostNote')).toContain('10,000');
  });

  it('returns error when selling price does not exceed variable cost', () => {
    const r = config.calculate({
      fixedCosts: '10000',
      pricePerUnit: '20',
      variableCostPerUnit: '25',
    });
    expect(r).toHaveLength(1);
    expect(getValue(r, 'error')).toContain('Selling price must exceed variable cost');
  });

  it('handles break-even with zero variable costs', () => {
    const r = config.calculate({
      fixedCosts: '5000',
      pricePerUnit: '100',
      variableCostPerUnit: '0',
    });
    expect(r).toHaveLength(4);

    // Contribution margin = 100 - 0 = 100
    // Break-even = 5000 / 100 = 50 units
    const units = parseNumber(getValue(r, 'breakEvenUnits'));
    expect(units).toBe(50);
    near(parseNumber(getValue(r, 'contributionMargin')), 100);
  });

  it('handles large fixed costs', () => {
    const r = config.calculate({
      fixedCosts: '100000',
      pricePerUnit: '25',
      variableCostPerUnit: '10',
    });
    expect(r).toHaveLength(4);

    // Contribution margin = 15
    // Break-even = 100000 / 15 = 6666.67 → ceil = 6667
    const units = parseNumber(getValue(r, 'breakEvenUnits'));
    expect(units).toBe(6667);
    near(parseNumber(getValue(r, 'breakEvenRevenue')), 166666.67, 1);
  });

  it('handles break-even where contribution margin equals price (zero variable cost)', () => {
    const r = config.calculate({
      fixedCosts: '1000',
      pricePerUnit: '10',
      variableCostPerUnit: '0',
    });
    expect(r).toHaveLength(4);

    const units = parseNumber(getValue(r, 'breakEvenUnits'));
    expect(units).toBe(100);
    near(parseNumber(getValue(r, 'contributionMargin')), 10);
  });

  it('returns empty for zero price', () => {
    const r = config.calculate({
      fixedCosts: '10000',
      pricePerUnit: '0',
      variableCostPerUnit: '18',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for empty inputs', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty for missing price', () => {
    const r = config.calculate({
      fixedCosts: '10000',
      variableCostPerUnit: '18',
    });
    expect(r).toHaveLength(0);
  });

  it('handles high contribution margin with small fixed costs', () => {
    const r = config.calculate({
      fixedCosts: '100',
      pricePerUnit: '500',
      variableCostPerUnit: '10',
    });
    expect(r).toHaveLength(4);
    // CM = 490, BE = ceil(100 / 490) = 1
    const units = parseNumber(getValue(r, 'breakEvenUnits'));
    expect(units).toBe(1);
  });
});

describe('Break-Even educational content', () => {
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
