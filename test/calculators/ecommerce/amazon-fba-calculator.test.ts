import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/ecommerce/amazon-fba/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('amazon-fba-calculator', () => {
  it('calculates basic fee breakdown', () => {
    const r = config.calculate({
      sellingPrice: '29.99',
      productCost: '7.50',
      weight: '1.2',
      category: 'general',
      volume: '',
    });
    expect(r).toHaveLength(6);

    // 15% referral fee = $4.50
    // FBA fee at 1.2 lbs = $4.18
    // Storage excluded (no volume entered)
    // Total fees = 4.4985 + 4.18 = 8.6785
    // Net profit = 29.99 - 7.50 - 8.6785 = 13.8115
    // Margin = 13.8115 / 29.99 * 100 = 46.05%
    // ROI = 13.8115 / 7.50 * 100 = 184.15%
    near(parseNumber(getValue(r, 'netProfit')), 13.81);
    near(parseNumber(getValue(r, 'margin')), 46.05, 0.1);
    near(parseNumber(getValue(r, 'roi')), 184.15, 0.1);
    expect(getValue(r, 'referralFee')).toContain('4.50');
    expect(getValue(r, 'fbaFee')).toContain('4.18');
    expect(getValue(r, 'storageFee')).toContain('0.00');
  });

  it('handles electronics category (8% referral)', () => {
    const r = config.calculate({
      sellingPrice: '100',
      productCost: '40',
      weight: '0.5',
      category: 'electronics',
      volume: '',
    });
    expect(r).toHaveLength(6);

    // 8% referral fee = $8.00
    // FBA fee at 0.5 lbs (<=1) = $3.22
    // Net profit = 100 - 40 - 8 - 3.22 = 48.78
    near(parseNumber(getValue(r, 'netProfit')), 48.78);
    near(parseNumber(getValue(r, 'referralFee')), 8.0);
    near(parseNumber(getValue(r, 'fbaFee')), 3.22);
  });

  it('handles heavy items over 21 lbs with proper tier pricing', () => {
    const r = config.calculate({
      sellingPrice: '200',
      productCost: '80',
      weight: '25',
      category: 'general',
      volume: '',
    });
    expect(r).toHaveLength(6);

    // 25 lbs falls in the 21-90 lb tier, which the calculator deliberately
    // interpolates linearly between the standard formula's value at 21 lbs
    // ($12.13) and the oversize formula's value at 90 lbs ($89.98), rather
    // than applying the 90+ lb oversize formula directly (which would jump
    // discontinuously for any item under 90 lbs).
    // FBA fee: 12.13 + (25-21) * ((89.98-12.13)/69) = 16.64
    // 15% referral = $30
    // Net profit = 200 - 80 - 30 - 16.64 = 73.36
    near(parseNumber(getValue(r, 'netProfit')), 73.36, 0.1);
    near(parseNumber(getValue(r, 'fbaFee')), 16.64, 0.1);
  });

  it('handles very small item under 1 lb', () => {
    const r = config.calculate({
      sellingPrice: '15',
      productCost: '3',
      weight: '0.3',
      category: 'general',
      volume: '',
    });
    expect(r).toHaveLength(6);

    // FBA fee for <=1 lb = $3.22
    near(parseNumber(getValue(r, 'fbaFee')), 3.22);
  });

  it('handles jewelry category (20% referral)', () => {
    const r = config.calculate({
      sellingPrice: '500',
      productCost: '200',
      weight: '0.5',
      category: 'jewelry',
      volume: '',
    });
    expect(r).toHaveLength(6);

    // 20% of first $250 = 50, + 5% of the other $250 = 12.50
    near(parseNumber(getValue(r, 'referralFee')), 62.5);
  });

  it('handles apparel category (17% referral above $20)', () => {
    const r = config.calculate({
      sellingPrice: '80',
      productCost: '30',
      weight: '1.5',
      category: 'apparel',
      volume: '',
    });
    expect(r).toHaveLength(6);

    // 17% referral = $13.60
    near(parseNumber(getValue(r, 'referralFee')), 13.60);
    // FBA at 1.5 lbs = $4.18
    near(parseNumber(getValue(r, 'fbaFee')), 4.18);
  });

  it('handles 2-3 lb weight tier', () => {
    const r = config.calculate({
      sellingPrice: '50',
      productCost: '20',
      weight: '2.5',
      category: 'general',
      volume: '',
    });
    expect(r).toHaveLength(6);

    // FBA fee at 2-3 lb tier = $5.29
    near(parseNumber(getValue(r, 'fbaFee')), 5.29);
  });

  it('handles 3-21 lb weight tier with per-pound surcharge', () => {
    const r = config.calculate({
      sellingPrice: '75',
      productCost: '25',
      weight: '10',
      category: 'general',
      volume: '',
    });
    expect(r).toHaveLength(6);

    // FBA fee at 10 lbs: 5.29 + (10 - 3) * 0.38 = 5.29 + 2.66 = 7.95
    near(parseNumber(getValue(r, 'fbaFee')), 7.95, 0.01);
  });

  it('returns empty for zero price', () => {
    const r = config.calculate({
      sellingPrice: '0',
      productCost: '5',
      weight: '1',
      category: 'general',
      volume: '',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for zero weight', () => {
    const r = config.calculate({
      sellingPrice: '10',
      productCost: '5',
      weight: '0',
      category: 'general',
      volume: '',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for negative weight', () => {
    const r = config.calculate({
      sellingPrice: '10',
      productCost: '5',
      weight: '-1',
      category: 'general',
      volume: '',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for negative price', () => {
    const r = config.calculate({
      sellingPrice: '-10',
      productCost: '5',
      weight: '1',
      category: 'general',
      volume: '',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for NaN string inputs', () => {
    const r = config.calculate({
      sellingPrice: 'abc',
      productCost: '5',
      weight: '1',
      category: 'general',
      volume: '',
    });
    expect(r).toHaveLength(0);
  });

  it('handles Infinity as very large number (parseFloat allows Infinity through isNaN check)', () => {
    const r = config.calculate({
      sellingPrice: 'Infinity',
      productCost: '5',
      weight: '1',
      category: 'general',
      volume: '',
    });
    // non-finite input must never reach the results (contract: no NaN/Infinity)
    expect(r).toHaveLength(0);
  });

  it('returns empty for empty inputs', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty for missing required fields', () => {
    const r = config.calculate({
      sellingPrice: '29.99',
    });
    expect(r).toHaveLength(0);
  });

  it('handles zero product cost (free item scenario)', () => {
    const r = config.calculate({
      sellingPrice: '29.99',
      productCost: '0',
      weight: '1.2',
      category: 'general',
      volume: '',
    });
    expect(r).toHaveLength(6);
    // ROI should be 0 when cost is 0 (division by zero guard)
    expect(getValue(r, 'roi')).toContain('0.0%');
    // Net profit should equal price minus fees: 29.99 - 4.4985 - 4.18
    near(parseNumber(getValue(r, 'netProfit')), 21.31);
  });

  it('produces negative profit when fees exceed margin', () => {
    const r = config.calculate({
      sellingPrice: '10',
      productCost: '9',
      weight: '5',
      category: 'jewelry',
      volume: '',
    });
    expect(r).toHaveLength(6);
    // 20% referral = $2, FBA at 5 lbs = 5.29 + 2*0.38 = 6.05
    // (jewelry $10: 20% = 2.00) Total fees = 8.05, Net = 10 - 9 - 8.05 = -7.05 -- negative profit
    const np = parseNumber(getValue(r, 'netProfit'));
    expect(np).toBeLessThan(0);
  });

  describe('Educational content', () => {
    it('has formula defined', () => {
      expect(config.educational.formula).toBeTruthy();
    });

    it('has 3+ variables', () => {
      expect(config.educational.variables).toHaveLength(3);
    });

    it('has how-to-use instructions', () => {
      expect(config.educational.howToUse?.length).toBeGreaterThanOrEqual(4);
    });

    it('has explanation', () => {
      expect(config.educational.explanation).toBeTruthy();
      expect(config.educational.explanation.length).toBeGreaterThan(200);
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

    it('common uses has 4+ items', () => {
      expect(config.educational.commonUses?.length).toBeGreaterThanOrEqual(4);
    });

    it('all number inputs have inputMode defined', () => {
      for (const input of config.inputs) {
        if (input.type === 'number') {
          expect(input.inputMode).toBeTruthy();
        }
      }
    });
  });
});
