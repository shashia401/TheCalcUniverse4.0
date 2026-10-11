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

  it('returns A, B, AB (not O) for A × AB parents', () => {
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
    // O should be 0% — check that aboO result doesn't exist or is 0
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

  it('returns correct types for AB × O (should be A and B only)', () => {
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

  // ── Audit regressions: Punnett probabilities recomputed by hand ──
  // A parent: P(passes A)=0.75, P(passes O)=0.25 (AA or AO equally likely); same for B. Rh+ parent: P(passes r)=0.25.
  it('A+ x B+: AB 56.3%, A 18.8%, B 18.8%, O 6.3%; Rh+ 93.8% / Rh- 6.3%; AB+ 52.7%, O- 0.4%', () => {
    const r = config.calculate({ parent1Blood: 'A', parent1Rh: '+', parent2Blood: 'B', parent2Rh: '+' });
    expect(getValue(r, 'aboAB')).toBe('56.3%'); // 0.75 x 0.75 = 0.5625
    expect(getValue(r, 'aboA')).toBe('18.8%');  // 0.75 x 0.25 = 0.1875
    expect(getValue(r, 'aboB')).toBe('18.8%');
    expect(getValue(r, 'aboO')).toBe('6.3%');   // 0.25 x 0.25 = 0.0625
    expect(getValue(r, 'rhPositive')).toBe('93.8%'); // 1 - 0.25 x 0.25
    expect(getValue(r, 'rhNegative')).toBe('6.3%');
    const combined = getValue(r, 'combinedHeader');
    expect(combined).toContain('Type AB+: 52.7%'); // 0.5625 x 0.9375
    expect(combined).toContain('Type O-: 0.4%');   // 0.0625 x 0.0625 = 0.0039
  });

  it('O- x AB+: A 50%, B 50%, no AB or O; Rh+ 75% / Rh- 25%', () => {
    const r = config.calculate({ parent1Blood: 'O', parent1Rh: '-', parent2Blood: 'AB', parent2Rh: '+' });
    expect(getValue(r, 'aboA')).toBe('50.0%');
    expect(getValue(r, 'aboB')).toBe('50.0%');
    expect(r.find((x) => x.id === 'aboAB')).toBeUndefined();
    expect(r.find((x) => x.id === 'aboO')).toBeUndefined();
    expect(getValue(r, 'rhPositive')).toBe('75.0%');
    expect(getValue(r, 'rhNegative')).toBe('25.0%');
  });

  it('A x A: type O only possible via AO x AO (25% under the uniform-genotype prior: 0.25 x 0.25 = 6.25%)', () => {
    const r = config.calculate({ parent1Blood: 'A', parent1Rh: '+', parent2Blood: 'A', parent2Rh: '+' });
    expect(getValue(r, 'aboO')).toBe('6.3%');
    expect(getValue(r, 'aboA')).toBe('93.8%');
  });
});
