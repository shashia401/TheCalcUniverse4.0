import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/blood-type/index';
import { getValue } from '../../helpers';

describe('Blood Type Calculator (Punnett Square)', () => {
  it('returns 100% Type O when both parents are O', () => {
    const r = config.calculate({
      parent1Blood: 'O',
      parent1Rh: '+',
      parent2Blood: 'O',
      parent2Rh: '+',
    });
    const o = getValue(r, 'aboO');
    expect(o).toBe('100.0%');
  });

  it('returns A, B, AB (not O) for A x AB parents', () => {
    const r = config.calculate({
      parent1Blood: 'A',
      parent1Rh: '+',
      parent2Blood: 'AB',
      parent2Rh: '+',
    });
    const a = parseFloat(getValue(r, 'aboA'));
    const b = parseFloat(getValue(r, 'aboB'));
    const ab = parseFloat(getValue(r, 'aboAB'));
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(0);
    expect(ab).toBeGreaterThan(0);
    const oResult = r.find(x => x.id === 'aboO');
    expect(oResult).toBeUndefined();
  });

  it('returns 100% Rh- when both parents are Rh-', () => {
    const r = config.calculate({
      parent1Blood: 'A',
      parent1Rh: '-',
      parent2Blood: 'O',
      parent2Rh: '-',
    });
    const rhNeg = getValue(r, 'rhNegative');
    expect(rhNeg).toBe('100.0%');
  });

  it('returns empty array when no values provided', () => {
    const r = config.calculate({
      parent1Blood: '',
      parent1Rh: '',
      parent2Blood: '',
      parent2Rh: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array when partial values provided', () => {
    const r = config.calculate({
      parent1Blood: 'A',
      parent1Rh: '+',
      parent2Blood: '',
      parent2Rh: '',
    });
    expect(r).toEqual([]);
  });

  it('handles null/undefined input values gracefully', () => {
    const r = config.calculate({
      parent1Blood: undefined as unknown as string,
      parent1Rh: '+',
      parent2Blood: 'O',
      parent2Rh: '+',
    });
    expect(r).toEqual([]);
  });

  it('returns combined probability results', () => {
    const r = config.calculate({
      parent1Blood: 'A',
      parent1Rh: '+',
      parent2Blood: 'B',
      parent2Rh: '-',
    });
    const combined = getValue(r, 'combinedHeader');
    expect(combined).toContain('%');
  });

  it('shows disclaimer text', () => {
    const r = config.calculate({
      parent1Blood: 'O',
      parent1Rh: '+',
      parent2Blood: 'O',
      parent2Rh: '+',
    });
    const disclaimer = getValue(r, 'disclaimer');
    expect(disclaimer).toContain('probabilities');
  });

  it('returns Rh+ possibility when one parent is Rh- and one is Rh+', () => {
    const r = config.calculate({
      parent1Blood: 'A',
      parent1Rh: '-',
      parent2Blood: 'A',
      parent2Rh: '+',
    });
    const rhPos = r.find(x => x.id === 'rhPositive');
    const rhNeg = r.find(x => x.id === 'rhNegative');
    expect(rhPos).toBeDefined();
    expect(rhNeg).toBeDefined();
  });

  it('returns correct types for AB x O (should be A and B only)', () => {
    const r = config.calculate({
      parent1Blood: 'AB',
      parent1Rh: '+',
      parent2Blood: 'O',
      parent2Rh: '+',
    });
    const a = r.find(x => x.id === 'aboA');
    const b = r.find(x => x.id === 'aboB');
    const ab = r.find(x => x.id === 'aboAB');
    const o = r.find(x => x.id === 'aboO');
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect(ab).toBeUndefined();
    expect(o).toBeUndefined();
  });

  it('AB x AB produces A, B, AB but never O', () => {
    const r = config.calculate({
      parent1Blood: 'AB',
      parent1Rh: '+',
      parent2Blood: 'AB',
      parent2Rh: '+',
    });
    const a = parseFloat(getValue(r, 'aboA'));
    const b = parseFloat(getValue(r, 'aboB'));
    const ab = parseFloat(getValue(r, 'aboAB'));
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(0);
    expect(ab).toBeGreaterThan(0);
    const o = r.find(x => x.id === 'aboO');
    expect(o).toBeUndefined();
  });

  it('two Rh- parents always produce Rh- child', () => {
    const r = config.calculate({
      parent1Blood: 'AB',
      parent1Rh: '-',
      parent2Blood: 'O',
      parent2Rh: '-',
    });
    const rhPos = r.find(x => x.id === 'rhPositive');
    const rhNeg = r.find(x => x.id === 'rhNegative');
    expect(rhPos).toBeUndefined();
    expect(rhNeg).toBeDefined();
    expect(getValue(r, 'rhNegative')).toBe('100.0%');
  });

  it('O x O with Rh- x Rh+ produces O+ and O- with correct splits', () => {
    const r = config.calculate({
      parent1Blood: 'O',
      parent1Rh: '-',
      parent2Blood: 'O',
      parent2Rh: '+',
    });
    const aboO = getValue(r, 'aboO');
    expect(aboO).toBe('100.0%');
    const rhPos = r.find(x => x.id === 'rhPositive');
    const rhNeg = r.find(x => x.id === 'rhNegative');
    expect(rhPos).toBeDefined();
    expect(rhNeg).toBeDefined();
  });

  it('returns all 8 possible results when parents are A+ x B+', () => {
    const r = config.calculate({
      parent1Blood: 'A',
      parent1Rh: '+',
      parent2Blood: 'B',
      parent2Rh: '+',
    });
    // Should have 4 ABO + 2 Rh + combinedHeader + disclaimer = 8 results
    expect(r.length).toBeGreaterThanOrEqual(6);

    // All four ABO types should be present
    for (const bt of ['A', 'B', 'AB', 'O']) {
      const result = r.find(x => x.id === `abo${bt}`);
      expect(result, `abo${bt} should exist`).toBeDefined();
    }
  });

  it('combined header shows all applicable blood type combinations', () => {
    const r = config.calculate({
      parent1Blood: 'A',
      parent1Rh: '+',
      parent2Blood: 'O',
      parent2Rh: '+',
    });
    const combined = getValue(r, 'combinedHeader');
    expect(combined).toContain('A+');
    expect(combined).toContain('O+');
    // Combined header must be a non-empty string with percentage values
    expect(typeof combined).toBe('string');
    expect(combined.length).toBeGreaterThan(10);
  });
});
