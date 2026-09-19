import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/lcm/index';
import { getValue, parseNumber } from '../../helpers';

describe('LCM calculator', () => {
  // ── Core Calculations ──────────────────────────────────────────────
  it('LCM of 12 and 18 = 36', () => {
    const r = config.calculate({ numbers: '12, 18' });
    expect(getValue(r, 'result')).toBe('36');
  });

  it('LCM of 4 and 6 = 12', () => {
    const r = config.calculate({ numbers: '4, 6' });
    expect(getValue(r, 'result')).toBe('12');
  });

  it('LCM of 7 and 5 = 35 (coprime)', () => {
    const r = config.calculate({ numbers: '7, 5' });
    expect(getValue(r, 'result')).toBe('35');
  });

  it('LCM of 8 and 12 = 24', () => {
    const r = config.calculate({ numbers: '8, 12' });
    expect(getValue(r, 'result')).toBe('24');
  });

  it('LCM of 3 and 6 = 6 (one is multiple of other)', () => {
    const r = config.calculate({ numbers: '3, 6' });
    expect(getValue(r, 'result')).toBe('6');
  });

  it('LCM of co-prime pair: 7 and 8 = 56', () => {
    const r = config.calculate({ numbers: '7, 8' });
    expect(getValue(r, 'result')).toBe('56');
  });

  it('LCM of large numbers', () => {
    const r = config.calculate({ numbers: '99, 100' });
    expect(getValue(r, 'result')).toBe('9900');
  });

  // ── Three or More Numbers ───────────────────────────────────────────
  it('LCM works with three numbers: 2, 3, 4 = 12', () => {
    const r = config.calculate({ numbers: '2, 3, 4' });
    expect(getValue(r, 'result')).toBe('12');
  });

  it('LCM of 6, 8, 10 = 120', () => {
    const r = config.calculate({ numbers: '6, 8, 10' });
    expect(getValue(r, 'result')).toBe('120');
  });

  it('LCM of four numbers: 2, 3, 4, 5 = 60', () => {
    const r = config.calculate({ numbers: '2, 3, 4, 5' });
    expect(getValue(r, 'result')).toBe('60');
  });

  it('LCM with spaces between numbers', () => {
    const r = config.calculate({ numbers: '12 18 24' });
    expect(getValue(r, 'result')).toBe('72');
  });

  // ── Data for Extra Panel ────────────────────────────────────────────
  it('LCM includes prime factorization data', () => {
    const r = config.calculate({ numbers: '12, 18' });
    expect(getValue(r, '_primeData')).toContain('factor');
    expect(getValue(r, '_primeData')).toContain('factor');
  });

  it('LCM includes multiples data', () => {
    const r = config.calculate({ numbers: '12, 18' });
    expect(getValue(r, '_multiplesData')).toContain('multiplesA');
    expect(getValue(r, '_multiplesData')).toContain('multiplesA');
  });

  it('LCM includes inputNums data', () => {
    const r = config.calculate({ numbers: '12, 18, 24' });
    expect(getValue(r, '_inputNums')).toContain('12');
    expect(getValue(r, '_inputNums')).toContain('24');
  });

  it('LCM shows GCD of first two numbers', () => {
    const r = config.calculate({ numbers: '12, 18' });
    expect(getValue(r, 'gcdValue')).toBe('6');
  });

  it('LCM shows formula reference', () => {
    const r = config.calculate({ numbers: '12, 18' });
    expect(getValue(r, 'lcmFormula')).toContain('LCM');
    expect(getValue(r, 'lcmFormula')).toContain('GCD');
  });

  // ── Invalid Inputs ──────────────────────────────────────────────────
  it('returns empty for single number', () => {
    expect(config.calculate({ numbers: '5' })).toEqual([]);
  });

  it('returns empty for empty input', () => {
    expect(config.calculate({ numbers: '' })).toEqual([]);
  });

  it('returns empty for whitespace-only input', () => {
    expect(config.calculate({ numbers: '   ' })).toEqual([]);
  });

  it('returns empty for invalid input', () => {
    expect(config.calculate({ numbers: 'abc, def' })).toEqual([]);
  });

  it('returns empty when mixed valid and invalid', () => {
    // "5, xyz" → only one valid number → needs 2+
    expect(config.calculate({ numbers: '5, xyz' })).toEqual([]);
  });

  it('returns empty for zero in input', () => {
    expect(config.calculate({ numbers: '0, 5' })).toEqual([]);
  });

  it('returns empty for negative numbers', () => {
    expect(config.calculate({ numbers: '-5, 10' })).toEqual([]);
  });

  // ── Educational Content Exists ──────────────────────────────────────
  it('has educational content', () => {
    expect(config.educational).toBeDefined();
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.explanation).toBeTruthy();
  });

  it('has 5+ FAQs', () => {
    expect(config.educational.faqs).toBeDefined();
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
  });

  it('has worked examples', () => {
    expect(config.educational.workedExamples).toBeDefined();
    expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(2);
  });

  it('has pro tips', () => {
    expect(config.educational.proTips).toBeDefined();
    expect(config.educational.proTips!.length).toBeGreaterThanOrEqual(3);
  });

  it('has limitations', () => {
    expect(config.educational.limitations).toBeDefined();
    expect(config.educational.limitations!.length).toBeGreaterThanOrEqual(2);
  });

  it('has quick reference', () => {
    expect(config.educational.quickReference).toBeDefined();
    expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(4);
  });

  // ── Input Configuration ─────────────────────────────────────────────
  it('has inputMode on text input for better mobile keyboard', () => {
    const input = config.inputs.find(i => i.id === 'numbers');
    expect(input).toBeDefined();
    expect(input!.inputMode).toBe('numeric');
  });

  it('text input type supports comma-separated values', () => {
    const input = config.inputs.find(i => i.id === 'numbers');
    expect(input!.type).toBe('text');
    expect(input!.placeholder).toContain(',');
  });
});
