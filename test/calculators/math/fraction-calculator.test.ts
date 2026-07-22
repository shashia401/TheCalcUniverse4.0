import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/fraction/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Fraction Calculator', () => {
  // ── Addition ───────────────────────────────────────────────────────
  it('adds fractions: 3/4 + 1/3 = 13/12', () => {
    const r = config.calculate({ mode: 'add', aNum: '3', aDen: '4', bNum: '1', bDen: '3' });
    expect(getValue(r, 'result')).toBe('13/12');
  });

  it('adds fractions with same denominator', () => {
    const r = config.calculate({ mode: 'add', aNum: '1', aDen: '5', bNum: '2', bDen: '5' });
    expect(getValue(r, 'result')).toBe('3/5');
  });

  it('adds fractions resulting in whole number', () => {
    const r = config.calculate({ mode: 'add', aNum: '1', aDen: '2', bNum: '1', bDen: '2' });
    expect(getValue(r, 'result')).toBe('1');
  });

  it('adds negative fraction', () => {
    const r = config.calculate({ mode: 'add', aNum: '-1', aDen: '4', bNum: '2', bDen: '4' });
    expect(getValue(r, 'result')).toBe('1/4');
  });

  // ── Subtraction ────────────────────────────────────────────────────
  it('subtracts fractions: 3/4 − 1/4 = 1/2', () => {
    const r = config.calculate({ mode: 'subtract', aNum: '3', aDen: '4', bNum: '1', bDen: '4' });
    expect(getValue(r, 'result')).toBe('1/2');
  });

  it('subtracts with negative result', () => {
    const r = config.calculate({ mode: 'subtract', aNum: '1', aDen: '3', bNum: '2', bDen: '3' });
    expect(getValue(r, 'result')).toContain('-');
  });

  it('subtracts fractions with different denominators', () => {
    const r = config.calculate({ mode: 'subtract', aNum: '7', aDen: '8', bNum: '1', bDen: '4' });
    expect(getValue(r, 'result')).toBe('5/8');
  });

  // ── Multiplication ─────────────────────────────────────────────────
  it('multiplies fractions: 2/3 × 3/4 = 1/2', () => {
    const r = config.calculate({ mode: 'multiply', aNum: '2', aDen: '3', bNum: '3', bDen: '4' });
    expect(getValue(r, 'result')).toBe('1/2');
  });

  it('multiplies with zero numerator', () => {
    const r = config.calculate({ mode: 'multiply', aNum: '0', aDen: '5', bNum: '3', bDen: '4' });
    expect(getValue(r, 'result')).toBe('0');
  });

  it('multiplies negative fractions', () => {
    const r = config.calculate({ mode: 'multiply', aNum: '-1', aDen: '2', bNum: '3', bDen: '4' });
    expect(getValue(r, 'result')).toContain('-');
  });

  // ── Division ───────────────────────────────────────────────────────
  it('divides fractions: 2/3 ÷ 3/4 = 8/9', () => {
    const r = config.calculate({ mode: 'divide', aNum: '2', aDen: '3', bNum: '3', bDen: '4' });
    expect(getValue(r, 'result')).toBe('8/9');
  });

  it('divides by a fraction results in larger number', () => {
    const r = config.calculate({ mode: 'divide', aNum: '6', aDen: '1', bNum: '1', bDen: '2' });
    expect(getValue(r, 'result')).toBe('12');
  });

  // ── Simplification ─────────────────────────────────────────────────
  it('returns integer result when denominator simplifies to 1', () => {
    const r = config.calculate({ mode: 'add', aNum: '1', aDen: '2', bNum: '1', bDen: '2' });
    expect(getValue(r, 'result')).toBe('1');
  });

  it('simplifies result using GCD', () => {
    const r = config.calculate({ mode: 'add', aNum: '1', aDen: '4', bNum: '2', bDen: '4' });
    expect(getValue(r, 'result')).toBe('3/4');
  });

  // ── Decimal equivalent ─────────────────────────────────────────────
  it('returns decimal equivalent', () => {
    const r = config.calculate({ mode: 'add', aNum: '1', aDen: '2', bNum: '1', bDen: '4' });
    near(parseFloat(getValue(r, 'decimal')), 0.75);
  });

  it('decimal for repeating fraction is correct', () => {
    const r = config.calculate({ mode: 'add', aNum: '1', aDen: '3', bNum: '0', bDen: '1' });
    const dec = parseFloat(getValue(r, 'decimal'));
    near(dec, 0.3333, 0.001);
  });

  // ── Validation ────────────────────────────────────────────────────
  it('returns empty for zero denominator', () => {
    const r = config.calculate({ mode: 'add', aNum: '1', aDen: '0', bNum: '1', bDen: '3' });
    expect(r).toEqual([]);
  });

  it('returns empty for negative denominator', () => {
    const r = config.calculate({ mode: 'add', aNum: '1', aDen: '-1', bNum: '1', bDen: '3' });
    expect(r).toEqual([]);
  });

  it('treats NaN numerator as zero (parseInt fallback)', () => {
    const r = config.calculate({ mode: 'add', aNum: 'abc', aDen: '4', bNum: '1', bDen: '3' });
    // parseInt("abc") returns NaN, which falls back to 0 via || 0
    expect(getValue(r, 'result')).toBe('1/3');
  });

  it('returns empty for division by zero (bNum=0)', () => {
    const r = config.calculate({ mode: 'divide', aNum: '1', aDen: '2', bNum: '0', bDen: '3' });
    expect(r).toEqual([]);
  });

  // ── Operation display ──────────────────────────────────────────────
  it('shows operation correctly for add', () => {
    const r = config.calculate({ mode: 'add', aNum: '3', aDen: '4', bNum: '1', bDen: '3' });
    expect(getValue(r, 'operation')).toContain('+');
  });

  it('shows operation correctly for divide', () => {
    const r = config.calculate({ mode: 'divide', aNum: '3', aDen: '4', bNum: '1', bDen: '3' });
    expect(getValue(r, 'operation')).toContain('÷');
  });

  it('shows simplified value for all operations', () => {
    const r = config.calculate({ mode: 'multiply', aNum: '2', aDen: '3', bNum: '3', bDen: '4' });
    expect(getValue(r, 'simplified')).toBeTruthy();
  });

  // ── Educational content ──────────────────────────────────────────
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

  it('all number inputs have inputMode defined', () => {
    for (const input of config.inputs) {
      if (input.type === 'number') {
        expect(input.inputMode).toBeDefined();
      }
    }
  });
});
