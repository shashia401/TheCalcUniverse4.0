import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/roi/index';
import { getValue, parseNumber } from '../../helpers';

describe('ROI calculator', () => {
  // ── Basic ROI calculation ────────────────────────────────────────────
  it('calculates basic positive ROI', () => {
    const r = config.calculate({
      amountInvested: '10000',
      amountReturned: '15000',
      years: '',
    });
    const roi = getValue(r, 'roi');
    expect(roi).toContain('+');
    expect(roi).toContain('%');
    expect(parseNumber(roi)).toBeCloseTo(50, 0);
  });

  it('shows net profit in dollars', () => {
    const r = config.calculate({
      amountInvested: '10000',
      amountReturned: '15000',
      years: '',
    });
    const profit = getValue(r, 'netProfit');
    expect(profit).toContain('+');
    expect(profit).toContain('$');
    expect(parseNumber(profit)).toBeCloseTo(5000, 0);
  });

  it('shows investment multiplier', () => {
    const r = config.calculate({
      amountInvested: '10000',
      amountReturned: '20000',
      years: '',
    });
    const mult = getValue(r, 'multiplier');
    expect(mult).toContain('x');
    expect(parseNumber(mult)).toBeCloseTo(2, 1);
  });

  // ── Negative ROI (losses) ────────────────────────────────────────────
  it('shows negative ROI for losses', () => {
    const r = config.calculate({
      amountInvested: '10000',
      amountReturned: '8000',
      years: '',
    });
    expect(getValue(r, 'roi')).toContain('-');
    expect(getValue(r, 'netProfit')).toContain('-');
  });

  it('shows negative ROI percentage near -20% for 20% loss', () => {
    const r = config.calculate({
      amountInvested: '10000',
      amountReturned: '8000',
      years: '',
    });
    expect(parseNumber(getValue(r, 'roi'))).toBeCloseTo(-20, 0);
  });

  it('shows net loss dollar amount', () => {
    const r = config.calculate({
      amountInvested: '5000',
      amountReturned: '3500',
      years: '',
    });
    const profit = getValue(r, 'netProfit');
    expect(profit).toContain('-');
    expect(Math.abs(parseNumber(profit))).toBeCloseTo(1500, 0);
  });

  // ── Break-even ───────────────────────────────────────────────────────
  it('shows 0% ROI for break-even', () => {
    const r = config.calculate({
      amountInvested: '10000',
      amountReturned: '10000',
      years: '',
    });
    expect(parseNumber(getValue(r, 'roi'))).toBeCloseTo(0, 0);
    expect(getValue(r, 'multiplier')).toContain('1.00');
  });

  // ── Annualized ROI (CAGR) ────────────────────────────────────────────
  it('calculates annualized ROI over 5 years', () => {
    const r = config.calculate({
      amountInvested: '10000',
      amountReturned: '20000',
      years: '5',
    });
    const annualized = parseNumber(getValue(r, 'annualizedRoi'));
    // (2)^(1/5) - 1 ≈ 14.87%
    expect(annualized).toBeGreaterThan(13);
    expect(annualized).toBeLessThan(16);
  });

  it('calculates annualized ROI over 10 years', () => {
    const r = config.calculate({
      amountInvested: '10000',
      amountReturned: '25937',
      years: '10',
    });
    const annualized = parseNumber(getValue(r, 'annualizedRoi'));
    // Should be close to 10% CAGR
    expect(annualized).toBeCloseTo(10, 0);
  });

  it('shows holding period in results when years provided', () => {
    const r = config.calculate({
      amountInvested: '10000',
      amountReturned: '15000',
      years: '7.5',
    });
    const hp = getValue(r, 'holdingPeriod');
    expect(hp).toContain('7.5');
    expect(hp).toContain('years');
  });

  it('uses singular "year" for 1-year holding period', () => {
    const r = config.calculate({
      amountInvested: '10000',
      amountReturned: '12000',
      years: '1',
    });
    const hp = getValue(r, 'holdingPeriod');
    expect(hp).toBe('1 year');
  });

  it('does not show annualized ROI when years is not provided', () => {
    const r = config.calculate({
      amountInvested: '10000',
      amountReturned: '15000',
      years: '',
    });
    const ids = r.map((x) => x.id);
    expect(ids).not.toContain('annualizedRoi');
    expect(ids).not.toContain('holdingPeriod');
  });

  it('handles fractional years correctly', () => {
    const r = config.calculate({
      amountInvested: '10000',
      amountReturned: '11000',
      years: '0.5',
    });
    const annualized = parseNumber(getValue(r, 'annualizedRoi'));
    // (1.1)^(2) - 1 = 0.21 → 21%
    expect(annualized).toBeGreaterThan(18);
    expect(annualized).toBeLessThan(24);
  });

  // ── Precision tests ──────────────────────────────────────────────────
  it('handles decimal amounts correctly', () => {
    const r = config.calculate({
      amountInvested: '1234.56',
      amountReturned: '2345.67',
      years: '',
    });
    const roi = parseNumber(getValue(r, 'roi'));
    // (2345.67 - 1234.56) / 1234.56 ≈ 90.00%
    expect(roi).toBeGreaterThan(89);
    expect(roi).toBeLessThan(91);
  });

  it('handles large investment amounts', () => {
    const r = config.calculate({
      amountInvested: '1000000',
      amountReturned: '2500000',
      years: '3',
    });
    expect(parseNumber(getValue(r, 'roi'))).toBeCloseTo(150, 0);
    expect(getValue(r, 'multiplier')).toContain('2.50');
  });

  // ── Error handling / edge cases ──────────────────────────────────────
  it('returns empty array for zero investment', () => {
    const r = config.calculate({
      amountInvested: '0',
      amountReturned: '100',
      years: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for negative investment', () => {
    const r = config.calculate({
      amountInvested: '-100',
      amountReturned: '200',
      years: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for NaN inputs', () => {
    const r = config.calculate({
      amountInvested: 'abc',
      amountReturned: '100',
      years: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for missing input values', () => {
    const r = config.calculate({
      amountInvested: '',
      amountReturned: '',
      years: '',
    });
    expect(r).toEqual([]);
  });

  it('handles zero net profit correctly', () => {
    const r = config.calculate({
      amountInvested: '500',
      amountReturned: '0',
      years: '',
    });
    // ROI should be -100% (total loss)
    expect(parseNumber(getValue(r, 'roi'))).toBeCloseTo(-100, 0);
  });

  it('returns empty for missing amountReturned', () => {
    const r = config.calculate({
      amountInvested: '1000',
      amountReturned: '',
      years: '',
    });
    expect(r).toEqual([]);
  });

  // ── Educational content ──────────────────────────────────────────────
  it('has educational content', () => {
    expect(config.educational).toBeDefined();
    expect(config.educational.faqs).toBeDefined();
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(4);
    expect(config.educational.variables).toBeDefined();
    expect(config.educational.variables!.length).toBeGreaterThanOrEqual(5);
    expect(config.educational.workedExamples).toBeDefined();
    expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.proTips).toBeDefined();
    expect(config.educational.proTips!.length).toBeGreaterThanOrEqual(4);
    expect(config.educational.limitations).toBeDefined();
    expect(config.educational.limitations!.length).toBeGreaterThanOrEqual(3);
  });

  it('has explanation text', () => {
    expect(config.educational.explanation).toBeDefined();
    const explanation = config.educational.explanation!;
    expect(explanation.length).toBeGreaterThan(500);
  });

  it('has formula description', () => {
    expect(config.educational.formulaDescription).toBeDefined();
  });

  // ── Input field structure ────────────────────────────────────────────
  it('has all required inputs with helpText', () => {
    const inputs = config.inputs;
    expect(inputs.length).toBeGreaterThanOrEqual(3);
    inputs.forEach((input) => {
      expect(input.helpText).toBeDefined();
      expect(input.helpText!.length).toBeGreaterThan(10);
    });
  });

  it('has inputMode decimal on numeric inputs', () => {
    const numericInputs = config.inputs.filter((i) => i.type === 'number');
    numericInputs.forEach((input) => {
      expect(input.inputMode).toBe('decimal');
    });
  });
});
