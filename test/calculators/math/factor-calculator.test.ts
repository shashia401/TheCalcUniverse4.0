import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/factor/index';
import { getValue, getResult, parseNumber } from '../../helpers';

describe('Factor calculator', () => {
  // ── Core Calculations ──────────────────────────────────────────────
  it('finds factors of 24', () => {
    const r = config.calculate({ number: '24' });
    expect(getValue(r, 'count')).toBe('8');
    expect(getValue(r, 'factorList')).toBe('1, 2, 3, 4, 6, 8, 12, 24');
  });

  it('finds factors of 36 (perfect square)', () => {
    const r = config.calculate({ number: '36' });
    expect(getValue(r, 'count')).toBe('9');
    expect(getValue(r, 'factorList')).toBe('1, 2, 3, 4, 6, 9, 12, 18, 36');
  });

  it('finds factors of 100', () => {
    const r = config.calculate({ number: '100' });
    expect(getValue(r, 'count')).toBe('9');
    expect(getValue(r, 'factorList')).toBe('1, 2, 4, 5, 10, 20, 25, 50, 100');
  });

  it('finds factors of 1 (special case)', () => {
    const r = config.calculate({ number: '1' });
    expect(getValue(r, 'count')).toBe('1');
    expect(getValue(r, 'factorList')).toBe('1');
    expect(getValue(r, 'isPrime')).toBe('No');
  });

  // ── Factor Pairs ────────────────────────────────────────────────────
  it('shows factor pairs for 24', () => {
    const r = config.calculate({ number: '24' });
    expect(getValue(r, 'factorPairs')).toContain('1 × 24');
    expect(getValue(r, 'factorPairs')).toContain('2 × 12');
    expect(getValue(r, 'factorPairs')).toContain('3 × 8');
    expect(getValue(r, 'factorPairs')).toContain('4 × 6');
  });

  it('shows perfect square pair (6 × 6 for 36)', () => {
    const r = config.calculate({ number: '36' });
    expect(getValue(r, 'factorPairs')).toContain('6 × 6');
  });

  it('includes pairs data for panel', () => {
    const r = config.calculate({ number: '12' });
    const val = getValue(r, 'pairsData');
    expect(val).toContain('[');
    const parsed = JSON.parse(val);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
  });

  // ── Sum of Factors ──────────────────────────────────────────────────
  it('sum of factors of 6 (perfect number)', () => {
    const r = config.calculate({ number: '6' });
    // 1 + 2 + 3 + 6 = 12
    expect(getValue(r, 'sum')).toBe('12');
  });

  it('sum of factors of 24', () => {
    const r = config.calculate({ number: '24' });
    // 1+2+3+4+6+8+12+24 = 60
    expect(getValue(r, 'sum')).toBe('60');
  });

  it('sum of factors of 1', () => {
    const r = config.calculate({ number: '1' });
    expect(getValue(r, 'sum')).toBe('1');
  });

  // ── Prime Detection ─────────────────────────────────────────────────
  it('identifies prime numbers', () => {
    expect(getValue(config.calculate({ number: '7' }), 'isPrime')).toBe('Yes');
    expect(getValue(config.calculate({ number: '13' }), 'isPrime')).toBe('Yes');
    expect(getValue(config.calculate({ number: '97' }), 'isPrime')).toBe('Yes');
    expect(getValue(config.calculate({ number: '2' }), 'isPrime')).toBe('Yes');
    expect(getValue(config.calculate({ number: '3' }), 'isPrime')).toBe('Yes');
  });

  it('identifies composite numbers', () => {
    expect(getValue(config.calculate({ number: '8' }), 'isPrime')).toBe('No');
    expect(getValue(config.calculate({ number: '10' }), 'isPrime')).toBe('No');
    expect(getValue(config.calculate({ number: '100' }), 'isPrime')).toBe('No');
  });

  it('identifies 1 as neither prime nor composite', () => {
    const r = config.calculate({ number: '1' });
    expect(getValue(r, 'isPrime')).toBe('No');
    expect(getValue(r, 'count')).toBe('1');
  });

  // ── Large Numbers ───────────────────────────────────────────────────
  it('handles large numbers', () => {
    const r = config.calculate({ number: '997920' });
    expect(parseNumber(getValue(r, 'count'))).toBeGreaterThan(10);
  });

  it('handles the largest safe integer', () => {
    const r = config.calculate({ number: '999983' }); // large prime
    expect(getValue(r, 'isPrime')).toBe('Yes');
  });

  // ── Invalid Inputs ──────────────────────────────────────────────────
  it('returns empty for invalid input', () => {
    expect(config.calculate({ number: 'abc' })).toEqual([]);
  });

  it('returns empty for zero', () => {
    expect(config.calculate({ number: '0' })).toEqual([]);
  });

  it('returns empty for negative numbers', () => {
    expect(config.calculate({ number: '-5' })).toEqual([]);
  });

  it('returns empty for empty string', () => {
    expect(config.calculate({ number: '' })).toEqual([]);
  });

  it('returns empty for NaN', () => {
    expect(config.calculate({ number: 'NaN' })).toEqual([]);
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
    expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(3);
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
  it('has inputMode on number input', () => {
    const input = config.inputs.find(i => i.id === 'number');
    expect(input).toBeDefined();
    expect(input!.inputMode).toBe('numeric');
  });

  it('number input has min=1', () => {
    const input = config.inputs.find(i => i.id === 'number');
    expect(input!.min).toBe(1);
  });

  // ── Aux Data for Extra Panel ────────────────────────────────────────
  it('produces _pairsData for extra panel', () => {
    const r = config.calculate({ number: '30' });
    expect(getValue(r, '_pairsData')).toContain('[');
    const parsed = JSON.parse(getValue(r, '_pairsData'));
    expect(parsed.length).toBe(4); // 30 has 4 factor pairs: 1x30, 2x15, 3x10, 5x6
  });
});
