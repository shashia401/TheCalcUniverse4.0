import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/exponent/index';
import { getValue, getResult, parseNumber, near } from '../../helpers';

describe('Exponent Calculator', () => {
  // ── Basic exponentiation ──────────────────────────────────────────
  it('2^5 = 32', () => {
    const r = config.calculate({ base: '2', exponent: '5' });
    near(parseNumber(getValue(r, 'result')), 32);
  });

  it('shows expanded form for positive integer exponent', () => {
    const r = config.calculate({ base: '2', exponent: '5' });
    const expanded = getValue(r, 'expandedForm');
    expect(expanded).toContain('2 × 2 × 2 × 2 × 2');
  });

  it('handles negative exponent — 2^-3 = 0.125', () => {
    const r = config.calculate({ base: '2', exponent: '-3' });
    near(parseNumber(getValue(r, 'result')), 0.125);
  });

  it('shows fraction conversion for negative exponent', () => {
    const r = config.calculate({ base: '2', exponent: '-3' });
    const frac = getValue(r, 'fractionForm');
    expect(frac).toContain('1');
  });

  it('handles fractional exponent — 9^0.5 = 3', () => {
    const r = config.calculate({ base: '9', exponent: '0.5' });
    near(parseNumber(getValue(r, 'result')), 3);
  });

  // ── Edge cases & validation ───────────────────────────────────────
  it('returns empty for NaN base input', () => {
    const r = config.calculate({ base: 'abc', exponent: '2' });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN exponent input', () => {
    const r = config.calculate({ base: '5', exponent: 'xyz' });
    expect(r).toEqual([]);
  });

  it('returns empty for missing inputs', () => {
    const r = config.calculate({ base: '', exponent: '' });
    expect(r).toEqual([]);
  });

  it('0^0 returns "Undefined" with explanation', () => {
    const r = config.calculate({ base: '0', exponent: '0' });
    expect(r.length).toBeGreaterThan(0);
    const result = getValue(r, 'result');
    expect(result).toBe('Undefined');
  });

  it('negative base with non-integer exponent returns complex', () => {
    const r = config.calculate({ base: '-2', exponent: '0.5' });
    const result = getValue(r, 'result');
    expect(result).toContain('Complex');
  });

  it('negative base with integer exponent works fine', () => {
    const r = config.calculate({ base: '-2', exponent: '3' });
    near(parseNumber(getValue(r, 'result')), -8);
  });

  it('zero exponent gives 1 for non-zero base', () => {
    const r = config.calculate({ base: '5', exponent: '0' });
    near(parseNumber(getValue(r, 'result')), 1);
  });

  it('zero exponent gives 1 for negative base', () => {
    const r = config.calculate({ base: '-7', exponent: '0' });
    near(parseNumber(getValue(r, 'result')), 1);
  });

  it('exponent of 1 returns the base itself', () => {
    const r = config.calculate({ base: '42', exponent: '1' });
    near(parseNumber(getValue(r, 'result')), 42);
  });

  // ── Output fields ─────────────────────────────────────────────────
  it('returns result, inverse, reciprocal, and squaredCheck fields', () => {
    const r = config.calculate({ base: '3', exponent: '4' });
    expect(getValue(r, 'result')).toBeTruthy();
    expect(getValue(r, 'inverse')).toBeTruthy();
    expect(getValue(r, 'reciprocal')).toBeTruthy();
    expect(getValue(r, 'squaredCheck')).toBeTruthy();
  });

  it('squaredCheck computes base × base', () => {
    const r = config.calculate({ base: '7', exponent: '3' });
    near(parseNumber(getValue(r, 'squaredCheck')), 49);
  });

  it('handles large exponent with scientific notation', () => {
    const r = config.calculate({ base: '10', exponent: '9' });
    near(parseNumber(getValue(r, 'result')), 1e9);
  });

  it('expanded form for negative exponent shows fraction', () => {
    const r = config.calculate({ base: '5', exponent: '-2' });
    const expanded = r.find(x => x.id === 'expandedForm');
    expect(expanded).toBeTruthy();
    expect(expanded!.value).toContain('1');
  });

  it('shows product rule breakdown for larger integer exponents', () => {
    const r = config.calculate({ base: '2', exponent: '8' });
    const identity = r.find(x => x.id === 'exponentIdentity');
    expect(identity).toBeTruthy();
  });

  it('handles decimal exponent like e^1.5', () => {
    const r = config.calculate({ base: '2.71828', exponent: '1.5' });
    const val = parseNumber(getValue(r, 'result'));
    expect(val).toBeGreaterThan(4);
    expect(val).toBeLessThan(5);
  });

  it('handles negative decimal exponent', () => {
    const r = config.calculate({ base: '10', exponent: '-2.5' });
    const val = parseNumber(getValue(r, 'result'));
    near(val, 0.00316, 0.001);
  });

  it('very small result gets scientific notation', () => {
    const r = config.calculate({ base: '10', exponent: '-6' });
    const sci = r.find(x => x.id === 'sciNotation');
    expect(sci).toBeTruthy();
  });

  it('reciprocal is 1/result for non-zero', () => {
    const r = config.calculate({ base: '4', exponent: '2' });
    const reciprocal = parseNumber(getValue(r, 'reciprocal'));
    const result = parseNumber(getValue(r, 'result'));
    near(reciprocal, 1 / result);
  });

  // ── New feature tests ─────────────────────────────────────────────
  it('handles large positive result with Infinity', () => {
    const r = config.calculate({ base: '10', exponent: '1000' });
    const result = getValue(r, 'result');
    expect(result).toContain('Infinity');
  });

  it('negative base with odd-denominator rational exponent gives real result', () => {
    const r = config.calculate({ base: '-8', exponent: '0.3333333333333333' });
    const val = parseNumber(getValue(r, 'result'));
    near(val, -2, 0.01);
  });

  it('base 1 returns 1 for any exponent', () => {
    const r = config.calculate({ base: '1', exponent: '100' });
    near(parseNumber(getValue(r, 'result')), 1);
  });

  it('includes educational content fields', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.explanation).toBeTruthy();
    expect(config.educational.workedExamples).toBeTruthy();
    expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.faqs).toBeTruthy();
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
    expect(config.educational.proTips).toBeTruthy();
    expect(config.educational.proTips!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.quickReference).toBeTruthy();
    expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(5);
  });

  it('has limitations with real content', () => {
    expect(config.educational.limitations.length).toBeGreaterThan(0);
    expect(config.educational.limitations.every((l: string) => l.length > 20)).toBe(true);
  });

  it('all inputs have inputMode defined', () => {
    for (const input of config.inputs) {
      if (input.type === 'number') {
        expect(input.inputMode).toBeDefined();
      }
    }
  });
});
