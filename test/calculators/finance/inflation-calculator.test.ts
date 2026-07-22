import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import config from '../../../src/calculators/finance/inflation/index';
import { getValue, parseNumber, parseMoney, near } from '../../helpers';
import { CPI_DATA, MIN_YEAR, MAX_YEAR } from '../../../src/calculators/finance/inflation/cpiData';

describe('inflation-calculator', () => {
  // ── Basic forward inflation ───────────────────────────────────────────
  it('adjusts amount forward in time', () => {
    const r = config.calculate({
      amount: '100',
      startYear: '1990',
      endYear: '2020',
    });
    expect(r).toHaveLength(6);
    // CPI in 1990 = 130.7, CPI in 2020 = 258.8
    // adjustedAmount = 100 / 130.7 * 258.8 ≈ 198.01
    expect(parseMoney(getValue(r, 'adjustedAmount'))).toBeGreaterThan(100);
    expect(parseNumber(getValue(r, 'cumulativeRate'))).toBeGreaterThan(0);
    expect(parseNumber(getValue(r, 'avgAnnualRate'))).toBeGreaterThan(0);
  });

  // ── Edge cases: zero amount ──────────────────────────────────────────
  it('returns empty for zero amount', () => {
    const r = config.calculate({
      amount: '0',
      startYear: '1990',
      endYear: '2020',
    });
    expect(r).toHaveLength(0);
  });

  // ── Edge cases: NaN guards ───────────────────────────────────────────
  it('returns empty for missing required fields', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty for non-numeric amount', () => {
    expect(config.calculate({ amount: 'abc', startYear: '2000', endYear: '2020' })).toHaveLength(0);
  });

  it('returns empty for negative amount', () => {
    expect(config.calculate({ amount: '-50', startYear: '2000', endYear: '2020' })).toHaveLength(0);
  });

  it('returns empty for invalid year (not in CPI data)', () => {
    expect(config.calculate({ amount: '100', startYear: '1800', endYear: '2020' })).toHaveLength(0);
  });

  it('returns empty for NaN years', () => {
    expect(config.calculate({ amount: '100', startYear: 'not-a-year', endYear: '2020' })).toHaveLength(0);
  });

  // ── Backward inflation (past purchasing power) ────────────────────────
  it('adjusts amount backward in time (past purchasing power)', () => {
    const r = config.calculate({
      amount: '100',
      startYear: '2020',
      endYear: '1990',
    });
    expect(r).toHaveLength(6);
    // $100 in 2020 was worth less in 1990 (inverted)
    expect(getValue(r, 'adjustedAmount')).toBeTruthy();
    // Cumulative inflation should be negative for reverse
    expect(parseNumber(getValue(r, 'cumulativeRate'))).toBeLessThan(0);
  });

  // ── Same year ────────────────────────────────────────────────────────
  it('shows zero inflation for same year', () => {
    const r = config.calculate({
      amount: '100',
      startYear: '2000',
      endYear: '2000',
    });
    expect(r).toHaveLength(6);
    near(parseMoney(getValue(r, 'adjustedAmount')), 100);
    near(parseNumber(getValue(r, 'cumulativeRate')), 0);
    near(parseNumber(getValue(r, 'avgAnnualRate')), 0);
  });

  // ── Large amounts ────────────────────────────────────────────────────
  it('handles large amounts', () => {
    const r = config.calculate({
      amount: '1000000',
      startYear: '1980',
      endYear: '2000',
    });
    expect(r).toHaveLength(6);
    expect(parseMoney(getValue(r, 'adjustedAmount'))).toBeGreaterThan(1000000);
  });

  // ── Purchasing power indicator ───────────────────────────────────────
  it('shows purchasing power indicator', () => {
    const r = config.calculate({
      amount: '100',
      startYear: '2000',
      endYear: '2020',
    });
    expect(getValue(r, 'purchasingPower')).toContain('%');
  });

  // ── Decimal.js precision ─────────────────────────────────────────────
  it('uses Decimal.js for monetary arithmetic', () => {
    // Verify the adjusted amount is computed with Decimal-level precision
    // by checking a specific CPI ratio
    const r = config.calculate({
      amount: '100',
      startYear: '1980',
      endYear: '2020',
    });
    const cpi1980 = CPI_DATA[1980];
    const cpi2020 = CPI_DATA[2020];
    const expectedDec = new Decimal(100).div(cpi1980).mul(cpi2020);
    const adjusted = parseMoney(getValue(r, 'adjustedAmount'));
    near(adjusted, expectedDec.toNumber(), 0.02);
  });

  // ── CPI result rows ─────────────────────────────────────────────────
  it('shows CPI values for both years', () => {
    const r = config.calculate({
      amount: '100',
      startYear: '2000',
      endYear: '2020',
    });
    const cpiStart = getValue(r, 'cpiStart');
    const cpiEnd = getValue(r, 'cpiEnd');
    expect(parseFloat(cpiStart)).toBeGreaterThan(0);
    expect(parseFloat(cpiEnd)).toBeGreaterThan(0);
    expect(parseFloat(cpiEnd)).toBeGreaterThan(parseFloat(cpiStart));
  });

  // ── valid range ──────────────────────────────────────────────────────
  it('works for earliest valid year', () => {
    const r = config.calculate({
      amount: '100',
      startYear: String(MIN_YEAR),
      endYear: String(MAX_YEAR),
    });
    expect(r).toHaveLength(6);
    expect(parseMoney(getValue(r, 'adjustedAmount'))).toBeGreaterThan(100);
  });

  // ── Default year fallback ────────────────────────────────────────────
  it('uses default year fallback when startYear is empty', () => {
    const r = config.calculate({
      amount: '100',
      startYear: '',
      endYear: '2020',
    });
    expect(r).toHaveLength(6);
    expect(getValue(r, 'cpiStart')).toBeTruthy();
    expect(getValue(r, 'cpiEnd')).toBeTruthy();
  });

  // ── Config structure ─────────────────────────────────────────────────
  it('has complete educational content', () => {
    const edu = config.educational;
    expect(edu).toBeDefined();
    expect(edu.formula).toBeTruthy();
    expect(edu.formulaDescription).toBeTruthy();
    expect(edu.formulaSource).toBeTruthy();
    expect(edu.variables).toBeDefined();
    expect(edu.variables!.length).toBeGreaterThanOrEqual(3);
    expect(edu.faqs).toBeDefined();
    expect(edu.faqs!.length).toBeGreaterThanOrEqual(5);
    expect(edu.howToUse).toBeDefined();
    expect(edu.howToUse!.length).toBeGreaterThanOrEqual(3);
    expect(edu.workedExamples).toBeDefined();
    expect(edu.workedExamples!.length).toBeGreaterThanOrEqual(2);
    expect(edu.proTips).toBeDefined();
    expect(edu.proTips!.length).toBeGreaterThanOrEqual(4);
    expect(edu.limitations).toBeDefined();
    expect(edu.limitations!.length).toBeGreaterThanOrEqual(3);
  });

  // ── Input config ─────────────────────────────────────────────────────
  it('has three inputs all with helpText', () => {
    const inputs = config.inputs;
    expect(inputs).toHaveLength(3);
    for (const inp of inputs) {
      expect(inp.helpText).toBeTruthy();
    }
  });

  it('sets inputMode on the number field', () => {
    const amountInput = config.inputs[0];
    expect(amountInput.type).toBe('number');
    expect(amountInput.inputMode).toBe('decimal');
  });

  it('has default values for all required inputs', () => {
    for (const inp of config.inputs) {
      if (inp.required) {
        const hasDefault = inp.defaultValue !== undefined || inp.placeholder !== undefined || inp.type === 'select';
        expect(hasDefault).toBe(true);
      }
    }
  });
});
