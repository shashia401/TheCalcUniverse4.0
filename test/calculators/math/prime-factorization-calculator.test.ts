import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/prime-factorization/index';
import { getValue, parseNumber } from '../../helpers';

describe('Prime Factorization calculator', () => {
  // ── Core Calculations ──────────────────────────────────────────────
  it('factorizes 72 = 2^3 × 3^2', () => {
    const r = config.calculate({ number: '72' });
    expect(getValue(r, 'factorization')).toBe('2^3 × 3^2');
  });

  it('factorizes 100 = 2^2 × 5^2', () => {
    const r = config.calculate({ number: '100' });
    expect(getValue(r, 'factorization')).toBe('2^2 × 5^2');
  });

  it('factorizes prime number 17 = 17', () => {
    const r = config.calculate({ number: '17' });
    expect(getValue(r, 'factorization')).toBe('17');
    expect(getValue(r, 'primeFactors')).toBe('17');
    expect(getValue(r, 'totalPrimes')).toBe('1');
  });

  it('factorizes 2 = 2', () => {
    const r = config.calculate({ number: '2' });
    expect(getValue(r, 'factorization')).toBe('2');
  });

  it('factorizes 3 (smallest odd prime)', () => {
    const r = config.calculate({ number: '3' });
    expect(getValue(r, 'factorization')).toBe('3');
  });

  it('factorizes 84 = 2^2 × 3 × 7', () => {
    const r = config.calculate({ number: '84' });
    expect(getValue(r, 'factorization')).toBe('2^2 × 3 × 7');
  });

  it('factorizes 144 = 2^4 × 3^2 (perfect square)', () => {
    const r = config.calculate({ number: '144' });
    expect(getValue(r, 'factorization')).toBe('2^4 × 3^2');
  });

  it('factorizes 997 (prime near 1000)', () => {
    const r = config.calculate({ number: '997' });
    expect(getValue(r, 'factorization')).toBe('997');
  });

  it('factorizes 999 = 3^3 × 37', () => {
    const r = config.calculate({ number: '999' });
    expect(getValue(r, 'factorization')).toContain('3^3');
    expect(getValue(r, 'factorization')).toContain('37');
  });

  it('factorizes power of 2: 1024 = 2^10', () => {
    const r = config.calculate({ number: '1024' });
    expect(getValue(r, 'factorization')).toBe('2^10');
  });

  // ── Prime Factors List ──────────────────────────────────────────────
  it('shows distinct prime factors list', () => {
    const r = config.calculate({ number: '72' });
    expect(getValue(r, 'primeFactors')).toBe('2, 3');
  });

  it('shows distinct prime factors for 30 = 2 × 3 × 5', () => {
    const r = config.calculate({ number: '30' });
    expect(getValue(r, 'primeFactors')).toBe('2, 3, 5');
  });

  // ── Total Prime Factors Count ───────────────────────────────────────
  it('shows total count of prime factors with multiplicity', () => {
    const r = config.calculate({ number: '72' });
    expect(getValue(r, 'totalPrimes')).toBe('5'); // 2^3 + 3^2 = 3 + 2 = 5
  });

  it('counts correctly for 84', () => {
    const r = config.calculate({ number: '84' });
    expect(getValue(r, 'totalPrimes')).toBe('4'); // 2^2 + 3 + 7 = 2+1+1 = 4
  });

  // ── Factor Tree Data ────────────────────────────────────────────────
  it('shows factor tree data for panel', () => {
    const r = config.calculate({ number: '72' });
    expect(getValue(r, 'treeData')).toContain('value');
    expect(getValue(r, 'treeData')).toContain('isPrime');
  });

  it('factor tree data is valid JSON with tree structure', () => {
    const r = config.calculate({ number: '72' });
    const tree = JSON.parse(getValue(r, 'treeData'));
    expect(Array.isArray(tree)).toBe(true);
    expect(tree[0].value).toBe(72);
  });

  // ── Invalid Inputs ──────────────────────────────────────────────────
  it('returns empty for number < 2', () => {
    expect(config.calculate({ number: '1' })).toEqual([]);
  });

  it('returns empty for invalid input', () => {
    expect(config.calculate({ number: 'abc' })).toEqual([]);
  });

  it('returns empty for number > 1000000', () => {
    expect(config.calculate({ number: '9999999' })).toEqual([]);
  });

  it('returns empty for NaN', () => {
    expect(config.calculate({ number: 'NaN' })).toEqual([]);
  });

  it('returns empty for empty string', () => {
    expect(config.calculate({ number: '' })).toEqual([]);
  });

  it('returns empty for negative numbers', () => {
    expect(config.calculate({ number: '-5' })).toEqual([]);
  });

  it('returns empty for zero', () => {
    expect(config.calculate({ number: '0' })).toEqual([]);
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

  it('number input has min=2', () => {
    const input = config.inputs.find(i => i.id === 'number');
    expect(input!.min).toBe(2);
  });

  // ── Citations Exist ─────────────────────────────────────────────────
  it('has citations', () => {
    expect(config.educational.citations).toBeDefined();
    expect(config.educational.citations!.length).toBeGreaterThanOrEqual(1);
  });
});
