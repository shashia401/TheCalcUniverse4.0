import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/gcf/index';
import { getValue } from '../../helpers';

describe('GCF calculator', () => {
  // ── Core Calculations ──────────────────────────────────────────────
  it('GCF of 24 and 36 = 12', () => {
    const r = config.calculate({ a: '24', b: '36' });
    expect(getValue(r, 'gcf')).toBe('12');
  });

  it('GCF of 7 and 13 = 1 (coprime)', () => {
    const r = config.calculate({ a: '7', b: '13' });
    expect(getValue(r, 'gcf')).toBe('1');
  });

  it('GCF of 100 and 25 = 25', () => {
    const r = config.calculate({ a: '100', b: '25' });
    expect(getValue(r, 'gcf')).toBe('25');
  });

  it('GCF of 48 and 72 = 24', () => {
    const r = config.calculate({ a: '48', b: '72' });
    expect(getValue(r, 'gcf')).toBe('24');
  });

  it('GCF of 14 and 15 = 1 (consecutive co-prime)', () => {
    const r = config.calculate({ a: '14', b: '15' });
    expect(getValue(r, 'gcf')).toBe('1');
  });

  it('GCF of same numbers: GCF(42, 42) = 42', () => {
    const r = config.calculate({ a: '42', b: '42' });
    expect(getValue(r, 'gcf')).toBe('42');
  });

  it('GCF of 1 and 100 = 1', () => {
    const r = config.calculate({ a: '1', b: '100' });
    expect(getValue(r, 'gcf')).toBe('1');
  });

  it('GCF of 1 and 1 = 1', () => {
    const r = config.calculate({ a: '1', b: '1' });
    expect(getValue(r, 'gcf')).toBe('1');
  });

  // ── Euclidean Algorithm ─────────────────────────────────────────────
  it('shows Euclidean algorithm steps', () => {
    const r = config.calculate({ a: '24', b: '36' });
    expect(getValue(r, 'euclidSteps')).toContain('GCF');
    expect(getValue(r, 'euclidSteps')).toContain('=');
  });

  it('Euclidean steps are correct for 48 and 18', () => {
    const r = config.calculate({ a: '48', b: '18' });
    expect(getValue(r, 'gcf')).toBe('6');
    expect(getValue(r, 'euclidSteps')).toContain('GCF(48, 18)');
  });

  // ── Prime Factorization Data ────────────────────────────────────────
  it('shows prime factorization data', () => {
    const r = config.calculate({ a: '24', b: '36' });
    expect(getValue(r, '_primeData')).toContain('shared');
    expect(getValue(r, '_primeData')).toContain('shared');
  });

  it('shows shared prime factors', () => {
    const r = config.calculate({ a: '24', b: '36' });
    const sf = getValue(r, 'sharedFactors');
    expect(sf).toContain('2');
    expect(sf).toContain('3');
  });

  it('coprime numbers have empty shared factors display', () => {
    const r = config.calculate({ a: '7', b: '13' });
    expect(getValue(r, 'gcf')).toBe('1');
  });

  // ── Invalid Inputs ──────────────────────────────────────────────────
  it('returns empty for missing inputs', () => {
    expect(config.calculate({ a: '', b: '' })).toEqual([]);
  });

  it('returns empty for invalid inputs', () => {
    expect(config.calculate({ a: 'abc', b: '5' })).toEqual([]);
  });

  it('returns empty for one missing input', () => {
    expect(config.calculate({ a: '24', b: '' })).toEqual([]);
  });

  it('returns empty for zero', () => {
    expect(config.calculate({ a: '0', b: '5' })).toEqual([]);
  });

  it('returns empty for negative numbers', () => {
    expect(config.calculate({ a: '-5', b: '10' })).toEqual([]);
  });

  it('returns empty for NaN', () => {
    expect(config.calculate({ a: 'NaN', b: '10' })).toEqual([]);
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
  it('has inputMode on both number inputs', () => {
    const inputA = config.inputs.find(i => i.id === 'a');
    const inputB = config.inputs.find(i => i.id === 'b');
    expect(inputA).toBeDefined();
    expect(inputB).toBeDefined();
    expect(inputA!.inputMode).toBe('numeric');
    expect(inputB!.inputMode).toBe('numeric');
  });

  it('both inputs have min=1', () => {
    const inputA = config.inputs.find(i => i.id === 'a');
    const inputB = config.inputs.find(i => i.id === 'b');
    expect(inputA!.min).toBe(1);
    expect(inputB!.min).toBe(1);
  });
});
