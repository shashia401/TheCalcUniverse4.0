import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/inverse-trig/index';
import { getValue, near } from '../../helpers';

describe('Inverse Trig Calculator', () => {
  // ─── arcsin ──────────────────────────────────────────────

  it('arcsin(0) = 0°', () => {
    const r = config.calculate({ function: 'arcsin', value: '0' });
    near(parseFloat(getValue(r, 'degrees')), 0);
    near(parseFloat(getValue(r, 'radians')), 0);
    expect(getValue(r, 'degrees')).toContain('°');
  });

  it('arcsin(1) = 90°', () => {
    const r = config.calculate({ function: 'arcsin', value: '1' });
    near(parseFloat(getValue(r, 'degrees')), 90);
    near(parseFloat(getValue(r, 'radians')), Math.PI / 2);
  });

  it('arcsin(-1) = -90°', () => {
    const r = config.calculate({ function: 'arcsin', value: '-1' });
    near(parseFloat(getValue(r, 'degrees')), -90);
  });

  it('arcsin(0.5) = 30°', () => {
    const r = config.calculate({ function: 'arcsin', value: '0.5' });
    near(parseFloat(getValue(r, 'degrees')), 30);
    near(parseFloat(getValue(r, 'radians')), Math.PI / 6, 0.0001);
  });

  it('arcsin(sqrt(2)/2) = 45°', () => {
    const val = Math.SQRT1_2; // 1/sqrt(2) ≈ 0.7071
    const r = config.calculate({ function: 'arcsin', value: val.toString() });
    near(parseFloat(getValue(r, 'degrees')), 45);
  });

  it('arcsin out of domain (2) returns domain error', () => {
    const r = config.calculate({ function: 'arcsin', value: '2' });
    const err = r.find((res) => res.id === 'domainError');
    expect(err).toBeTruthy();
    expect(err!.value).toContain('outside this domain');
  });

  it('arcsin out of domain (-2) returns domain error', () => {
    const r = config.calculate({ function: 'arcsin', value: '-2' });
    const err = r.find((res) => res.id === 'domainError');
    expect(err).toBeTruthy();
  });

  // ─── arccos ──────────────────────────────────────────────

  it('arccos(1) = 0°', () => {
    const r = config.calculate({ function: 'arccos', value: '1' });
    near(parseFloat(getValue(r, 'degrees')), 0);
    near(parseFloat(getValue(r, 'radians')), 0);
  });

  it('arccos(0) = 90°', () => {
    const r = config.calculate({ function: 'arccos', value: '0' });
    near(parseFloat(getValue(r, 'degrees')), 90);
    near(parseFloat(getValue(r, 'radians')), Math.PI / 2);
  });

  it('arccos(-1) = 180°', () => {
    const r = config.calculate({ function: 'arccos', value: '-1' });
    near(parseFloat(getValue(r, 'degrees')), 180);
    near(parseFloat(getValue(r, 'radians')), Math.PI);
  });

  it('arccos(0.5) = 60°', () => {
    const r = config.calculate({ function: 'arccos', value: '0.5' });
    near(parseFloat(getValue(r, 'degrees')), 60);
    near(parseFloat(getValue(r, 'radians')), Math.PI / 3, 0.0001);
  });

  it('arccos out of domain (1.5) returns domain error', () => {
    const r = config.calculate({ function: 'arccos', value: '1.5' });
    expect(r.find((res) => res.id === 'domainError')).toBeTruthy();
  });

  // ─── arctan ──────────────────────────────────────────────

  it('arctan(0) = 0°', () => {
    const r = config.calculate({ function: 'arctan', value: '0' });
    near(parseFloat(getValue(r, 'degrees')), 0);
    near(parseFloat(getValue(r, 'radians')), 0);
  });

  it('arctan(1) = 45°', () => {
    const r = config.calculate({ function: 'arctan', value: '1' });
    near(parseFloat(getValue(r, 'degrees')), 45);
    near(parseFloat(getValue(r, 'radians')), Math.PI / 4, 0.0001);
  });

  it('arctan(∞) approaches 90°', () => {
    const r = config.calculate({ function: 'arctan', value: '1000000' });
    near(parseFloat(getValue(r, 'degrees')), 90, 0.001);
  });

  it('arctan(-∞) approaches -90°', () => {
    const r = config.calculate({ function: 'arctan', value: '-1000000' });
    near(parseFloat(getValue(r, 'degrees')), -90, 0.001);
  });

  it('arctan(-1) = -45°', () => {
    const r = config.calculate({ function: 'arctan', value: '-1' });
    near(parseFloat(getValue(r, 'degrees')), -45);
  });

  // arctan always valid (domain = all real numbers)
  it('arctan never returns domain error', () => {
    const r = config.calculate({ function: 'arctan', value: '999999' });
    expect(r.find((res) => res.id === 'domainError')).toBeFalsy();
  });

  // ─── Principal value output ──────────────────────────────

  it('arcsin(0.5) has principalValue containing 30° and rad', () => {
    const r = config.calculate({ function: 'arcsin', value: '0.5' });
    expect(getValue(r, 'principalValue')).toContain('30');
    expect(getValue(r, 'principalValue')).toContain('rad');
  });

  // ─── Domain check output ────────────────────────────────

  it('domainCheck contains domain info for arcsin', () => {
    const r = config.calculate({ function: 'arcsin', value: '0.5' });
    expect(getValue(r, 'domainCheck')).toContain('[-1, 1]');
  });

  it('domainCheck contains domain info for arctan', () => {
    const r = config.calculate({ function: 'arctan', value: '42' });
    expect(getValue(r, 'domainCheck')).toContain('All real numbers');
  });

  // ─── Edge cases ──────────────────────────────────────────

  it('returns empty for NaN value', () => {
    const r = config.calculate({ function: 'arcsin', value: 'abc' });
    expect(r).toEqual([]);
  });

  it('returns empty for empty input', () => {
    const r = config.calculate({});
    expect(r).toEqual([]);
  });

  it('returns empty for missing value', () => {
    const r = config.calculate({ function: 'arcsin' });
    expect(r).toEqual([]);
  });

  it('returns empty for unknown function', () => {
    const r = config.calculate({ function: 'unknown', value: '0.5' });
    expect(r).toEqual([]);
  });

  // ─── Educational content ──────────────────────────────────

  it('has educational content', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.formulaDescription!.length).toBeGreaterThan(100);
    expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.howToUse!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(2);
    expect(config.educational.commonUses!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.explanation!.length).toBeGreaterThan(300);
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(2);
    expect(config.educational.citations!.length).toBeGreaterThanOrEqual(1);
    expect(config.educational.diagram).toBeTruthy();
    expect(config.educational.diagram!.svg).toBeTruthy();
    expect(config.educational.diagram!.alt).toBeTruthy();
  });
});
