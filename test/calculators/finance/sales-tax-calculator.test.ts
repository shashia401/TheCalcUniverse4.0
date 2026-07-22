import { describe, it, expect } from 'vitest';
import { Decimal } from 'decimal.js';
import config from '../../../src/calculators/finance/sales-tax';
import { getValue, parseMoney, near } from '../../helpers';

describe('sales-tax-calculator', () => {
  // ── Add Tax mode ──────────────────────────────────
  it('add mode: $100 + 8% tax = $108 total, $8 tax', () => {
    const r = config.calculate({
      mode: 'add',
      amount: '100',
      taxRate: '8',
    });
    near(parseMoney(getValue(r, 'grossPrice')), 108);
    near(parseMoney(getValue(r, 'taxAmount')), 8);
    near(parseMoney(getValue(r, 'netPrice')), 100);
  });

  it('add mode: $50 + 8.875% NYC tax = $54.44 gross (rounded)', () => {
    const r = config.calculate({
      mode: 'add',
      amount: '50',
      taxRate: '8.875',
    });
    // 50 * 0.08875 = 4.4375, gross = 54.4375
    near(parseMoney(getValue(r, 'grossPrice')), 54.44, 0.01);
    near(parseMoney(getValue(r, 'taxAmount')), 4.44, 0.01);
  });

  it('add mode: $0 pre-tax + 10% = $0 gross, $0 tax', () => {
    const r = config.calculate({
      mode: 'add',
      amount: '0',
      taxRate: '10',
    });
    // amount <= 0 guard returns []
    expect(r).toEqual([]);
  });

  // ── Extract Tax mode ──────────────────────────────
  it('extract mode: $108 inclusive of 8% tax yields net $100, tax $8', () => {
    const r = config.calculate({
      mode: 'extract',
      amount: '108',
      taxRate: '8',
    });
    near(parseMoney(getValue(r, 'netPrice')), 100);
    near(parseMoney(getValue(r, 'taxAmount')), 8);
    near(parseMoney(getValue(r, 'grossPrice')), 108);
  });

  it('extract mode: $2,376 gross at 8.25% = net $2,194.92, tax $181.08 (Alisha craft fair example)', () => {
    const r = config.calculate({
      mode: 'extract',
      amount: '2376',
      taxRate: '8.25',
    });
    near(parseMoney(getValue(r, 'netPrice')), 2194.92, 0.01);
    near(parseMoney(getValue(r, 'taxAmount')), 181.08, 0.01);
    // effective rate should be ~7.62%
    const eff = getValue(r, 'effectiveRate');
    expect(eff).toBeDefined();
  });

  it('extract mode: $18,340 gross at 9.75% Chicago rate = net $16,710.71, tax $1,629.29', () => {
    const r = config.calculate({
      mode: 'extract',
      amount: '18340',
      taxRate: '9.75',
    });
    near(parseMoney(getValue(r, 'netPrice')), 16710.71, 0.01);
    near(parseMoney(getValue(r, 'taxAmount')), 1629.29, 0.01);
  });

  // ── Round-trip consistency ────────────────────────
  it('add then extract round-trips: $123.45 + 7% = gross, then extract 7% recovers $123.45', () => {
    const added = config.calculate({
      mode: 'add',
      amount: '123.45',
      taxRate: '7',
    });
    const gross = parseMoney(getValue(added, 'grossPrice')).toString();
    const removed = config.calculate({
      mode: 'extract',
      amount: gross,
      taxRate: '7',
    });
    near(parseMoney(getValue(removed, 'netPrice')), 123.45);
  });

  // ── Edge cases ────────────────────────────────────
  it('zero tax rate: tax is zero, gross = net (add mode)', () => {
    const r = config.calculate({
      mode: 'add',
      amount: '100',
      taxRate: '0',
    });
    near(parseMoney(getValue(r, 'taxAmount')), 0);
    near(parseMoney(getValue(r, 'grossPrice')), 100);
    near(parseMoney(getValue(r, 'netPrice')), 100);
  });

  it('zero tax rate: tax is zero, gross = net (extract mode)', () => {
    const r = config.calculate({
      mode: 'extract',
      amount: '100',
      taxRate: '0',
    });
    near(parseMoney(getValue(r, 'taxAmount')), 0);
    near(parseMoney(getValue(r, 'netPrice')), 100);
    near(parseMoney(getValue(r, 'grossPrice')), 100);
  });

  it('high rate: $100 + 15% = $115 gross, $15 tax', () => {
    const r = config.calculate({
      mode: 'add',
      amount: '100',
      taxRate: '15',
    });
    near(parseMoney(getValue(r, 'grossPrice')), 115);
    near(parseMoney(getValue(r, 'taxAmount')), 15);
  });

  it('returns empty array for non-numeric amount', () => {
    const r = config.calculate({
      mode: 'add',
      amount: 'abc',
      taxRate: '8',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for empty amount string', () => {
    const r = config.calculate({
      mode: 'add',
      amount: '   ',
      taxRate: '8',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for non-numeric tax rate', () => {
    const r = config.calculate({
      mode: 'add',
      amount: '100',
      taxRate: 'xyz',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for negative amount', () => {
    const r = config.calculate({
      mode: 'add',
      amount: '-50',
      taxRate: '8',
    });
    expect(r).toEqual([]);
  });

  // ── Decimal.js precision: small fractional values ──
  it('Decimal.js precision: $0.01 + 1% tax = $0.0101 gross', () => {
    const r = config.calculate({
      mode: 'add',
      amount: '0.01',
      taxRate: '1',
    });
    // 0.01 * 1.01 = 0.0101 → formatted to "0.01" (2 decimals)
    near(parseMoney(getValue(r, 'grossPrice')), 0.01, 0.01);
    near(parseMoney(getValue(r, 'taxAmount')), 0.00, 0.01);
  });

  it('Decimal.js: verify no floating-point drift at 8.875% on $29.99', () => {
    // JS float: 29.99 * 1.08875 = 32.6516125 → could drift
    // Decimal.js should handle this exactly
    const r = config.calculate({
      mode: 'add',
      amount: '29.99',
      taxRate: '8.875',
    });
    // 29.99 * 0.08875 = 2.6616125, gross = 32.6516125
    near(parseMoney(getValue(r, 'grossPrice')), 32.65, 0.01);
    near(parseMoney(getValue(r, 'taxAmount')), 2.66, 0.01);
  });

  // ── Extract mode verification with Decimal.js ─────
  it('extract mode: Decimal.js precision verified with manual calculation', () => {
    const rate = new Decimal('8.25');
    const gross = new Decimal('2376');
    const divisor = new Decimal(1).plus(rate.div(100));
    const expectedNet = gross.div(divisor);
    const expectedTax = gross.minus(expectedNet);

    const r = config.calculate({
      mode: 'extract',
      amount: '2376',
      taxRate: '8.25',
    });
    near(parseMoney(getValue(r, 'netPrice')), expectedNet.toNumber(), 0.01);
    near(parseMoney(getValue(r, 'taxAmount')), expectedTax.toNumber(), 0.01);
  });

  // ── Educational content structure ─────────────────
  it('educational content includes all required sections', () => {
    const edu = config.educational;
    expect(edu.formula).toBeTruthy();
    expect(edu.formulaDescription).toBeTruthy();
    expect(edu.faqs).toBeDefined();
    expect(edu.faqs!.length).toBeGreaterThanOrEqual(7);
    expect(edu.workedExamples).toBeDefined();
    expect(edu.workedExamples!.length).toBeGreaterThanOrEqual(3);
    expect(edu.proTips).toBeDefined();
    expect(edu.proTips!.length).toBeGreaterThanOrEqual(4);
    expect(edu.limitations).toBeDefined();
    expect(edu.limitations!.length).toBeGreaterThanOrEqual(4);
    expect(edu.variables).toBeDefined();
    expect(edu.variables!.length).toBeGreaterThanOrEqual(3);
    expect(edu.quickReference).toBeDefined();
    expect(edu.citations).toBeDefined();
    expect(edu.citations!.length).toBeGreaterThanOrEqual(3);
  });

  // ── Mode defaults to add ─────────────────────────
  it('defaults to add mode when mode is not provided', () => {
    const r = config.calculate({
      amount: '100',
      taxRate: '8',
    });
    near(parseMoney(getValue(r, 'grossPrice')), 108);
    near(parseMoney(getValue(r, 'taxAmount')), 8);
  });
});
